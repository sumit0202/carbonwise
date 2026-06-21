import { findPlaces } from "@/lib/google/places";
import {
  cachedRun,
  errorResponse,
  okResponse,
  parseOrThrow,
  rateLimitOrThrow,
} from "@/lib/google/handler";
import { placesRequestSchema } from "@/lib/google/schemas";

export async function GET(request: Request): Promise<Response> {
  try {
    rateLimitOrThrow(request);
    const { searchParams } = new URL(request.url);
    const input = parseOrThrow(placesRequestSchema, {
      lat: searchParams.get("lat"),
      lng: searchParams.get("lng"),
      category: searchParams.get("category"),
    });
    const key = `places:${input.category}:${input.lat},${input.lng}`;
    const result = await cachedRun(key, () => findPlaces(input));
    return okResponse(result);
  } catch (error) {
    return errorResponse(error);
  }
}
