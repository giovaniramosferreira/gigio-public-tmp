import { spawn } from "child_process";
import { log } from "./logger";

const logger = log("ffmpeg");

export interface FfmpegStatus {
  available: boolean;
  version?: string;
  path: string;
  message?: string;
}

const FFMPEG_PATH = process.env.FFMPEG_PATH ?? "ffmpeg";
const FFPROBE_PATH = process.env.FFPROBE_PATH ?? "ffprobe";

let cachedStatus: FfmpegStatus | null = null;

/**
 * Check whether FFmpeg is installed and on PATH. Result is cached for the
 * process lifetime. Required before any video assembly job (T-009).
 */
export async function checkFfmpeg(force = false): Promise<FfmpegStatus> {
  if (cachedStatus && !force) return cachedStatus;

  cachedStatus = await new Promise<FfmpegStatus>((resolve) => {
    const proc = spawn(FFMPEG_PATH, ["-version"]);
    let stdout = "";

    proc.stdout?.on("data", (d) => (stdout += d.toString()));

    proc.on("error", (err) => {
      logger.warn({ err: err.message }, "ffmpeg not available");
      resolve({
        available: false,
        path: FFMPEG_PATH,
        message:
          "FFmpeg not found on PATH. Install it (see docs/setup.md) and ensure `ffmpeg -version` works.",
      });
    });

    proc.on("close", (code) => {
      if (code === 0) {
        const versionLine = stdout.split("\n")[0]?.trim();
        resolve({ available: true, path: FFMPEG_PATH, version: versionLine });
      } else {
        resolve({
          available: false,
          path: FFMPEG_PATH,
          message: `ffmpeg -version exited with code ${code}`,
        });
      }
    });
  });

  return cachedStatus;
}

/**
 * Assert FFmpeg is available or throw. Use at the start of assembly jobs so
 * the failure is explicit and actionable rather than a cryptic spawn error.
 */
export async function assertFfmpeg(): Promise<void> {
  const status = await checkFfmpeg();
  if (!status.available) {
    throw new Error(status.message ?? "FFmpeg is not available");
  }
}

export const ffmpegPaths = { ffmpeg: FFMPEG_PATH, ffprobe: FFPROBE_PATH };
