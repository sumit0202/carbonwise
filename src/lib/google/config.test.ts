import { afterEach, describe, expect, it, vi } from "vitest";
import {
  REQUEST_TIMEOUT_MS,
  getBrowserKey,
  getServerKey,
  isDemoMode,
} from "@/lib/google/config";

afterEach(() => vi.unstubAllEnvs());

describe("getServerKey", () => {
  it("returns the key when set", () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "secret");
    expect(getServerKey()).toBe("secret");
  });
  it("returns undefined when missing or blank", () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    expect(getServerKey()).toBeUndefined();
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "   ");
    expect(getServerKey()).toBeUndefined();
  });
});

describe("getBrowserKey", () => {
  it("returns the key when set", () => {
    vi.stubEnv("GOOGLE_MAPS_BROWSER_API_KEY", "browser");
    expect(getBrowserKey()).toBe("browser");
  });
  it("returns undefined when blank", () => {
    vi.stubEnv("GOOGLE_MAPS_BROWSER_API_KEY", "");
    expect(getBrowserKey()).toBeUndefined();
  });
});

describe("isDemoMode", () => {
  it("is true without a server key", () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    expect(isDemoMode()).toBe(true);
  });
  it("is false with a server key", () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "secret");
    expect(isDemoMode()).toBe(false);
  });
});

describe("REQUEST_TIMEOUT_MS", () => {
  it("is a positive timeout", () => {
    expect(REQUEST_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
