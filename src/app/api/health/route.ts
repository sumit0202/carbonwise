import { isDemoMode } from "@/lib/google/config";
import { APP_VERSION } from "@/lib/version";

/** Liveness/readiness probe for Cloud Run. */
export function GET(): Response {
  return Response.json(
    { status: "ok", version: APP_VERSION, demoMode: isDemoMode() },
    { headers: { "Cache-Control": "no-store" } },
  );
}
