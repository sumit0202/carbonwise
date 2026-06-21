/**
 * Simple per-IP token-bucket rate limiter.
 *
 * Protects the Google proxy endpoints from abuse. Each client IP gets a bucket
 * that refills at a steady rate; requests are allowed while tokens remain. This
 * is in-memory and per-instance, which is sufficient for a single Cloud Run
 * container and avoids any external dependency.
 */

interface Bucket {
  tokens: number;
  lastRefill: number;
}

export interface RateLimiterOptions {
  capacity: number;
  refillPerSecond: number;
  now?: () => number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export class RateLimiter {
  private readonly buckets = new Map<string, Bucket>();
  private readonly capacity: number;
  private readonly refillPerSecond: number;
  private readonly now: () => number;

  constructor({ capacity, refillPerSecond, now = Date.now }: RateLimiterOptions) {
    this.capacity = capacity;
    this.refillPerSecond = refillPerSecond;
    this.now = now;
  }

  check(key: string): RateLimitResult {
    const current = this.now();
    const bucket = this.buckets.get(key) ?? {
      tokens: this.capacity,
      lastRefill: current,
    };

    const elapsedSeconds = (current - bucket.lastRefill) / 1000;
    const refilled = Math.min(
      this.capacity,
      bucket.tokens + elapsedSeconds * this.refillPerSecond,
    );

    if (refilled < 1) {
      this.buckets.set(key, { tokens: refilled, lastRefill: current });
      return { allowed: false, remaining: 0 };
    }

    const tokens = refilled - 1;
    this.buckets.set(key, { tokens, lastRefill: current });
    return { allowed: true, remaining: Math.floor(tokens) };
  }

  reset(): void {
    this.buckets.clear();
  }
}

/** Shared limiter for all Google proxy routes: 20 requests, refill 1/sec. */
export const googleRateLimiter = new RateLimiter({
  capacity: 20,
  refillPerSecond: 1,
});

/** Extracts a best-effort client IP from request headers. */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0];
    if (first) return first.trim();
  }
  return headers.get("x-real-ip") ?? "unknown";
}
