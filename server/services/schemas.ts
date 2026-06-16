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

// ---- Visual directions (prompts/visual/scene-directions.md) ----
export const sceneSchema = z.object({
  beat_index: z.number().int().nonnegative(),
  t_start: z.number().nonnegative(),
  t_end: z.number().nonnegative(),
  image_prompt: z.string().min(1),
  motion_hint: z.string().default(""),
  text_overlay: z.string().default(""),
  iconography: z.string().default(""),
});
export const assetPlanSchema = z.object({
  visual_style_notes: z.string().default(""),
  scenes: z.array(sceneSchema).min(1),
  text_overlay_options: z.array(z.string()).default([]),
});
export type AssetPlanOutput = z.infer<typeof assetPlanSchema>;

// ---- Metadata (prompts/title/generate-metadata.md) ----
export const metadataSchema = z.object({
  titles: z.array(z.string()).min(1),
  selected_title: z.string().min(1),
  descriptions: z.array(z.string()).min(1),
  selected_description: z.string().min(1),
  hashtags: z.array(z.string()).default([]),
  pinned_comment: z.string().default(""),
  risk_notes: z.array(z.string()).default([]),
});
export type MetadataOutput = z.infer<typeof metadataSchema>;

// ---- QA review (prompts/qa/qa-review.md) ----
export const qaReasonSchema = z.object({
  code: z.string(),
  detail: z.string().default(""),
});
export const qaResultSchema = z.object({
  originality_risk_score: z.number().min(0).max(1),
  reused_risk_score: z.number().min(0).max(1),
  overclaim_risk_score: z.number().min(0).max(1),
  template_repetition_score: z.number().min(0).max(1),
  decision: z.enum(["PASS", "REVIEW", "BLOCK"]),
  reason_codes: z.array(qaReasonSchema).default([]),
  summary: z.string().default(""),
});
export type QAResult = z.infer<typeof qaResultSchema>;
