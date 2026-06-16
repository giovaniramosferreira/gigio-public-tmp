import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { env } from "@/lib/env";
import { withRetry, withTimeout } from "./retry";
import {
  ProviderError,
  type ImageGenerateInput,
  type ImageGenerateResult,
  type ImageProvider,
  type ProviderHealth,
} from "./types";

interface FalImageResult {
  request_id?: string;
  images?: Array<{ url?: string; width?: number; height?: number }>;
}

export class FalAiProvider implements ImageProvider {
  readonly name = "falai";
  readonly capability = "image" as const;

  isConfigured(): boolean {
    return !!env.FAL_AI_API_KEY;
  }

  async generate(input: ImageGenerateInput): Promise<ImageGenerateResult> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        "PROVIDER_NOT_CONFIGURED",
        "fal.ai provider is not configured: FAL_AI_API_KEY is missing",
      );
    }

    const apiKey = env.FAL_AI_API_KEY as string;
    const width = input.width ?? 1080;
    const height = input.height ?? 1920;

    return withRetry(() =>
      withTimeout(
        (async (): Promise<ImageGenerateResult> => {
          const response = await fetch(`https://fal.run/${env.FAL_AI_MODEL}`, {
            method: "POST",
            headers: {
              Authorization: `Key ${apiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              prompt: input.prompt,
              image_size: { width, height },
            }),
          });

          if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new ProviderError(
              "PROVIDER_ERROR",
              `fal.ai generate failed: ${response.status} ${response.statusText}`,
              body,
            );
          }

          const data = (await response.json()) as FalImageResult;
          const image = data.images?.[0];
          const imageUrl = image?.url;

          if (!imageUrl) {
            throw new ProviderError(
              "PROVIDER_ERROR",
              "fal.ai response did not include an image URL",
              data,
            );
          }

          const imageResponse = await fetch(imageUrl);
          if (!imageResponse.ok) {
            throw new ProviderError(
              "PROVIDER_ERROR",
              `fal.ai image download failed: ${imageResponse.status} ${imageResponse.statusText}`,
            );
          }

          const arrayBuffer = await imageResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          await mkdir(dirname(input.outputPath), { recursive: true });
          await writeFile(input.outputPath, buffer);

          return {
            filePath: input.outputPath,
            format: inferFormatFromUrl(imageUrl),
            width: image?.width ?? width,
            height: image?.height ?? height,
            fileSizeBytes: buffer.length,
            providerRequestId: data.request_id,
            raw: data,
          };
        })(),
        180000,
        "falai.generate",
      ),
    );
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();
    const configured = this.isConfigured();

    return {
      capability: this.capability,
      provider: this.name,
      configured,
      healthy: configured,
      message: configured
        ? "key present, generation not tested"
        : "FAL_AI_API_KEY is missing",
      checkedAt,
    };
  }
}

function inferFormatFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    const match = pathname.match(/\.([a-zA-Z0-9]+)$/);
    if (match) {
      return match[1].toLowerCase();
    }
  } catch {
    // ignore malformed URLs and fall through to default
  }
  return "png";
}

export const falAiProvider = new FalAiProvider();
