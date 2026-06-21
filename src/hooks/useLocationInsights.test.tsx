import { afterEach, describe, expect, it, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import {
  toEnvironmentContext,
  useLocationInsights,
  type InsightsData,
} from "@/hooks/useLocationInsights";

afterEach(() => vi.unstubAllGlobals());

function envelope(data: unknown, demo = true) {
  return new Response(JSON.stringify({ data, demo }), { status: 200 });
}

interface RouteMap {
  [fragment: string]: () => Response | Promise<Response>;
}

function routeFetch(routes: RouteMap) {
  return vi.fn(async (url: string) => {
    const match = Object.keys(routes).find((key) => url.includes(key));
    if (!match) throw new Error(`no route for ${url}`);
    return routes[match]!();
  });
}

const defaultRoutes: RouteMap = {
  "/geocode": () => envelope({ location: { lat: 47.6, lng: -122.3 }, formattedAddress: "X" }),
  "/air-quality": () => envelope({ aqi: 42, category: "Good", dominantPollutant: "pm25", healthRecommendation: "ok" }),
  "/solar": () => envelope({ available: true, potential: "high", note: "n" }),
  "/pollen": () => envelope({ available: true, level: "moderate", types: [], note: "n" }),
  "/timezone": () => envelope({ timeZoneId: "UTC", timeZoneName: "UTC", rawOffsetSec: 0, dstOffsetSec: 0 }),
  "/places": () => envelope({ category: "recycling", places: [] }),
};

describe("useLocationInsights", () => {
  it("is disabled when not enabled", () => {
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: false, coordinates: { lat: 1, lng: 2 } }),
    );
    expect(result.current.status).toBe("disabled");
  });

  it("is empty when enabled without a location", () => {
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: true }),
    );
    expect(result.current.status).toBe("empty");
  });

  it("loads all insights from coordinates", async () => {
    vi.stubGlobal("fetch", routeFetch(defaultRoutes));
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: true, coordinates: { lat: 47.6, lng: -122.3 } }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data.air?.data.aqi).toBe(42);
    expect(result.current.data.coords).toEqual({ lat: 47.6, lng: -122.3 });
  });

  it("geocodes a city first when no coordinates are given", async () => {
    vi.stubGlobal("fetch", routeFetch(defaultRoutes));
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: true, city: "Seattle" }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data.coords).toEqual({ lat: 47.6, lng: -122.3 });
  });

  it("errors when geocoding fails", async () => {
    vi.stubGlobal(
      "fetch",
      routeFetch({ ...defaultRoutes, "/geocode": () => new Response("no", { status: 500 }) }),
    );
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: true, city: "Nowhere" }),
    );
    await waitFor(() => expect(result.current.status).toBe("error"));
  });

  it("tolerates individual endpoint failures", async () => {
    vi.stubGlobal(
      "fetch",
      routeFetch({
        ...defaultRoutes,
        "/solar": () => new Response("no", { status: 500 }),
        "/air-quality": () => {
          throw new Error("boom");
        },
      }),
    );
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: true, coordinates: { lat: 1, lng: 2 } }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    expect(result.current.data.solar).toBeUndefined();
    expect(result.current.data.air).toBeUndefined();
    expect(result.current.data.pollen).toBeDefined();
  });

  it("refetches places when the category changes", async () => {
    const fetchMock = routeFetch(defaultRoutes);
    vi.stubGlobal("fetch", fetchMock);
    const { result } = renderHook(() =>
      useLocationInsights({ enabled: true, coordinates: { lat: 1, lng: 2 } }),
    );
    await waitFor(() => expect(result.current.status).toBe("ready"));
    const before = fetchMock.mock.calls.length;
    act(() => result.current.setCategory("ev_charging"));
    await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(before));
  });

  it("aborts an in-flight load when disabled", async () => {
    vi.stubGlobal("fetch", routeFetch(defaultRoutes));
    const { result, rerender } = renderHook(
      (props: { enabled: boolean }) =>
        useLocationInsights({ ...props, coordinates: { lat: 1, lng: 2 } }),
      { initialProps: { enabled: true } },
    );
    rerender({ enabled: false });
    await waitFor(() => expect(result.current.status).toBe("disabled"));
  });
});

describe("toEnvironmentContext", () => {
  it("maps insight data into an environment context", () => {
    const data: InsightsData = {
      air: { data: { aqi: 80, category: "", dominantPollutant: "", healthRecommendation: "" }, demo: true },
      pollen: { data: { available: true, level: "high", types: [], note: "" }, demo: true },
      solar: { data: { available: true, potential: "moderate", note: "" }, demo: true },
    };
    expect(toEnvironmentContext(data)).toEqual({
      airQualityIndex: 80,
      pollenLevel: "high",
      solarPotential: "moderate",
    });
  });

  it("returns undefined fields when data is absent", () => {
    expect(toEnvironmentContext({})).toEqual({
      airQualityIndex: undefined,
      pollenLevel: undefined,
      solarPotential: undefined,
    });
  });
});
