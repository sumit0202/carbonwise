import { isDemoMode } from "@/lib/google/config";
import { getMapsConfig } from "@/lib/google/mapsConfig";

/** Runtime, public client configuration. Never exposes the server key. */
export function GET(): Response {
  const maps = getMapsConfig();
  return Response.json(
    { ...maps, demoMode: isDemoMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
