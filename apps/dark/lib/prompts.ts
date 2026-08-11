import { promises as fs } from "fs";
import path from "path";

/**
 * Prompt template loader. Templates live under /prompts as Markdown files with
 * YAML-ish frontmatter, a `# System` section, and a `# User Template` section
 * with {{variable}} placeholders (see prompts/README.md).
 */

const PROMPTS_ROOT = path.resolve(process.cwd(), "prompts");

export interface PromptTemplate {
  frontmatter: Record<string, string>;
  system: string;
  userTemplate: string;
  version: string;
}

const cache = new Map<string, PromptTemplate>();

function parseFrontmatter(raw: string): {
  frontmatter: Record<string, string>;
  body: string;
} {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!match) return { frontmatter: {}, body: raw };
  const [, fm, body] = match;
  const frontmatter: Record<string, string> = {};
  for (const line of fm.split("\n")) {
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const value = line.slice(idx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) frontmatter[key] = value;
  }
  return { frontmatter, body };
}

/** Extract a `# Heading` section body from Markdown (until the next top-level heading). */
function extractSection(body: string, heading: string): string {
  const lines = body.split("\n");
  const headingRe = new RegExp(`^#\\s+${heading}\\s*$`, "i");
  const anyHeadingRe = /^#\s+/;

  const start = lines.findIndex((l) => headingRe.test(l));
  if (start === -1) return "";

  const collected: string[] = [];
  for (let i = start + 1; i < lines.length; i++) {
    if (anyHeadingRe.test(lines[i])) break;
    collected.push(lines[i]);
  }
  return collected.join("\n").trim();
}

/**
 * Load and parse a prompt template by its path relative to /prompts,
 * e.g. "discovery/discover-ideas". The ".md" extension is optional.
 */
export async function loadPrompt(relPath: string): Promise<PromptTemplate> {
  const key = relPath.replace(/\.md$/, "");
  const cached = cache.get(key);
  if (cached && process.env.NODE_ENV === "production") return cached;

  const filePath = path.join(PROMPTS_ROOT, `${key}.md`);
  const raw = await fs.readFile(filePath, "utf8");
  const { frontmatter, body } = parseFrontmatter(raw);

  const template: PromptTemplate = {
    frontmatter,
    system: extractSection(body, "System"),
    userTemplate: extractSection(body, "User Template"),
    version: frontmatter.version ?? "1",
  };

  cache.set(key, template);
  return template;
}

/** Interpolate {{variable}} placeholders in a template string. */
export function interpolate(
  template: string,
  vars: Record<string, string | number | undefined>,
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, name: string) => {
    const value = vars[name];
    return value === undefined ? "" : String(value);
  });
}

/** Load a prompt and return the system prompt plus the interpolated user message. */
export async function renderPrompt(
  relPath: string,
  vars: Record<string, string | number | undefined>,
): Promise<{ system: string; user: string; version: string }> {
  const tpl = await loadPrompt(relPath);
  return {
    system: tpl.system,
    user: interpolate(tpl.userTemplate, vars),
    version: tpl.version,
  };
}
