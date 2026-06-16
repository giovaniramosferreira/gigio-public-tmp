import pino from "pino";

/**
 * Structured logger. Pretty-prints in development, JSON in production.
 * Child loggers carry a `module` field so service logs are filterable.
 */
const isDev = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL ?? (isDev ? "debug" : "info"),
  base: undefined, // drop pid/hostname noise for a local single-user tool
  ...(isDev
    ? {
        transport: {
          target: "pino-pretty",
          options: { colorize: true, translateTime: "HH:MM:ss", ignore: "module" },
        },
      }
    : {}),
});

/** Create a module-scoped child logger, e.g. `log("discovery")`. */
export function log(module: string) {
  return logger.child({ module });
}
