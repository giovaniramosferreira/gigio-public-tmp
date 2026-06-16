import { z } from "zod";

/**
 * Zod schemas mirroring the JSON output contracts of the prompt templates.
 * These validate LLM output before it is persisted, so malformed generations
 * fail loudly at the service boundary rather than corrupting the data model.
 */

// ---- Discovery (prompts/discovery/discover-ideas.md) ----
export const discoveredIdeaSchema = z.object({
  working_title: z.string().min(1),
  hidden_angle: z.string().min(1),
  why_underdiscussed: z.string().min(1),
  consequence_framing: z.string().min(1),
  angle_type: z.string().min(1),
  controversy_note: z.string().default(""),
});
export const discoveryResultSchema = z.array(discoveredIdeaSchema);
export type DiscoveredIdea = z.infer<typeof discoveredIdeaSchema>;

// ---- Script (prompts/script/generate-script.md) ----
export const beatSchema = z.object({
  beat: z.string(),
  t_start: z.number(),
  t_end: z.number(),
  narration: z.string(),
  visual_direction: z.string(),
});
export const scriptPackageSchema = z.object({
  thesis: z.string().min(1),
  audience_frame: z.string().default(""),
  hook_variants: z.array(z.string()).min(1),
  selected_hook: z.string().min(1),
  beat_plan: z.array(beatSchema).min(1),
  full_script: z.string().min(1),
  word_count: z.number().int().nonnegative(),
  estimated_duration_seconds: z.number().nonnegative(),
  key_phrases: z.array(z.string()).default([]),
  safety_notes: z.array(z.string()).default([]),
  title_variants: z.array(z.string()).min(1),
});
export type ScriptPackageOutput = z.infer<typeof scriptPackageSchema>;

// ---- Critic (prompts/critic/critique-script.md) ----
export const criticQuestionSchema = z.object({
  question: z.string(),
  rating: z.enum(["PASS", "CONCERN", "FAIL"]),
  note: z.string().default(""),
});
export const criticIssueSchema = z.object({
  type: z.string(),
  severity: z.enum(["low", "medium", "high"]),
  detail: z.string().default(""),
});
export const criticResultSchema = z.object({
  questions: z.array(criticQuestionSchema),
  issues: z.array(criticIssueSchema).default([]),
  rewrite_guidance: z.string().default(""),
  verdict: z.enum(["APPROVE", "REWRITE", "BLOCK"]),
});
export type CriticResult = z.infer<typeof criticResultSchema>;
