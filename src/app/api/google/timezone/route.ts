import { getTimezone } from "@/lib/google/timezone";
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
    const result = await cachedRun(`tz:${input.lat},${input.lng}`, () =>
      getTimezone(input),
    );
    return okResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
