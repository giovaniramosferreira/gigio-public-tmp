import { z } from "zod";

/**
 * Environment schema. Validated once at module load. Server-only values are
 * optional at boot so the app can render the provider settings screen even
 * before keys are configured; individual services assert presence at call time.
 */
const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("file:../data/db/darktube.db"),

  // LLM — Anthropic / Claude
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default("claude-sonnet-4-6"),

  // TTS — ElevenLabs
  ELEVENLABS_API_KEY: z.string().optional(),
  ELEVENLABS_DEFAULT_VOICE_ID: z.string().optional(),
  ELEVENLABS_MODEL: z.string().default("eleven_multilingual_v2"),

  // Image generation — fal.ai
  FAL_AI_API_KEY: z.string().optional(),
  FAL_AI_MODEL: z.string().default("fal-ai/flux/dev"),

  // App
  NEXT_PUBLIC_APP_URL: z.string().default("http://localhost:3000"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),

  // Job queue
  JOB_CONCURRENCY: z.coerce.number().int().positive().default(2),

  // Policy thresholds
  ORIGINALITY_BLOCK_THRESHOLD: z.coerce.number().min(0).max(1).default(0.4),
  REUSED_RISK_BLOCK_THRESHOLD: z.coerce.number().min(0).max(1).default(0.7),
  SIMILARITY_REVIEW_THRESHOLD: z.coerce.number().min(0).max(1).default(0.75),
  MAX_AUTO_REWRITES: z.coerce.number().int().positive().default(3),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | null = null;

export function getEnv(): Env {
  if (cached) return cached;
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join(".")}: ${i.message}`)
      .join("\n");
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }
  cached = parsed.data;
  return cached;
}

export const env = getEnv();
