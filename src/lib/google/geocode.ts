/** Geocoding API client — converts an address into approximate coordinates. */

import { getServerKey } from "@/lib/google/config";
import { GoogleApiError, safeMessage } from "@/lib/google/errors";
import { fetchJson } from "@/lib/google/http";
import type { ApiEnvelope, GeocodeResult } from "@/lib/google/schemas";
import { roundCoordinates } from "@/lib/utils/geo";
import { demoGeocode } from "@/test/fixtures/google";

const ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";

interface GeocodeUpstream {
  status: string;
  results?: Array<{
    formatted_address?: string;
    geometry?: { location?: { lat?: number; lng?: number } };
  }>;
}

export interface GeocodeInput {
  address: string;
}

export async function geocode(
  input: GeocodeInput,
): Promise<ApiEnvelope<GeocodeResult>> {
  const key = getServerKey();
  if (!key) return { data: demoGeocode, demo: true };

  const url = `${ENDPOINT}?address=${encodeURIComponent(input.address)}&key=${key}`;
  const raw = await fetchJson<GeocodeUpstream>(url);

  const first = raw.results?.[0];
  const location = first?.geometry?.location;
  if (!first || location?.lat === undefined || location.lng === undefined) {
    throw new GoogleApiError("upstream", safeMessage("upstream"), 502);
  }

  return {
    data: {
      location: roundCoordinates({ lat: location.lat, lng: location.lng }),
      formattedAddress: first.formatted_address ?? input.address,
    },
    demo: false,
  };
}
