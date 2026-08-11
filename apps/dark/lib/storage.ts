import { promises as fs } from "fs";
import path from "path";

/**
 * Local filesystem storage manager. All runtime media and data live under the
 * project-root /data directory (gitignored). Paths are resolved relative to
 * process.cwd(), which is the project root when running Next.js or scripts.
 */

export const DATA_ROOT = path.resolve(process.cwd(), "data");

export const DATA_DIRS = {
  db: path.join(DATA_ROOT, "db"),
  assets: path.join(DATA_ROOT, "assets"),
  renders: path.join(DATA_ROOT, "renders"),
  exports: path.join(DATA_ROOT, "exports"),
  logs: path.join(DATA_ROOT, "logs"),
  cache: path.join(DATA_ROOT, "cache"),
} as const;

export type DataDir = keyof typeof DATA_DIRS;

/** Ensure all managed data directories exist. Safe to call repeatedly. */
export async function ensureDataDirs(): Promise<void> {
  await Promise.all(
    Object.values(DATA_DIRS).map((dir) => fs.mkdir(dir, { recursive: true })),
  );
}

/** Ensure a single directory exists, returning its path. */
export async function ensureDir(dir: string): Promise<string> {
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

/** Ensure the parent directory of a file path exists. */
export async function ensureParentDir(filePath: string): Promise<void> {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
}

/**
 * Build a path inside a managed data dir, optionally namespaced by subpath
 * segments. Does not create the file; use ensureParentDir before writing.
 */
export function dataPath(dir: DataDir, ...segments: string[]): string {
  return path.join(DATA_DIRS[dir], ...segments);
}

/** Slugify a string for safe use in filesystem paths. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "untitled";
}

/** Path to a video project's export folder: /data/exports/{slug}/ */
export function exportFolder(slug: string): string {
  return dataPath("exports", slugify(slug));
}

/** Write a Buffer to disk, creating parent dirs first. Returns bytes written. */
export async function writeFileEnsured(
  filePath: string,
  data: Buffer | string,
): Promise<number> {
  await ensureParentDir(filePath);
  await fs.writeFile(filePath, data);
  const stat = await fs.stat(filePath);
  return stat.size;
}

/** Check whether a file exists. */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}
