import { log } from "@/lib/logger";
import { ensureDataDirs } from "@/lib/storage";
import { recoverStaleJobs } from "@/lib/jobs";
import { registerJobHandlers } from "@/server/jobs/handlers";

const logger = log("init");

let initialized = false;

/**
 * One-time server bootstrap: ensure data directories exist, register job
 * handlers, and reconcile jobs orphaned by a previous process. Safe to call on
 * every request path; the body runs once per process.
 */
export async function ensureInitialized(): Promise<void> {
  if (initialized) return;
  initialized = true;

  await ensureDataDirs();
  registerJobHandlers();
  const recovered = await recoverStaleJobs();
  logger.info({ recovered }, "darktube initialized");
}
