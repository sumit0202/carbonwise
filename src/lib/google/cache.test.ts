import { describe, expect, it } from "vitest";
import { DEFAULT_CACHE_TTL_MS, TtlCache } from "@/lib/google/cache";

describe("TtlCache", () => {
  it("stores and retrieves values", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
    expect(cache.size).toBe(1);
  });

  it("returns undefined for missing keys", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    expect(cache.get("missing")).toBeUndefined();
  });

  it("expires entries after the TTL", () => {
    let now = 0;
    const cache = new TtlCache<number>({ ttlMs: 100, now: () => now });
    cache.set("a", 1);
    now = 50;
    expect(cache.get("a")).toBe(1);
    now = 200;
    expect(cache.get("a")).toBeUndefined();
  });

  it("evicts the oldest entry when at capacity", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000, maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("c")).toBe(3);
  });

  it("overwriting an existing key does not trigger eviction", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000, maxEntries: 2 });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("a", 10);
    expect(cache.get("a")).toBe(10);
    expect(cache.get("b")).toBe(2);
  });

  it("handles eviction when the store is empty (maxEntries 0)", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000, maxEntries: 0 });
    cache.set("a", 1);
    expect(cache.get("a")).toBe(1);
  });

  it("clears all entries", () => {
    const cache = new TtlCache<number>({ ttlMs: 1000 });
    cache.set("a", 1);
    cache.clear();
    expect(cache.size).toBe(0);
  });

  it("exposes a default TTL", () => {
    expect(DEFAULT_CACHE_TTL_MS).toBeGreaterThan(0);
  });
});
