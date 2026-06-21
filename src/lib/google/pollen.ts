/**
 * Pollen API client — local pollen forecast for health-aware outdoor advice.
 * Degrades gracefully where coverage is unavailable.
 */

import { getServerKey } from "@/lib/google/config";
import { fetchJson } from "@/lib/google/http";
import type { ApiEnvelope, LatLng, PollenResult } from "@/lib/google/schemas";
import { demoPollen } from "@/test/fixtures/google";

const ENDPOINT = "https://pollen.googleapis.com/v1/forecast:lookup";

const FALLBACK_NOTE =
  "Pollen data isn't available for this location. Outdoor walking and cycling remain great low-carbon options when you feel well.";

interface PollenUpstream {
  dailyInfo?: Array<{
    pollenTypeInfo?: Array<{
      displayName?: string;
      indexInfo?: { value?: number };
    }>;
  }>;
}

export function classifyPollen(value: number): PollenResult["level"] {
  if (value >= 4) return "high";
  if (value >= 2) return "moderate";
  return "low";
}

export async function getPollen(
  input: LatLng,
  key: string | undefined = getServerKey(),
): Promise<ApiEnvelope<PollenResult>> {
  if (!key) return { data: demoPollen, demo: true };

  try {
    const url = `${ENDPOINT}?location.latitude=${input.lat}&location.longitude=${input.lng}&days=1&key=${key}`;
    const raw = await fetchJson<PollenUpstream>(url);

    const typeInfo = raw.dailyInfo?.[0]?.pollenTypeInfo ?? [];
    if (typeInfo.length === 0) {
      return {
        data: { available: false, level: "low", types: [], note: FALLBACK_NOTE },
        demo: false,
      };
    }

    const maxValue = typeInfo.reduce(
      (max, t) => Math.max(max, t.indexInfo?.value ?? 0),
      0,
    );
    const types = typeInfo
      .filter((t) => (t.indexInfo?.value ?? 0) > 0 && t.displayName)
      .map((t) => t.displayName as string);

    return {
      data: {
        available: true,
        level: classifyPollen(maxValue),
        types,
        note:
          maxValue >= 4
            ? "High pollen today. Consider indoor low-carbon activities if you're sensitive."
            : "Pollen levels are manageable for most outdoor low-carbon activities.",
      },
      demo: false,
    };
  } catch {
    return {
      data: { available: false, level: "low", types: [], note: FALLBACK_NOTE },
      demo: false,
    };
  }
}
