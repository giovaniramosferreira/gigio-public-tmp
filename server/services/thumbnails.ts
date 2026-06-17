import { log } from "@/lib/logger";
import { dataPath, ensureParentDir, slugify } from "@/lib/storage";
import { scoreThumbnailText } from "@/lib/readability";
import { maxSimilarity } from "@/lib/similarity";
import { getImage } from "@/providers";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import { thumbnailRepo } from "@/server/repositories/production";

const logger = log("thumbnails");

const VISUAL_IDENTITY =
  "Capa editorial contida, texto de sobreposição em negrito legível, paleta suave, forte contraste figura-fundo. Sem imagens clichê de IA.";

/**
 * Thumbnail / cover frame system (FR-11). Generates at least 3 variants with
 * distinct overlay text, scores each for readability, and measures pairwise
 * similarity to discourage template sameness. Marks the strongest as selected.
 */
export async function generateThumbnails(videoProjectId: string): Promise<string> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Projeto de vídeo não tem roteiro");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script) throw new Error("Roteiro não encontrado para o projeto");

  const notes = script.criticNotesJson ? JSON.parse(script.criticNotesJson) : {};
  const titleVariants: string[] = notes.titleVariants ?? [script.title];

  // Derive up to 3 distinct short overlay texts from title variants + hook.
  const candidates = Array.from(
    new Set(
      [...titleVariants, script.selectedHook ?? script.title]
        .filter(Boolean)
        .map((t) => shorten(t)),
    ),
  ).slice(0, 3);
  while (candidates.length < 3) candidates.push(shorten(script.title));

  const image = getImage();
  const slug = slugify(script.title);
  await thumbnailRepo.deleteForVideo(videoProjectId);

  const labels = ["A", "B", "C"];
  const overlaysSoFar: string[] = [];

  for (let i = 0; i < candidates.length; i++) {
    const overlay = candidates[i];
    const readability = scoreThumbnailText(overlay);
    const similarity =
      overlaysSoFar.length > 0 ? maxSimilarity(overlay, overlaysSoFar).score : 0;
    overlaysSoFar.push(overlay);

    const outPath = dataPath("assets", slug, `thumb-${labels[i].toLowerCase()}.png`);
    let imagePath: string | null = null;
    let provider: string | null = null;

    if (image.isConfigured()) {
      try {
        await ensureParentDir(outPath);
        const result = await image.generate({
          prompt: `${VISUAL_IDENTITY} Concept: ${overlay}. ${notes.safetyNotes ? "" : ""}`,
          width: 1080,
          height: 1920,
          outputPath: outPath,
        });
        imagePath = result.filePath;
        provider = image.name;
      } catch (err) {
        logger.warn({ label: labels[i], err: (err as Error).message }, "thumbnail gen failed");
      }
    }

    await thumbnailRepo.create({
      videoProject: { connect: { id: videoProjectId } },
      variantLabel: labels[i],
      imagePath,
      prompt: overlay,
      provider,
      readabilityScore: readability,
      similarityScore: similarity,
      width: imagePath ? 1080 : null,
      height: imagePath ? 1920 : null,
      format: imagePath ? "png" : null,
      isSelected: false,
    });
  }

  // Select the highest-readability, lowest-similarity variant. A combined
  // score rewards readability and penalizes similarity to sibling variants.
  const created = await thumbnailRepo.listForVideo(videoProjectId);
  const combined = (t: (typeof created)[number]) =>
    (t.readabilityScore ?? 0) - (t.similarityScore ?? 0) * 30;
  const best = created.slice().sort((a, b) => combined(b) - combined(a))[0];
  if (best) await markSelected(videoProjectId, best.id);

  logger.info({ videoProjectId, variants: created.length }, "thumbnails ready");
  return videoProjectId;
}

async function markSelected(videoProjectId: string, thumbnailId: string): Promise<void> {
  const { prisma } = await import("@/lib/db");
  await prisma.thumbnailVariant.updateMany({
    where: { videoProjectId },
    data: { isSelected: false },
  });
  await prisma.thumbnailVariant.update({
    where: { id: thumbnailId },
    data: { isSelected: true },
  });
}

/** Reduce a title to a punchy 2-5 word thumbnail overlay. */
function shorten(text: string): string {
  const cleaned = text.replace(/[.!?]+$/, "").trim();
  const words = cleaned.split(/\s+/);
  if (words.length <= 5) return cleaned;
  return words.slice(0, 5).join(" ");
}
