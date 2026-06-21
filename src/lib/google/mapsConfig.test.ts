import { afterEach, describe, expect, it, vi } from "vitest";
import { getMapsConfig } from "@/lib/google/mapsConfig";

afterEach(() => vi.unstubAllEnvs());

describe("getMapsConfig", () => {
  it("reports unavailable without a browser key", () => {
    vi.stubEnv("GOOGLE_MAPS_BROWSER_API_KEY", "");
    expect(getMapsConfig()).toEqual({ mapsApiKey: null, mapsAvailable: false });
  });

  it("exposes the browser key when configured", () => {
    vi.stubEnv("GOOGLE_MAPS_BROWSER_API_KEY", "pub-key");
    expect(getMapsConfig()).toEqual({
      mapsApiKey: "pub-key",
      mapsAvailable: true,
    });
  });
});
