import { afterEach, describe, expect, it, vi } from "vitest";
import { geocode } from "@/lib/google/geocode";
import { computeRoutes } from "@/lib/google/routes";
import { findPlaces } from "@/lib/google/places";
import { getAirQuality } from "@/lib/google/airQuality";
import { getSolar } from "@/lib/google/solar";
import { getPollen, classifyPollen } from "@/lib/google/pollen";
import { getTimezone } from "@/lib/google/timezone";

const KEY = "test-key";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

function stubFetch(handler: (url: string, init?: RequestInit) => Response | Promise<Response>) {
  vi.stubGlobal(
    "fetch",
    vi.fn((url: string, init?: RequestInit) => Promise.resolve(handler(url, init))),
  );
}

describe("geocode", () => {
  it("returns demo data without a key", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", "");
    const result = await geocode({ address: "Seattle" });
    expect(result.demo).toBe(true);
  });

  it("returns rounded coordinates from upstream", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", KEY);
    stubFetch(() =>
      jsonResponse({
        results: [
          {
            formatted_address: "Seattle, WA",
            geometry: { location: { lat: 47.612345, lng: -122.334 } },
          },
        ],
      }),
    );
    const result = await geocode({ address: "Seattle" });
    expect(result.demo).toBe(false);
    expect(result.data.location.lat).toBe(47.61);
    expect(result.data.formattedAddress).toBe("Seattle, WA");
  });

  it("falls back to the input address when none is returned", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", KEY);
    stubFetch(() =>
      jsonResponse({
        results: [{ geometry: { location: { lat: 1, lng: 2 } } }],
      }),
    );
    const result = await geocode({ address: "Nowhere" });
    expect(result.data.formattedAddress).toBe("Nowhere");
  });

  it("throws when no result is returned", async () => {
    vi.stubEnv("GOOGLE_MAPS_SERVER_API_KEY", KEY);
    stubFetch(() => jsonResponse({ results: [] }));
    await expect(geocode({ address: "x y z" })).rejects.toMatchObject({
      code: "upstream",
    });
  });
});

const points = { origin: { lat: 1, lng: 2 }, destination: { lat: 3, lng: 4 } };

describe("computeRoutes", () => {
  it("returns demo data without a key", async () => {
    const result = await computeRoutes(points, undefined);
    expect(result.demo).toBe(true);
  });

  it("computes options for each mode", async () => {
    stubFetch(() =>
      jsonResponse({ routes: [{ distanceMeters: 10000, duration: "600s" }] }),
    );
    const result = await computeRoutes(points, KEY);
    expect(result.demo).toBe(false);
    expect(result.data.options).toHaveLength(4);
    const drive = result.data.options.find((o) => o.mode === "DRIVE");
    expect(drive?.distanceKm).toBe(10);
    expect(drive?.durationMinutes).toBe(10);
    expect(drive?.estimatedKgCo2e).toBeGreaterThan(0);
  });

  it("skips modes without a usable route", async () => {
    stubFetch(() => jsonResponse({ routes: [] }));
    const result = await computeRoutes(points, KEY);
    expect(result.data.options).toHaveLength(0);
  });

  it("handles a missing distance and duration", async () => {
    stubFetch(() => jsonResponse({ routes: [{ duration: "bad" }] }));
    const result = await computeRoutes(points, KEY);
    expect(result.data.options).toHaveLength(0);
  });

  it("treats a missing duration as zero minutes", async () => {
    stubFetch(() => jsonResponse({ routes: [{ distanceMeters: 5000 }] }));
    const result = await computeRoutes(points, KEY);
    expect(result.data.options[0]?.durationMinutes).toBe(0);
  });

  it("treats an unparseable duration as zero minutes", async () => {
    stubFetch(() =>
      jsonResponse({ routes: [{ distanceMeters: 5000, duration: "bad" }] }),
    );
    const result = await computeRoutes(points, KEY);
    expect(result.data.options[0]?.durationMinutes).toBe(0);
  });
});

