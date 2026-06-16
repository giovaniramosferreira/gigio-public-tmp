import { generateJson } from "@/lib/llm-json";
import { log } from "@/lib/logger";
import { ideaRepo } from "@/server/repositories/idea";
import { scriptRepo } from "@/server/repositories/script";
import { scriptPackageSchema, type ScriptPackageOutput } from "./schemas";
import { checkOriginality } from "./originality";

const logger = log("script");

const CHANNEL_THESIS =
  "AI is changing the world in ways people are not talking about enough — especially the side effects.";

/** Persist a script package output to a (new or existing) ScriptPackage row. */
function buildScriptData(idea: { title: string }, out: ScriptPackageOutput) {
  return {
    title: out.title_variants[0] ?? idea.title,
    thesis: out.thesis,
    audienceFrame: out.audience_frame,
    hookVariantsJson: JSON.stringify(out.hook_variants),
    selectedHook: out.selected_hook,
    beatPlanJson: JSON.stringify(out.beat_plan),
    fullScript: out.full_script,
    wordCount: out.word_count,
    estimatedDurationSeconds: out.estimated_duration_seconds,
  };
}

/**
 * Generate a script package for a selected idea (FR-04), then run the
 * originality guard (FR-05). Stores generation provenance. Returns the script id.
 */
export async function generateScript(ideaId: string): Promise<string> {
  const idea = await ideaRepo.findById(ideaId);
  if (!idea) throw new Error(`Idea ${ideaId} not found`);

  const recentOpenings = await scriptRepo.recentOpenings(idea.channelId, 25);

  const { data, model, promptVersion } = await generateJson(
    "script/generate-script",
    {
      channel_thesis: CHANNEL_THESIS,
      tone_profile: "intelligent but clear, slightly unsettling, high-signal, editorial",
      idea_title: idea.title,
      idea_angle: idea.angle ?? "",
      idea_why_underdiscussed: idea.whyUnderdiscussed ?? "",
      pillar_name: idea.pillar?.name ?? "",
      recent_openings: recentOpenings.join("\n"),
    },
    scriptPackageSchema,
    { maxTokens: 4096, temperature: 0.9 },
  );

  const originality = await checkOriginality(idea.channelId, {
    title: data.title_variants[0] ?? idea.title,
    selected_hook: data.selected_hook,
    thesis: data.thesis,
    full_script: data.full_script,
  });

  const existing = await scriptRepo.findByIdeaId(ideaId);
  const baseData = {
    ...buildScriptData(idea, data),
    status: originality.decision === "BLOCK" ? "BLOCKED" : "CRITIC_REVIEW",
    criticNotesJson: JSON.stringify({ titleVariants: data.title_variants, safetyNotes: data.safety_notes }),
    originalityScore: Math.round(originality.aggregateOriginality * 100),
    generationModel: model,
    generationPromptVersion: promptVersion,
  };

  let scriptId: string;
  if (existing) {
    const updated = await scriptRepo.update(existing.id, baseData);
    scriptId = updated.id;
  } else {
    const created = await scriptRepo.create({
      ...baseData,
      contentIdea: { connect: { id: ideaId } },
    });
    scriptId = created.id;
  }

  // Persist the originality report alongside the script for the review UI.
  await scriptRepo.update(scriptId, {
    criticNotesJson: JSON.stringify({
      titleVariants: data.title_variants,
      safetyNotes: data.safety_notes,
      originality,
    }),
  });

  await ideaRepo.update(ideaId, { status: "SCRIPT_READY" });

  logger.info(
    { scriptId, originality: originality.decision, model, promptVersion },
    "script generated",
  );
  return scriptId;
}
