import { generateJson } from "@/lib/llm-json";
import { log } from "@/lib/logger";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import { metadataRepo } from "@/server/repositories/production";
import { metadataSchema } from "./schemas";

const logger = log("metadata");

/**
 * Metadata generation (FR-12). Produces native-sounding titles, descriptions,
 * hashtags, and a pinned comment for the video, plus overclaim/policy risk
 * notes. Persists the package with the chosen variants selected.
 */
export async function generateMetadata(videoProjectId: string): Promise<string> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Projeto de vídeo não tem roteiro");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script) throw new Error("Roteiro não encontrado para o projeto");

  const { data, model, promptVersion } = await generateJson(
    "title/generate-metadata",
    {
      thesis: script.thesis ?? "",
      full_script: script.fullScript ?? "",
      selected_hook: script.selectedHook ?? "",
      pillar_name: script.contentIdea.pillar?.name ?? "",
      recent_title_patterns: "",
    },
    metadataSchema,
    { maxTokens: 2048, temperature: 0.8 },
  );

  await metadataRepo.upsertForVideo(videoProjectId, {
    titlesJson: JSON.stringify(data.titles),
    title: data.selected_title,
    descriptionsJson: JSON.stringify(data.descriptions),
    description: data.selected_description,
    hashtagsJson: JSON.stringify(data.hashtags),
    pinnedComment: data.pinned_comment,
    riskNotesJson: JSON.stringify({ riskNotes: data.risk_notes, model, promptVersion }),
    language: "en",
    visibility: "private",
  });

  logger.info({ videoProjectId, titles: data.titles.length }, "metadata generated");
  return videoProjectId;
}
