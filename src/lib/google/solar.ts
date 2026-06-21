/**
 * Solar API client — rooftop solar potential.
 * Coverage is partial worldwide, so any upstream failure degrades gracefully to
 * a useful fallback message about general home-energy actions.
 */

import { getServerKey } from "@/lib/google/config";
import { fetchJson } from "@/lib/google/http";
import type { ApiEnvelope, LatLng, SolarResult } from "@/lib/google/schemas";
import { demoSolar } from "@/test/fixtures/google";

const ENDPOINT = "https://solar.googleapis.com/v1/buildingInsights:findClosest";

const FALLBACK_NOTE =
  "Rooftop solar data isn't available for this location. You can still cut home emissions with LED lighting, a smart thermostat, and a renewable energy tariff.";

interface SolarUpstream {
  solarPotential?: {
    maxArrayPanelsCount?: number;
    solarPanelConfigs?: Array<{ yearlyEnergyDcKwh?: number }>;
  };
}

function classifyPotential(yearlyKwh: number): SolarResult["potential"] {
  if (yearlyKwh >= 8000) return "high";
  if (yearlyKwh >= 3000) return "moderate";
  return "low";
}

export async function getSolar(
  input: LatLng,
  key: string | undefined = getServerKey(),
): Promise<ApiEnvelope<SolarResult>> {
  if (!key) return { data: demoSolar, demo: true };

  try {
    const url = `${ENDPOINT}?location.latitude=${input.lat}&location.longitude=${input.lng}&key=${key}`;
    const raw = await fetchJson<SolarUpstream>(url);

    const configs = raw.solarPotential?.solarPanelConfigs ?? [];
    const best = configs.reduce(
      (max, c) => Math.max(max, c.yearlyEnergyDcKwh ?? 0),
      0,
    );
    if (best <= 0) {
      return {
        data: { available: false, potential: "low", note: FALLBACK_NOTE },
        demo: false,
      };
    }

    return {
      data: {
        available: true,
        potential: classifyPotential(best),
        maxPanelCount: raw.solarPotential?.maxArrayPanelsCount,
        yearlyEnergyKwh: Math.round(best),
        note: "Rooftop solar could offset a meaningful share of your grid electricity.",
      },
      demo: false,
    };
  } catch {
    // Solar coverage gaps are expected; degrade gracefully rather than error.
    return {
      data: { available: false, potential: "low", note: FALLBACK_NOTE },
      demo: false,
    };
  }
}
