/**
 * Shared request-handling helpers for the Google proxy route handlers.
 * Centralizes rate limiting, validation, caching and safe error responses so
 * every endpoint behaves consistently.
 */

import type { ZodType } from "zod";
import { DEFAULT_CACHE_TTL_MS, TtlCache } from "@/lib/google/cache";
import { GoogleApiError, normalizeError, safeMessage } from "@/lib/google/errors";
import { clientIp, googleRateLimiter } from "@/lib/google/rateLimit";
import type { ApiEnvelope } from "@/lib/google/schemas";

const responseCache = new TtlCache<unknown>({ ttlMs: DEFAULT_CACHE_TTL_MS });

export function rateLimitOrThrow(request: Request): void {
  const result = googleRateLimiter.check(clientIp(request.headers));
  if (!result.allowed) {
    throw new GoogleApiError("rate_limited", safeMessage("rate_limited"), 429);
  }
}

export function parseOrThrow<T>(schema: ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? safeMessage("validation");
    throw new GoogleApiError("validation", message, 400);
  }
  return parsed.data;
}

/** Returns a cached envelope when present, otherwise runs and caches it. */
export async function cachedRun<T>(
  key: string,
  run: () => Promise<ApiEnvelope<T>>,
): Promise<ApiEnvelope<T>> {
  const hit = responseCache.get(key) as ApiEnvelope<T> | undefined;
  if (hit) return hit;
  const result = await run();
  responseCache.set(key, result);
  return result;
}

export function okResponse<T>(envelope: ApiEnvelope<T>): Response {
  return Response.json(envelope, {
    status: 200,
    headers: { "Cache-Control": "private, max-age=60" },
  });
}

export function errorResponse(error: unknown): Response {
  const normalized = normalizeError(error);
  return Response.json(
    { error: { code: normalized.code, message: normalized.message } },
    { status: normalized.status },
  );
}

/** Test-only hook to reset shared state between cases. */
export function _resetSharedState(): void {
  responseCache.clear();
  googleRateLimiter.reset();
}
