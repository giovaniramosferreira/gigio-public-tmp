import { log } from "@/lib/logger";
import { ensureDataDirs } from "@/lib/storage";
import { recoverStaleJobs } from "@/lib/jobs";
import { registerJobHandlers } from "@/server/jobs/handlers";

const logger = log("init");

// Survive Next.js dev hot-reload by keeping the flag in globalThis,
// same pattern used by the job queue.
const g = globalThis as unknown as { __dtInitialized?: boolean };

export async function ensureInitialized(): Promise<void> {
  if (g.__dtInitialized) return;
  g.__dtInitialized = true;

  await ensureDataDirs();
  registerJobHandlers();
  const recovered = await recoverStaleJobs();
  logger.info({ recovered }, "darktube initialized");
}
