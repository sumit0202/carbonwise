import { afterEach, describe, expect, it, vi } from "vitest";
import { GET as configGET } from "@/app/api/config/route";
import { GET as healthGET } from "@/app/api/health/route";
import { APP_VERSION } from "@/lib/version";

afterEach(() => vi.unstubAllEnvs());

describe("config route", () => {
  it("reports demo mode and no key when unconfigured", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    vi.stubEnv("GOOGLE_MAPS_BROWSER_API_KEY", "");
    const body = await configGET().json();
    expect(body).toEqual({
      mapsApiKey: null,
      mapsAvailable: false,
      demoMode: true,
    });
  });

  it("exposes the browser key but never the server key", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "server-secret");
    vi.stubEnv("GOOGLE_MAPS_BROWSER_API_KEY", "browser-public");
    const body = await configGET().json();
    expect(body.mapsApiKey).toBe("browser-public");
    expect(body.demoMode).toBe(false);
    expect(JSON.stringify(body)).not.toContain("server-secret");
  });
});

describe("health route", () => {
  it("returns status, version and demo flag", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    const body = await healthGET().json();
    expect(body.status).toBe("ok");
    expect(body.version).toBe(APP_VERSION);
    expect(body.demoMode).toBe(true);
  });
});
