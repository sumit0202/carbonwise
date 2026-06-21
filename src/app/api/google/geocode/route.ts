import { geocode } from "@/lib/google/geocode";
import {
  cachedRun,
  errorResponse,
  okResponse,
  parseOrThrow,
  rateLimitOrThrow,
} from "@/lib/google/handler";
import { geocodeRequestSchema } from "@/lib/google/schemas";

export async function GET(request: Request): Promise<Response> {
  try {
    rateLimitOrThrow(request);
    const { searchParams } = new URL(request.url);
    const input = parseOrThrow(geocodeRequestSchema, {
      address: searchParams.get("address") ?? "",
    });
    const result = await cachedRun(`geocode:${input.address}`, () =>
      geocode(input),
    );
    return okResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
