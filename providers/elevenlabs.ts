import { mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { env } from "@/lib/env";
import { withRetry, withTimeout } from "./retry";
import {
  ProviderError,
  type ProviderHealth,
  type TTSProvider,
  type TTSSynthesizeInput,
  type TTSSynthesizeResult,
  type TTSVoice,
} from "./types";

const API_BASE = "https://api.elevenlabs.io/v1";

interface ElevenLabsVoicesResponse {
  voices?: Array<{ voice_id?: string; name?: string }>;
}

export class ElevenLabsProvider implements TTSProvider {
  readonly name = "elevenlabs";
  readonly capability = "tts" as const;

  isConfigured(): boolean {
    return !!env.ELEVENLABS_API_KEY;
  }

  async synthesize(input: TTSSynthesizeInput): Promise<TTSSynthesizeResult> {
    if (!this.isConfigured()) {
      throw new ProviderError(
        "PROVIDER_NOT_CONFIGURED",
        "ElevenLabs provider is not configured: ELEVENLABS_API_KEY is missing",
      );
    }

    const apiKey = env.ELEVENLABS_API_KEY as string;

    return withRetry(() =>
      withTimeout(
        (async (): Promise<TTSSynthesizeResult> => {
          const response = await fetch(
            `${API_BASE}/text-to-speech/${input.voiceId}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": apiKey,
                "Content-Type": "application/json",
                Accept: "audio/mpeg",
              },
              body: JSON.stringify({
                text: input.text,
                model_id: env.ELEVENLABS_MODEL,
                voice_settings: input.settings,
              }),
            },
          );

          if (!response.ok) {
            const body = await response.text().catch(() => "");
            throw new ProviderError(
              "PROVIDER_ERROR",
              `ElevenLabs synthesize failed: ${response.status} ${response.statusText}`,
              body,
            );
          }

          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          await mkdir(dirname(input.outputPath), { recursive: true });
          await writeFile(input.outputPath, buffer);

          const providerRequestId =
            response.headers.get("request-id") ?? undefined;

          return {
            filePath: input.outputPath,
            format: "mp3",
            fileSizeBytes: buffer.length,
            providerRequestId,
          };
        })(),
        120000,
        "elevenlabs.synthesize",
      ),
    );
  }

  async listVoices(): Promise<TTSVoice[]> {
    if (!this.isConfigured()) {
      return [];
    }

    const apiKey = env.ELEVENLABS_API_KEY as string;

    const response = await fetch(`${API_BASE}/voices`, {
      method: "GET",
      headers: {
        "xi-api-key": apiKey,
      },
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new ProviderError(
        "PROVIDER_ERROR",
        `ElevenLabs listVoices failed: ${response.status} ${response.statusText}`,
        body,
      );
    }

    const data = (await response.json()) as ElevenLabsVoicesResponse;
    const voices = data.voices ?? [];

    return voices
      .filter(
        (v): v is { voice_id: string; name: string } =>
          typeof v.voice_id === "string" && typeof v.name === "string",
      )
      .map((v) => ({ id: v.voice_id, name: v.name }));
  }

  chunkText(text: string, maxChars = 2500): string[] {
    if (text.length <= maxChars) {
      return text.length > 0 ? [text] : [];
    }

    // Split on sentence boundaries while keeping the delimiter attached.
    const sentences = this.splitIntoSentences(text);

    const chunks: string[] = [];
    let current = "";

    const pushCurrent = () => {
      const trimmed = current.trim();
      if (trimmed.length > 0) {
        chunks.push(trimmed);
      }
      current = "";
    };

    for (const sentence of sentences) {
      // A single sentence longer than maxChars must be hard-split.
      if (sentence.length > maxChars) {
        pushCurrent();
        for (let i = 0; i < sentence.length; i += maxChars) {
          chunks.push(sentence.slice(i, i + maxChars));
        }
        continue;
      }

      if (current.length + sentence.length > maxChars) {
        pushCurrent();
      }
      current += sentence;
    }

    pushCurrent();

    return chunks;
  }

  private splitIntoSentences(text: string): string[] {
    // Break after sentence-ending punctuation followed by whitespace, and after
    // newlines, preserving the original characters.
    const parts: string[] = [];
    let start = 0;

    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const next = text[i + 1];

      const isSentenceEnd =
        (char === "." || char === "!" || char === "?") &&
        (next === " " || next === "\n" || next === undefined);
      const isNewline = char === "\n";

      if (isSentenceEnd || isNewline) {
        // Include the boundary char and any immediately trailing whitespace.
        let end = i + 1;
        while (end < text.length && (text[end] === " " || text[end] === "\n")) {
          end++;
        }
        parts.push(text.slice(start, end));
        start = end;
        i = end - 1;
      }
    }

    if (start < text.length) {
      parts.push(text.slice(start));
    }

    return parts;
  }

  async healthCheck(): Promise<ProviderHealth> {
    const checkedAt = new Date().toISOString();

    if (!this.isConfigured()) {
      return {
        capability: this.capability,
        provider: this.name,
        configured: false,
        healthy: false,
        message: "ELEVENLABS_API_KEY is missing",
        checkedAt,
      };
    }

    try {
      await this.listVoices();
      return {
        capability: this.capability,
        provider: this.name,
        configured: true,
        healthy: true,
        checkedAt: new Date().toISOString(),
      };
    } catch (error) {
      return {
        capability: this.capability,
        provider: this.name,
        configured: true,
        healthy: false,
        message: error instanceof Error ? error.message : String(error),
        checkedAt: new Date().toISOString(),
      };
    }
  }
}

export const elevenLabsProvider = new ElevenLabsProvider();
