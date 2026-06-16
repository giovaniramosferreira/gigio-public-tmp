import { handler, ok } from "@/lib/api";
import { channelRepo } from "@/server/repositories/channel";

export const dynamic = "force-dynamic";

/** GET /api/channels — list channels; the active one includes its pillars. */
export const GET = handler(async () => {
  const [channels, active] = await Promise.all([
    channelRepo.list(),
    channelRepo.findActive(),
  ]);
  return ok({ channels, active });
});
