import { describe, expect, it } from "vitest";
import {
  GoogleApiError,
  normalizeError,
  safeMessage,
} from "@/lib/google/errors";

describe("GoogleApiError", () => {
  it("stores code, message and status", () => {
    const err = new GoogleApiError("upstream", "msg", 502);
    expect(err.code).toBe("upstream");
    expect(err.status).toBe(502);
    expect(err.name).toBe("GoogleApiError");
  });
});

describe("safeMessage", () => {
  it("returns a safe message for each code", () => {
    expect(safeMessage("validation")).toMatch(/invalid/i);
    expect(safeMessage("rate_limited")).toMatch(/many/i);
  });
});

describe("normalizeError", () => {
  it("passes through existing GoogleApiError", () => {
    const original = new GoogleApiError("validation", "bad", 400);
    expect(normalizeError(original)).toBe(original);
  });

  it("maps abort to a timeout", () => {
    const abort = new DOMException("aborted", "AbortError");
    expect(normalizeError(abort).code).toBe("timeout");
  });

  it("maps TypeError to a network error", () => {
    expect(normalizeError(new TypeError("fetch failed")).code).toBe("network");
  });

  it("maps unknown values to unknown", () => {
    const result = normalizeError("oops");
    expect(result.code).toBe("unknown");
    expect(result.status).toBe(500);
  });

  it("does not treat a non-abort DOMException as a timeout", () => {
    const other = new DOMException("nope", "SyntaxError");
    expect(normalizeError(other).code).toBe("unknown");
  });
});