const point = { lat: 47.6, lng: -122.3 };

describe("findPlaces", () => {
  it("returns demo data without a key", async () => {
    const result = await findPlaces({ ...point, category: "recycling" }, undefined);
    expect(result.demo).toBe(true);
  });

  it("normalizes places from upstream", async () => {
    stubFetch(() =>
      jsonResponse({
        places: [
          {
            displayName: { text: "Center" },
            formattedAddress: "1 St",
            location: { latitude: 1, longitude: 2 },
          },
          { location: { latitude: 3, longitude: 4 } },
          { displayName: { text: "No location" } },
        ],
      }),
    );
    const result = await findPlaces({ ...point, category: "ev_charging" }, KEY);
    expect(result.data.places).toHaveLength(2);
    expect(result.data.places[0]?.name).toBe("Center");
    expect(result.data.places[1]?.name).toBe("Unnamed place");
  });

  it("handles an empty places response", async () => {
    stubFetch(() => jsonResponse({}));
    const result = await findPlaces({ ...point, category: "bike_shop" }, KEY);
    expect(result.data.places).toHaveLength(0);
  });
});

describe("getAirQuality", () => {
  it("returns demo data without a key", async () => {
    expect((await getAirQuality(point, undefined)).demo).toBe(true);
  });

  it("normalizes upstream conditions", async () => {
    stubFetch(() =>
      jsonResponse({
        indexes: [{ aqi: 55, category: "Moderate", dominantPollutant: "o3" }],
        healthRecommendations: { generalPopulation: "Be careful" },
      }),
    );
    const result = await getAirQuality(point, KEY);
    expect(result.data.aqi).toBe(55);
    expect(result.data.healthRecommendation).toBe("Be careful");
  });

  it("applies defaults for partial data", async () => {
    stubFetch(() => jsonResponse({ indexes: [{ aqi: 10 }] }));
    const result = await getAirQuality(point, KEY);
    expect(result.data.category).toBe("Unknown");
    expect(result.data.dominantPollutant).toBe("unknown");
    expect(result.data.healthRecommendation).toMatch(/no specific/i);
  });

  it("throws when no index is returned", async () => {
    stubFetch(() => jsonResponse({ indexes: [] }));
    await expect(getAirQuality(point, KEY)).rejects.toMatchObject({
      code: "upstream",
    });
  });
});

describe("getSolar", () => {
  it("returns demo data without a key", async () => {
    expect((await getSolar(point, undefined)).demo).toBe(true);
  });

  it("classifies high potential", async () => {
    stubFetch(() =>
      jsonResponse({
        solarPotential: {
          maxArrayPanelsCount: 20,
          solarPanelConfigs: [{ yearlyEnergyDcKwh: 9000 }],
        },
      }),
    );
    const result = await getSolar(point, KEY);
    expect(result.data.available).toBe(true);
    expect(result.data.potential).toBe("high");
    expect(result.data.yearlyEnergyKwh).toBe(9000);
  });

  it("classifies moderate and low potential", async () => {
    stubFetch(() =>
      jsonResponse({ solarPotential: { solarPanelConfigs: [{ yearlyEnergyDcKwh: 4000 }] } }),
    );
    expect((await getSolar(point, KEY)).data.potential).toBe("moderate");
    stubFetch(() =>
      jsonResponse({ solarPotential: { solarPanelConfigs: [{ yearlyEnergyDcKwh: 1000 }] } }),
    );
    expect((await getSolar(point, KEY)).data.potential).toBe("low");
  });

  it("returns a fallback when no configs exist", async () => {
    stubFetch(() => jsonResponse({ solarPotential: {} }));
    const result = await getSolar(point, KEY);
    expect(result.data.available).toBe(false);
  });

  it("treats configs without energy values as no potential", async () => {
    stubFetch(() =>
      jsonResponse({ solarPotential: { solarPanelConfigs: [{}] } }),
    );
    expect((await getSolar(point, KEY)).data.available).toBe(false);
  });

  it("degrades gracefully on upstream failure", async () => {
    stubFetch(() => jsonResponse("err", 500));
    const result = await getSolar(point, KEY);
    expect(result.data.available).toBe(false);
    expect(result.data.note).toMatch(/LED/);
  });
});

