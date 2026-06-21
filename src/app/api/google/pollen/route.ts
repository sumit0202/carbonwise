import { getPollen } from "@/lib/google/pollen";
import {
  cachedRun,
  errorResponse,
  okResponse,
  parseOrThrow,
  rateLimitOrThrow,
} from "@/lib/google/handler";
import { pointRequestSchema } from "@/lib/google/schemas";

export async function GET(request: Request): Promise<Response> {
  try {
    rateLimitOrThrow(request);
    const { searchParams } = new URL(request.url);
    const input = parseOrThrow(pointRequestSchema, {
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
    });
    const result = await cachedRun(`pollen:${input.lat},${input.lng}`, () =>
      getPollen(input),
    );
    return okResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
