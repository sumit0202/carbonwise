/**
 * Places API (New) client — finds nearby eco-friendly places.
 * Uses searchNearby with a field mask so only the fields we render are returned.
 */

import { getServerKey } from "@/lib/google/config";
import { fetchJson } from "@/lib/google/http";
import type {
  ApiEnvelope,
  LatLng,
  Place,
  PlaceCategory,
  PlacesResult,
} from "@/lib/google/schemas";
import { demoPlaces } from "@/test/fixtures/google";

const ENDPOINT = "https://places.googleapis.com/v1/places:searchNearby";
const FIELD_MASK = "places.displayName,places.formattedAddress,places.location";
const SEARCH_RADIUS_METERS = 5000;

const CATEGORY_TYPES: Record<PlaceCategory, string[]> = {
  recycling: ["recycling_center"],
  ev_charging: ["electric_vehicle_charging_station"],
  bike_shop: ["bicycle_store"],
  transit_station: ["transit_station"],
  farmers_market: ["market"],
  plant_forward_restaurant: ["vegan_restaurant", "vegetarian_restaurant"],
};

interface PlacesUpstream {
  places?: Array<{
    displayName?: { text?: string };
    formattedAddress?: string;
    location?: { latitude?: number; longitude?: number };
  }>;
}

export interface PlacesInput extends LatLng {
  category: PlaceCategory;
}

export async function findPlaces(
  input: PlacesInput,
  key: string | undefined = getServerKey(),
): Promise<ApiEnvelope<PlacesResult>> {
  if (!key) return { data: demoPlaces(input.category), demo: true };

  const raw = await fetchJson<PlacesUpstream>(ENDPOINT, {
    method: "POST",
    headers: { "X-Goog-Api-Key": key, "X-Goog-FieldMask": FIELD_MASK },
    body: {
      includedTypes: CATEGORY_TYPES[input.category],
      maxResultCount: 10,
      locationRestriction: {
        circle: {
          center: { latitude: input.lat, longitude: input.lng },
          radius: SEARCH_RADIUS_METERS,
        },
      },
    },
  });

  const places: Place[] = (raw.places ?? [])
    .map((p) => {
      const lat = p.location?.latitude;
      const lng = p.location?.longitude;
      if (lat === undefined || lng === undefined) return null;
      return {
        name: p.displayName?.text ?? "Unnamed place",
        address: p.formattedAddress ?? "",
        location: { lat, lng },
      } satisfies Place;
    })
    .filter((p): p is Place => p !== null);

  return { data: { category: input.category, places }, demo: false };
}
