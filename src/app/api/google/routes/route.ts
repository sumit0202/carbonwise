import { computeRoutes } from "@/lib/google/routes";
import {
  cachedRun,
  errorResponse,
  okResponse,
  parseOrThrow,
  rateLimitOrThrow,
} from "@/lib/google/handler";
import { routesRequestSchema } from "@/lib/google/schemas";

export async function POST(request: Request): Promise<Response> {
  try {
    rateLimitOrThrow(request);
    const body = await request.json().catch(() => null);
    const input = parseOrThrow(routesRequestSchema, body);
    const key = `routes:${input.origin.lat},${input.origin.lng}:${input.destination.lat},${input.destination.lng}`;
    const result = await cachedRun(key, () => computeRoutes(input));
    return okResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
