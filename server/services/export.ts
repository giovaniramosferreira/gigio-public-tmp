import { promises as fs } from "fs";
import path from "path";
import { log } from "@/lib/logger";
import { exportFolder, ensureDir, fileExists, slugify } from "@/lib/storage";
import { scriptRepo } from "@/server/repositories/script";
import { videoRepo } from "@/server/repositories/video";
import {
  assetPlanRepo,
  captionRepo,
  metadataRepo,
  publishRepo,
  qaRepo,
  thumbnailRepo,
} from "@/server/repositories/production";

const logger = log("export");

/**
 * Publishing package export (FR-15). Assembles all upload materials into a
 * single folder following the documented convention (docs section 22.3):
 * final.mp4, thumbnails, metadata.json, script.txt, qa-report.json,
 * provenance.json, upload-notes.md. Requires the video to be approved.
 */
export async function exportPackage(videoProjectId: string): Promise<string> {
  const project = await videoRepo.findById(videoProjectId);
  if (!project?.scriptPackageId) throw new Error("Projeto de vídeo não tem roteiro");
  const script = await scriptRepo.findById(project.scriptPackageId);
  if (!script) throw new Error("Roteiro não encontrado para o projeto");

  const publish = await publishRepo.findByVideo(videoProjectId);
  if (publish?.approvalStatus !== "APPROVED") {
    throw new Error("O vídeo deve ser aprovado antes de exportar");
  }

  const slug = slugify(script.title);
  const folder = exportFolder(slug);
  await ensureDir(folder);

  const metadata = await metadataRepo.findByVideo(videoProjectId);
  const qa = await qaRepo.latestForVideo(videoProjectId);
  const captions = await captionRepo.findByScript(script.id);
  const assetPlan = await assetPlanRepo.findByScript(script.id);
  const thumbnails = await thumbnailRepo.listForVideo(videoProjectId);

  // 1. final.mp4
  let videoFilePath: string | null = null;
  if (project.previewFilePath && (await fileExists(project.previewFilePath))) {
    videoFilePath = path.join(folder, "final.mp4");
    await fs.copyFile(project.previewFilePath, videoFilePath);
  }

  // 2. thumbnails
  let thumbnailFilePath: string | null = null;
  for (const thumb of thumbnails) {
    if (thumb.imagePath && (await fileExists(thumb.imagePath))) {
      const dest = path.join(folder, `thumbnail-${thumb.variantLabel.toLowerCase()}.png`);
      await fs.copyFile(thumb.imagePath, dest);
      if (thumb.isSelected) thumbnailFilePath = dest;
    }
  }

  // 3. captions
  let captionsPath: string | null = null;
  if (captions?.srtPath && (await fileExists(captions.srtPath))) {
    captionsPath = path.join(folder, "captions.srt");
    await fs.copyFile(captions.srtPath, captionsPath);
  }

  // 4. metadata.json
  const metadataJsonPath = path.join(folder, "metadata.json");
  await fs.writeFile(
    metadataJsonPath,
    JSON.stringify(
      {
        title: metadata?.title ?? script.title,
        description: metadata?.description ?? "",
        hashtags: metadata?.hashtagsJson ? JSON.parse(metadata.hashtagsJson) : [],
        pinnedComment: metadata?.pinnedComment ?? "",
        language: metadata?.language ?? "en",
        visibility: metadata?.visibility ?? "private",
        madeForKids: false,
      },
      null,
      2,
    ),
  );

  // 5. script.txt
  await fs.writeFile(
    path.join(folder, "script.txt"),
    `${script.title}\n\nHOOK: ${script.selectedHook ?? ""}\n\n${script.fullScript ?? ""}\n`,
  );

  // 6. qa-report.json
  await fs.writeFile(
    path.join(folder, "qa-report.json"),
    JSON.stringify(
      {
        decision: qa?.decision,
        overallScore: qa?.overallScore,
        reasonCodes: qa?.reasonCodesJson ? JSON.parse(qa.reasonCodesJson) : [],
        report: qa?.reportJson ? JSON.parse(qa.reportJson) : null,
      },
      null,
      2,
    ),
  );

  // 7. provenance.json
  await fs.writeFile(
    path.join(folder, "provenance.json"),
    JSON.stringify(
      {
        scriptModel: script.generationModel,
        promptVersion: script.generationPromptVersion,
        assets: assetPlan?.provenanceJson ? JSON.parse(assetPlan.provenanceJson) : null,
        originalityScore: script.originalityScore,
        rewriteCount: script.rewriteCount,
      },
      null,
      2,
    ),
  );

  // 8. upload-notes.md
  await fs.writeFile(
    path.join(folder, "upload-notes.md"),
    [
      `# Upload Notes — ${metadata?.title ?? script.title}`,
      "",
      "## Checklist",
      "- [ ] Upload final.mp4 as a Short (9:16)",
      "- [ ] Set title and description from metadata.json",
      "- [ ] Add hashtags to the description",
      "- [ ] Upload selected thumbnail/cover if applicable",
      "- [ ] Post the pinned comment",
      "- [ ] Confirm visibility setting",
      "",
      `QA decision: ${qa?.decision ?? "n/a"}`,
    ].join("\n"),
  );

  await publishRepo.upsertForVideo(videoProjectId, {
    exportFolderPath: folder,
    videoFilePath,
    thumbnailFilePath,
    metadataJsonPath,
    captionsPath,
    status: "READY",
  });

  await videoRepo.update(videoProjectId, { status: "EXPORTED", exportFilePath: videoFilePath });
  logger.info({ videoProjectId, folder }, "package exported");
  return folder;
}
