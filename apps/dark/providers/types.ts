export type ProviderCapability = "llm" | "tts" | "image";

export interface ProviderHealth {
  capability: ProviderCapability;
  provider: string;
  configured: boolean; // keys present
  healthy: boolean; // last check passed
  message?: string;
  checkedAt: string; // ISO
}

// LLM
export interface LLMMessage {
  role: "user" | "assistant";
  content: string;
}
export interface LLMGenerateInput {
  system?: string;
  messages: LLMMessage[];
  maxTokens?: number;
  temperature?: number;
}
export interface LLMGenerateResult {
  text: string;
  model: string;
  usage?: { inputTokens: number; outputTokens: number };
  raw?: unknown;
}
export interface LLMProvider {
  readonly name: string;
  readonly capability: "llm";
  isConfigured(): boolean;
  generate(input: LLMGenerateInput): Promise<LLMGenerateResult>;
  healthCheck(): Promise<ProviderHealth>;
}

// TTS
export interface TTSSynthesizeInput {
  text: string;
  voiceId: string;
  settings?: Record<string, unknown>;
  outputPath: string; // absolute path to write audio file
}
export interface TTSSynthesizeResult {
  filePath: string;
  format: string;
  durationSeconds?: number;
  fileSizeBytes?: number;
  providerRequestId?: string;
  raw?: unknown;
}
export interface TTSVoice {
  id: string;
  name: string;
}
export interface TTSProvider {
  readonly name: string;
  readonly capability: "tts";
  isConfigured(): boolean;
  synthesize(input: TTSSynthesizeInput): Promise<TTSSynthesizeResult>;
  listVoices(): Promise<TTSVoice[]>;
  // Split long text into provider-safe chunks (by char limit, on sentence boundaries).
  chunkText(text: string, maxChars?: number): string[];
  healthCheck(): Promise<ProviderHealth>;
}

// Image
export interface ImageGenerateInput {
  prompt: string;
  width?: number;
  height?: number;
  outputPath: string; // absolute path to write image file
}
export interface ImageGenerateResult {
  filePath: string;
  format: string;
  width?: number;
  height?: number;
  fileSizeBytes?: number;
  providerRequestId?: string;
  raw?: unknown;
}
export interface ImageProvider {
  readonly name: string;
  readonly capability: "image";
  isConfigured(): boolean;
  generate(input: ImageGenerateInput): Promise<ImageGenerateResult>;
  healthCheck(): Promise<ProviderHealth>;
}

export class ProviderError extends Error {
  constructor(
    public code: "PROVIDER_ERROR" | "PROVIDER_TIMEOUT" | "PROVIDER_NOT_CONFIGURED",
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ProviderError";
  }
}
