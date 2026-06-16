import { claudeProvider } from "./claude";
import { elevenLabsProvider } from "./elevenlabs";
import { falAiProvider } from "./falai";
import type {
  ImageProvider,
  LLMProvider,
  ProviderHealth,
  TTSProvider,
} from "./types";

const llmProviders: LLMProvider[] = [claudeProvider];
const ttsProviders: TTSProvider[] = [elevenLabsProvider];
const imageProviders: ImageProvider[] = [falAiProvider];

function selectProvider<T extends { isConfigured(): boolean }>(
  providers: T[],
): T {
  const configured = providers.find((p) => p.isConfigured());
  if (configured) {
    return configured;
  }
  const first = providers[0];
  if (!first) {
    throw new Error("No providers registered");
  }
  return first;
}

/** Returns the first configured LLM provider, or the first registered one. */
export function getLLM(): LLMProvider {
  return selectProvider(llmProviders);
}

/** Returns the first configured TTS provider, or the first registered one. */
export function getTTS(): TTSProvider {
  return selectProvider(ttsProviders);
}

/** Returns the first configured image provider, or the first registered one. */
export function getImage(): ImageProvider {
  return selectProvider(imageProviders);
}

/** Runs healthCheck on every registered provider. */
export async function healthCheckAll(): Promise<ProviderHealth[]> {
  const all: Array<LLMProvider | TTSProvider | ImageProvider> = [
    ...llmProviders,
    ...ttsProviders,
    ...imageProviders,
  ];
  return Promise.all(all.map((p) => p.healthCheck()));
}
