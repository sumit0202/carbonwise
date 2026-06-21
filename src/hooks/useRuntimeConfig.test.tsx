import { afterEach, describe, expect, it, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useRuntimeConfig } from "@/hooks/useRuntimeConfig";

afterEach(() => vi.unstubAllGlobals());

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useRuntimeConfig", () => {
  it("loads config from /api/config", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(
        async () =>
          new Response(
            JSON.stringify({
              mapsApiKey: "k",
              mapsAvailable: true,
              demoMode: false,
            }),
            { status: 200 },
          ),
      ),
    );
    const { result } = renderHook(() => useRuntimeConfig());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.config.mapsAvailable).toBe(true);
  });

  it("falls back to demo config on failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new Error("offline");
      }),
    );
    const { result } = renderHook(() => useRuntimeConfig());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.config.demoMode).toBe(true);
  });

  it("ignores a resolution that arrives after unmount", async () => {
    const d = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn(() => d.promise));
    const { result, unmount } = renderHook(() => useRuntimeConfig());
    unmount();
    d.resolve(
      new Response(
        JSON.stringify({ mapsApiKey: "k", mapsAvailable: true, demoMode: false }),
        { status: 200 },
      ),
    );
    await Promise.resolve();
    expect(result.current.loaded).toBe(false);
  });

  it("ignores a rejection that arrives after unmount", async () => {
    const d = deferred<Response>();
    vi.stubGlobal("fetch", vi.fn(() => d.promise));
    const { result, unmount } = renderHook(() => useRuntimeConfig());
    unmount();
    d.reject(new Error("late"));
    await Promise.resolve();
    expect(result.current.loaded).toBe(false);
  });
});
