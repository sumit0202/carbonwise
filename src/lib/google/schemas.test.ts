import { describe, expect, it } from "vitest";
import {
  airQualityResultSchema,
  geocodeRequestSchema,
  geocodeResultSchema,
  placesRequestSchema,
  placesResultSchema,
  pointRequestSchema,
  pollenResultSchema,
  routesRequestSchema,
  routesResultSchema,
  solarResultSchema,
  timezoneResultSchema,
} from "@/lib/google/schemas";
import {
  demoAirQuality,
  demoGeocode,
  demoPlaces,
  demoPollen,
  demoRoutes,
  demoSolar,
  demoTimezone,
} from "@/test/fixtures/google";

describe("request schemas", () => {
  it("validates address length", () => {
    expect(geocodeRequestSchema.safeParse({ address: "Se" }).success).toBe(false);
    expect(
      geocodeRequestSchema.safeParse({ address: "Seattle" }).success,
    ).toBe(true);
  });

  it("coerces lat/lng from strings", () => {
    const parsed = pointRequestSchema.parse({ lat: "47.6", lng: "-122.3" });
    expect(parsed.lat).toBeCloseTo(47.6);
  });

  it("rejects out-of-range points", () => {
    expect(pointRequestSchema.safeParse({ lat: "200", lng: "0" }).success).toBe(
      false,
    );
  });

  it("validates a routes request", () => {
    expect(
      routesRequestSchema.safeParse({
        origin: { lat: 1, lng: 2 },
        destination: { lat: 3, lng: 4 },
      }).success,
    ).toBe(true);
  });

  it("validates a places category", () => {
    expect(
      placesRequestSchema.safeParse({ lat: 1, lng: 2, category: "recycling" })
        .success,
    ).toBe(true);
    expect(
      placesRequestSchema.safeParse({ lat: 1, lng: 2, category: "bogus" })
        .success,
    ).toBe(false);
  });
});

describe("result schemas match demo fixtures", () => {
  it("geocode", () => {
    expect(geocodeResultSchema.safeParse(demoGeocode).success).toBe(true);
  });
  it("routes", () => {
    expect(routesResultSchema.safeParse(demoRoutes).success).toBe(true);
  });
  it("places", () => {
    expect(placesResultSchema.safeParse(demoPlaces("recycling")).success).toBe(
      true,
    );
  });
  it("air quality", () => {
    expect(airQualityResultSchema.safeParse(demoAirQuality).success).toBe(true);
  });
  it("solar", () => {
    expect(solarResultSchema.safeParse(demoSolar).success).toBe(true);
  });
  it("pollen", () => {
    expect(pollenResultSchema.safeParse(demoPollen).success).toBe(true);
  });
  it("timezone", () => {
    expect(timezoneResultSchema.safeParse(demoTimezone).success).toBe(true);
  });
});
