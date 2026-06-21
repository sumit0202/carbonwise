import { describe, expect, it } from "vitest";
import { RateLimiter, clientIp } from "@/lib/google/rateLimit";

describe("RateLimiter", () => {
  it("allows requests while tokens remain", () => {
    const limiter = new RateLimiter({ capacity: 2, refillPerSecond: 1 });
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(false);
  });

  it("refills tokens over time", () => {
    let now = 0;
    const limiter = new RateLimiter({
      capacity: 1,
      refillPerSecond: 1,
      now: () => now,
    });
    expect(limiter.check("ip").allowed).toBe(true);
    expect(limiter.check("ip").allowed).toBe(false);
    now = 1000;
    expect(limiter.check("ip").allowed).toBe(true);
  });

  it("tracks separate buckets per key", () => {
    const limiter = new RateLimiter({ capacity: 1, refillPerSecond: 1 });
    expect(limiter.check("a").allowed).toBe(true);
    expect(limiter.check("b").allowed).toBe(true);
  });

  it("reports remaining tokens", () => {
    const limiter = new RateLimiter({ capacity: 5, refillPerSecond: 1 });
    expect(limiter.check("ip").remaining).toBe(4);
  });

  it("resets all buckets", () => {
    const limiter = new RateLimiter({ capacity: 1, refillPerSecond: 1 });
    limiter.check("ip");
    limiter.reset();
    expect(limiter.check("ip").allowed).toBe(true);
  });
});

describe("clientIp", () => {
  it("uses the first x-forwarded-for entry", () => {
    const headers = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
    expect(clientIp(headers)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip", () => {
    const headers = new Headers({ "x-real-ip": "3.3.3.3" });
    expect(clientIp(headers)).toBe("3.3.3.3");
  });

  it("returns 'unknown' when no ip headers are present", () => {
    expect(clientIp(new Headers())).toBe("unknown");
  });

  it("falls back when x-forwarded-for is empty", () => {
    const headers = new Headers({ "x-forwarded-for": "" });
    expect(clientIp(headers)).toBe("unknown");
  });

  it("falls back when the first forwarded entry is blank", () => {
    const headers = new Headers({ "x-forwarded-for": "," });
    expect(clientIp(headers)).toBe("unknown");
  });
});