describe("getPollen", () => {
  it("returns demo data without a key", async () => {
    expect((await getPollen(point, undefined)).demo).toBe(true);
  });

  it("classifies pollen levels", () => {
    expect(classifyPollen(5)).toBe("high");
    expect(classifyPollen(3)).toBe("moderate");
    expect(classifyPollen(1)).toBe("low");
  });

  it("normalizes a high-pollen forecast", async () => {
    stubFetch(() =>
      jsonResponse({
        dailyInfo: [
          {
            pollenTypeInfo: [
              { displayName: "Grass", indexInfo: { value: 5 } },
              { displayName: "Tree", indexInfo: { value: 0 } },
            ],
          },
        ],
      }),
    );
    const result = await getPollen(point, KEY);
    expect(result.data.level).toBe("high");
    expect(result.data.types).toEqual(["Grass"]);
    expect(result.data.note).toMatch(/High pollen/);
  });

  it("normalizes a manageable forecast", async () => {
    stubFetch(() =>
      jsonResponse({
        dailyInfo: [
          { pollenTypeInfo: [{ displayName: "Weed", indexInfo: { value: 2 } }] },
        ],
      }),
    );
    expect((await getPollen(point, KEY)).data.note).toMatch(/manageable/);
  });

  it("returns a fallback when no pollen data exists", async () => {
    stubFetch(() => jsonResponse({ dailyInfo: [{ pollenTypeInfo: [] }] }));
    expect((await getPollen(point, KEY)).data.available).toBe(false);
  });

  it("returns a fallback when the forecast is missing entirely", async () => {
    stubFetch(() => jsonResponse({}));
    expect((await getPollen(point, KEY)).data.available).toBe(false);
  });

  it("ignores entries without an index value or name", async () => {
    stubFetch(() =>
      jsonResponse({
        dailyInfo: [
          {
            pollenTypeInfo: [
              { displayName: "Grass", indexInfo: { value: 3 } },
              { indexInfo: { value: 4 } },
              {},
            ],
          },
        ],
      }),
    );
    const result = await getPollen(point, KEY);
    expect(result.data.types).toEqual(["Grass"]);
    expect(result.data.level).toBe("high");
  });

  it("degrades gracefully on failure", async () => {
    stubFetch(() => jsonResponse("err", 500));
    expect((await getPollen(point, KEY)).data.available).toBe(false);
  });
});

describe("getTimezone", () => {
  it("returns demo data without a key", async () => {
    expect((await getTimezone(point, undefined)).demo).toBe(true);
  });

  it("normalizes a valid timezone", async () => {
    stubFetch(() =>
      jsonResponse({
        status: "OK",
        timeZoneId: "America/New_York",
        timeZoneName: "Eastern",
        rawOffset: -18000,
        dstOffset: 3600,
      }),
    );
    const result = await getTimezone(point, KEY, 1000);
    expect(result.data.timeZoneId).toBe("America/New_York");
    expect(result.data.rawOffsetSec).toBe(-18000);
  });

  it("applies defaults for partial data", async () => {
    stubFetch(() => jsonResponse({ status: "OK", timeZoneId: "UTC" }));
    const result = await getTimezone(point, KEY);
    expect(result.data.timeZoneName).toBe("UTC");
    expect(result.data.rawOffsetSec).toBe(0);
  });

  it("throws when the status is not OK", async () => {
    stubFetch(() => jsonResponse({ status: "ZERO_RESULTS" }));
    await expect(getTimezone(point, KEY)).rejects.toMatchObject({
      code: "upstream",
    });
  });
});
