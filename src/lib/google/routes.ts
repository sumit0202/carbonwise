/**
 * Routes API client — compares commute options and estimates their emissions.
 * One request per travel mode, each using a field mask to keep responses tiny.
 */

import { getServerKey } from "@/lib/google/config";
import { fetchJson } from "@/lib/google/http";
import type {
  ApiEnvelope,
  LatLng,
  RouteOption,
  RoutesResult,
  TravelMode,
} from "@/lib/google/schemas";
import { TRAVEL_MODES } from "@/lib/google/schemas";
import { TRANSPORT_FACTORS_KG_PER_KM } from "@/lib/emissions/factors";
import { round1 } from "@/lib/emissions/calculator";
import { demoRoutes } from "@/test/fixtures/google";

const ENDPOINT = "https://routes.googleapis.com/directions/v2:computeRoutes";
const FIELD_MASK = "routes.distanceMeters,routes.duration";

const MODE_FACTORS: Record<TravelMode, number> = {
  DRIVE: TRANSPORT_FACTORS_KG_PER_KM.car,
  TRANSIT: TRANSPORT_FACTORS_KG_PER_KM.transit,
  BICYCLE: TRANSPORT_FACTORS_KG_PER_KM.bike,
  WALK: TRANSPORT_FACTORS_KG_PER_KM.walk,
};

interface RoutesUpstream {
  routes?: Array<{ distanceMeters?: number; duration?: string }>;
}

export interface RoutesInput {
  origin: LatLng;
  destination: LatLng;
}

function parseDurationSeconds(duration: string | undefined): number {
  if (!duration) return 0;
  const match = /^(\d+)s$/.exec(duration);
  return match ? Number(match[1]) : 0;
}

function buildBody(input: RoutesInput, mode: TravelMode) {
  return {
    origin: { location: { latLng: { latitude: input.origin.lat, longitude: input.origin.lng } } },
    destination: {
      location: { latLng: { latitude: input.destination.lat, longitude: input.destination.lng } },
    },
    travelMode: mode,
  };
}

export async function computeRoutes(
  input: RoutesInput,
  key: string | undefined = getServerKey(),
): Promise<ApiEnvelope<RoutesResult>> {
  if (!key) return { data: demoRoutes, demo: true };

  const requests = TRAVEL_MODES.map(async (mode): Promise<RouteOption | null> => {
    const raw = await fetchJson<RoutesUpstream>(`${ENDPOINT}?key=${key}`, {
      method: "POST",
      headers: { "X-Goog-FieldMask": FIELD_MASK },
      body: buildBody(input, mode),
    });
    const route = raw.routes?.[0];
    if (!route || route.distanceMeters === undefined) return null;
    const distanceKm = round1(route.distanceMeters / 1000);
    return {
      mode,
      distanceKm,
      durationMinutes: Math.round(parseDurationSeconds(route.duration) / 60),
      estimatedKgCo2e: round1(distanceKm * MODE_FACTORS[mode]),
    };
  });

  const settled = await Promise.all(requests);
  return {
    data: { options: settled.filter((o): o is RouteOption => o !== null) },
    demo: false,
  };
}
