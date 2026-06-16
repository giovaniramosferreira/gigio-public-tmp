import { generateJson } from "@/lib/llm-json";
import { env } from "@/lib/env";
import { log } from "@/lib/logger";
import { fileExists } from "@/lib/storage";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import {
  captionRepo,
  qaRepo,
  thumbnailRepo,
  voiceRepo,
} from "@/server/repositories/production";
import { qaResultSchema } from "./schemas";
import { checkOriginality } from "./originality";

const logger = log("qa");

export type QADecision = "PASS" | "REVIEW" | "BLOCK";

interface ReasonCode {
  code: string;
  detail: string;
}

/**
 * QA engine (FR-14). Combines a content/policy LLM review with deterministic
 * technical and originality checks into a single PASS / REVIEW / BLOCK decision
 * with reason codes. Hard technical failures (missing render, no audio,
 * out-of-range duration) force a BLOCK regardless of the content score.
 */
export async function runQA(videoProjectId: string): Promise<{ decision: QADecision }> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Video project has no script");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script) throw new Error("Script not found for project");

  const reasons: ReasonCode[] = [];

  // ---- Technical integrity checks (deterministic) ----
  let technicalRisk = 0;
  const voice = await voiceRepo.latestForScript(script.id);
  if (!voice?.audioFilePath || !(await fileExists(voice.audioFilePath))) {
    reasons.push({ code: "MISSING_AUDIO", detail: "No rendered voice audio found" });
    technicalRisk = 1;
  }
  if (!project.previewFilePath || !(await fileExists(project.previewFilePath))) {
    reasons.push({ code: "MISSING_PREVIEW", detail: "No preview render found" });
    technicalRisk = 1;
  }
  const dur = project.durationSeconds ?? 0;
  if (project.previewFilePath && (dur < 15 || dur > 70)) {
    reasons.push({ code: "DURATION_OUT_OF_RANGE", detail: `Duration ${dur}s outside 15-70s` });
    technicalRisk = Math.max(technicalRisk, 0.6);
  }
  const captions = await captionRepo.findByScript(script.id);
  if (!captions?.srtPath) {
    reasons.push({ code: "MISSING_CAPTIONS", detail: "No caption track generated" });
    technicalRisk = Math.max(technicalRisk, 0.4);
  }
  const thumbs = await thumbnailRepo.listForVideo(videoProjectId);
  if (thumbs.length < 3) {
    reasons.push({ code: "FEW_THUMBNAILS", detail: `Only ${thumbs.length} thumbnail variants` });
  }

  // ---- Originality recheck (deterministic) ----
  const originality = await checkOriginality(
    project.channelId,
    {
      title: script.title,
      selected_hook: script.selectedHook ?? "",
      thesis: script.thesis ?? "",
      full_script: script.fullScript ?? "",
    },
    script.id,
  );
  const originalityRisk = 1 - originality.aggregateOriginality;
  if (originality.decision === "BLOCK") {
    reasons.push({ code: "ORIGINALITY_BLOCK", detail: "Originality guard blocked the package" });
  } else if (originality.decision === "REVIEW") {
    reasons.push({ code: "ORIGINALITY_REVIEW", detail: "Originality borderline; review advised" });
  }

  // ---- Content / policy LLM review (best-effort) ----
  let contentDecision: QADecision = "PASS";
  let reusedRisk = originalityRisk;
  let overclaimRisk = 0;
  try {
    const { data } = await generateJson(
      "qa/qa-review",
      {
        title: script.title,
        full_script: script.fullScript ?? "",
        thesis: script.thesis ?? "",
        recent_packages_summary: "",
      },
      qaResultSchema,
      { maxTokens: 1536, temperature: 0.3 },
    );
    contentDecision = data.decision;
    reusedRisk = Math.max(reusedRisk, data.reused_risk_score);
    overclaimRisk = data.overclaim_risk_score;
    for (const r of data.reason_codes) reasons.push(r);
  } catch (err) {
    // No LLM (e.g. no key): fall back to deterministic signals only.
    reasons.push({
      code: "QA_LLM_SKIPPED",
      detail: `Content QA skipped: ${(err as Error).message}`,
    });
  }

  // ---- Aggregate decision ----
  let decision: QADecision = "PASS";
  if (
    technicalRisk >= 1 ||
    originality.decision === "BLOCK" ||
    contentDecision === "BLOCK" ||
    reusedRisk > env.REUSED_RISK_BLOCK_THRESHOLD ||
    overclaimRisk > 0.7
  ) {
    decision = "BLOCK";
  } else if (
    technicalRisk > 0 ||
    originality.decision === "REVIEW" ||
    contentDecision === "REVIEW"
  ) {
    decision = "REVIEW";
  }

  const overall = Math.round(
    (originality.aggregateOriginality * 0.4 +
      (1 - reusedRisk) * 0.2 +
      (1 - overclaimRisk) * 0.2 +
      (1 - technicalRisk) * 0.2) *
      100,
  );

  await qaRepo.create({
    videoProject: { connect: { id: videoProjectId } },
    decision,
    overallScore: overall,
    originalityRiskScore: originalityRisk,
    reusedRiskScore: reusedRisk,
    technicalRiskScore: technicalRisk,
    reasonCodesJson: JSON.stringify(reasons),
    reportJson: JSON.stringify({ originality, contentDecision, overclaimRisk }),
    completedAt: new Date(),
  });

  await videoRepo.update(videoProjectId, {
    status: decision === "BLOCK" ? "QA_RUNNING" : "REVIEW_READY",
  });

  logger.info({ videoProjectId, decision, overall }, "qa complete");
  return { decision };
}
