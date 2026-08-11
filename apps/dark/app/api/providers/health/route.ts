import { handler, ok } from "@/lib/api";
import { healthCheckAll } from "@/providers";

export const dynamic = "force-dynamic";

/** GET /api/providers/health — run health checks across all registered providers. */
export const GET = handler(async () => {
  const providers = await healthCheckAll();
  return ok({ providers });
});
