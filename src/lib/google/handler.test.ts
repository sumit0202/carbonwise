import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ZodType } from "zod";
import { z } from "zod";
import {
  _resetSharedState,
  cachedRun,
  errorResponse,
  okResponse,
  parseOrThrow,
  rateLimitOrThrow,
} from "@/lib/google/handler";
import { GoogleApiError } from "@/lib/google/errors";

beforeEach(() => _resetSharedState());

function request(ip = "10.0.0.1"): Request {
  return new Request("https://app.test/api", {
    headers: { "x-forwarded-for": ip },
  });
}

describe("rateLimitOrThrow", () => {
  it("allows requests under the limit", () => {
    expect(() => rateLimitOrThrow(request())).not.toThrow();
  });

  it("throws once the bucket is empty", () => {
    const req = request("9.9.9.9");
    expect(() => {
      for (let i = 0; i < 30; i += 1) rateLimitOrThrow(req);
    }).toThrow(GoogleApiError);
  });
});

describe("parseOrThrow", () => {
  const schema = z.object({ n: z.number() });

  it("returns parsed data on success", () => {
    expect(parseOrThrow(schema, { n: 1 })).toEqual({ n: 1 });
  });

  it("throws a validation error with the issue message", () => {
    try {
      parseOrThrow(schema, { n: "x" });
      throw new Error("should not reach");
    } catch (error) {
      expect(error).toBeInstanceOf(GoogleApiError);
      expect((error as GoogleApiError).code).toBe("validation");
    }
  });

  it("uses a safe default when there is no issue message", () => {
    const fake = {
      safeParse: () => ({ success: false, error: { issues: [] } }),
    } as unknown as ZodType<unknown>;
    expect(() => parseOrThrow(fake, {})).toThrow(/invalid/i);
  });
});

describe("cachedRun", () => {
  it("runs once and serves subsequent calls from cache", async () => {
    const run = vi.fn(async () => ({ data: 1, demo: true }));
    const first = await cachedRun("key", run);
    const second = await cachedRun("key", run);
    expect(first).toEqual({ data: 1, demo: true });
    expect(second).toEqual(first);
    expect(run).toHaveBeenCalledOnce();
  });
});

describe("responses", () => {
  it("okResponse returns 200 with the envelope", async () => {
    const res = okResponse({ data: 1, demo: false });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: 1, demo: false });
  });

  it("errorResponse uses the normalized status and shape", async () => {
    const res = errorResponse(new GoogleApiError("validation", "bad", 400));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({
      error: { code: "validation", message: "bad" },
    });
  });
});
