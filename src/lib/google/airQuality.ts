/** Air Quality API client — current local conditions and health guidance. */

import { getServerKey } from "@/lib/google/config";
import { GoogleApiError, safeMessage } from "@/lib/google/errors";
import { fetchJson } from "@/lib/google/http";
import type { AirQualityResult, ApiEnvelope, LatLng } from "@/lib/google/schemas";
import { demoAirQuality } from "@/test/fixtures/google";

const ENDPOINT =
  "https://airquality.googleapis.com/v1/currentConditions:lookup";

interface AirQualityUpstream {
  indexes?: Array<{
    aqi?: number;
    category?: string;
    dominantPollutant?: string;
  }>;
  healthRecommendations?: { generalPopulation?: string };
}

export async function getAirQuality(
  input: LatLng,
  key: string | undefined = getServerKey(),
): Promise<ApiEnvelope<AirQualityResult>> {
  if (!key) return { data: demoAirQuality, demo: true };

  const raw = await fetchJson<AirQualityUpstream>(`${ENDPOINT}?key=${key}`, {
    method: "POST",
    body: {
      location: { latitude: input.lat, longitude: input.lng },
      extraComputations: ["HEALTH_RECOMMENDATIONS"],
      universalAqi: true,
    },
  });

  const index = raw.indexes?.[0];
  if (!index || index.aqi === undefined) {
    throw new GoogleApiError("upstream", safeMessage("upstream"), 502);
  }

  return {
    data: {
      aqi: index.aqi,
      category: index.category ?? "Unknown",
      dominantPollutant: index.dominantPollutant ?? "unknown",
      healthRecommendation:
        raw.healthRecommendations?.generalPopulation ??
        "No specific health recommendation is available right now.",
    },
    demo: false,
  };
}
