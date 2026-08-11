import { z } from "zod";
import { getLLM } from "@/providers";
import { renderPrompt } from "@/lib/prompts";
import { log } from "@/lib/logger";

const logger = log("llm-json");

/**
 * Extract the first balanced JSON value (object or array) from a string. LLMs
 * sometimes wrap JSON in prose or ```json fences; this is tolerant of both.
 */
export function extractJson(text: string): string {
  // Strip code fences first.
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;

  const startObj = candidate.indexOf("{");
  const startArr = candidate.indexOf("[");
  let start = -1;
  if (startObj === -1) start = startArr;
  else if (startArr === -1) start = startObj;
  else start = Math.min(startObj, startArr);
  if (start === -1) throw new Error("No JSON value found in LLM output");

  const open = candidate[start];
  const close = open === "{" ? "}" : "]";
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < candidate.length; i++) {
    const ch = candidate[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return candidate.slice(start, i + 1);
    }
  }
  throw new Error("Unbalanced JSON value in LLM output");
}

export interface LLMJsonOptions {
  maxTokens?: number;
  temperature?: number;
}

/**
 * Render a prompt template, call the configured LLM, extract JSON from the
 * response, and validate it against a zod schema. Returns the parsed value plus
 * generation metadata (model + prompt version) for provenance tracking.
 */
export async function generateJson<S extends z.ZodTypeAny>(
  promptPath: string,
  vars: Record<string, string | number | undefined>,
  schema: S,
  options: LLMJsonOptions = {},
): Promise<{ data: z.infer<S>; model: string; promptVersion: string }> {
  const { system, user, version } = await renderPrompt(promptPath, vars);
  const llm = getLLM();

  const result = await llm.generate({
    system,
    messages: [{ role: "user", content: user }],
    maxTokens: options.maxTokens ?? 4096,
    temperature: options.temperature,
  });

  let jsonText: string;
  try {
    jsonText = extractJson(result.text);
  } catch (err) {
    logger.error({ promptPath, err: (err as Error).message }, "json extraction failed");
    throw new Error(
      `LLM did not return parseable JSON for ${promptPath}: ${(err as Error).message}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    throw new Error(`Invalid JSON from LLM for ${promptPath}: ${(err as Error).message}`);
  }

  const validation = schema.safeParse(parsed);
  if (!validation.success) {
    logger.error(
      { promptPath, issues: validation.error.issues },
      "schema validation failed",
    );
    throw new Error(
      `LLM JSON failed schema validation for ${promptPath}: ${validation.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; ")}`,
    );
  }

  return { data: validation.data, model: result.model, promptVersion: version };
}
