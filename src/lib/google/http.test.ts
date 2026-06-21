import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchJson } from "@/lib/google/http";
import { GoogleApiError } from "@/lib/google/errors";

afterEach(() => vi.restoreAllMocks());

function mockFetch(impl: typeof fetch) {
  vi.stubGlobal("fetch", vi.fn(impl));
}

describe("fetchJson", () => {
  it("returns parsed JSON on success", async () => {
    mockFetch(async () =>
      new Response(JSON.stringify({ ok: 1 }), { status: 200 }),
    );
    const result = await fetchJson<{ ok: number }>("https://example.com");
    expect(result.ok).toBe(1);
  });

  it("sends a JSON body and content-type for POST", async () => {
    const spy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", spy);
    await fetchJson("https://example.com", {
      method: "POST",
      body: { a: 1 },
      headers: { "X-Test": "1" },
    });
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("POST");
    expect(init.body).toBe(JSON.stringify({ a: 1 }));
    expect((init.headers as Record<string, string>)["Content-Type"]).toBe(
      "application/json",
    );
  });

  it("sends custom headers on a GET without a body", async () => {
    const spy = vi.fn(async () => new Response("{}", { status: 200 }));
    vi.stubGlobal("fetch", spy);
    await fetchJson("https://example.com", {
      headers: { "X-Test": "1" },
      timeoutMs: 1000,
    });
    const [, init] = spy.mock.calls[0] as unknown as [string, RequestInit];
    expect(init.method).toBe("GET");
    expect(init.body).toBeUndefined();
    expect((init.headers as Record<string, string>)["X-Test"]).toBe("1");
    expect(
      (init.headers as Record<string, string>)["Content-Type"],
    ).toBeUndefined();
  });

  it("throws an upstream error on non-2xx", async () => {
    mockFetch(async () => new Response("nope", { status: 500 }));
    await expect(fetchJson("https://example.com")).rejects.toMatchObject({
      code: "upstream",
    });
  });

  it("maps abort to a timeout error", async () => {
    mockFetch(async () => {
      throw new DOMException("aborted", "AbortError");
    });
    await expect(
      fetchJson("https://example.com", { timeoutMs: 5 }),
    ).rejects.toMatchObject({ code: "timeout" });
  });

  it("maps a network failure", async () => {
    mockFetch(async () => {
      throw new TypeError("network down");
    });
    await expect(fetchJson("https://example.com")).rejects.toBeInstanceOf(
      GoogleApiError,
    );
  });
});
