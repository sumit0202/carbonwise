"use client";

import { useEffect, useState } from "react";
import type {
  AirQualityResult,
  ApiEnvelope,
  GeocodeResult,
  LatLng,
  PlaceCategory,
  PlacesResult,
  PollenResult,
  SolarResult,
  TimezoneResult,
} from "@/lib/google/schemas";
import type { EnvironmentContext } from "@/types";

/** Derives the EcoGuide environment context from fetched insight data. */
export function toEnvironmentContext(data: InsightsData): EnvironmentContext {
  return {
    airQualityIndex: data.air?.data.aqi,
    pollenLevel: data.pollen?.data.level,
    solarPotential: data.solar?.data.potential,
  };
}

export interface InsightsData {
  coords?: LatLng;
  air?: ApiEnvelope<AirQualityResult>;
  solar?: ApiEnvelope<SolarResult>;
  pollen?: ApiEnvelope<PollenResult>;
  timezone?: ApiEnvelope<TimezoneResult>;
  places?: ApiEnvelope<PlacesResult>;
}

export type InsightsStatus =
  | "disabled"
  | "empty"
  | "loading"
  | "ready"
  | "error";

interface UseLocationInsightsArgs {
  enabled: boolean;
  city?: string;
  coordinates?: LatLng;
}

async function safeGet<T>(
  url: string,
  signal: AbortSignal,
): Promise<T | undefined> {
  try {
    const res = await fetch(url, { signal });
    if (!res.ok) return undefined;
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

export function useLocationInsights({
  enabled,
  city,
  coordinates,
}: UseLocationInsightsArgs) {
  const [status, setStatus] = useState<InsightsStatus>("disabled");
  const [data, setData] = useState<InsightsData>({});
  const [category, setCategory] = useState<PlaceCategory>("recycling");

  const lat = coordinates?.lat;
  const lng = coordinates?.lng;

  useEffect(() => {
    if (!enabled) {
      setStatus("disabled");
      return;
    }
    if (lat === undefined && !city) {
      setStatus("empty");
      return;
    }

    const controller = new AbortController();
    const { signal } = controller;

    async function load() {
      setStatus("loading");

      let coords: LatLng | undefined =
        lat !== undefined && lng !== undefined ? { lat, lng } : undefined;

      if (!coords && city) {
        const geo = await safeGet<ApiEnvelope<GeocodeResult>>(
          `/api/google/geocode?address=${encodeURIComponent(city)}`,
          signal,
        );
        coords = geo?.data.location;
      }

      if (!coords) {
        if (!signal.aborted) setStatus("error");
        return;
      }

      const point = `lat=${coords.lat}&lng=${coords.lng}`;
      const [air, solar, pollen, timezone, places] = await Promise.all([
        safeGet<ApiEnvelope<AirQualityResult>>(
          `/api/google/air-quality?${point}`,
          signal,
        ),
        safeGet<ApiEnvelope<SolarResult>>(`/api/google/solar?${point}`, signal),
        safeGet<ApiEnvelope<PollenResult>>(`/api/google/pollen?${point}`, signal),
        safeGet<ApiEnvelope<TimezoneResult>>(
          `/api/google/timezone?${point}`,
          signal,
        ),
        safeGet<ApiEnvelope<PlacesResult>>(
          `/api/google/places?${point}&category=${category}`,
          signal,
        ),
      ]);

      if (signal.aborted) return;
      setData({ coords, air, solar, pollen, timezone, places });
      setStatus("ready");
    }

    void load();
    return () => controller.abort();
  }, [enabled, city, lat, lng, category]);

  return { status, data, category, setCategory };
}
