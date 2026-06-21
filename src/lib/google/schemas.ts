/**
 * Zod schemas for every Google proxy endpoint.
 *
 * Request schemas validate untrusted input (search params / bodies) with strict
 * bounds. Result schemas describe the normalized, minimal shape we return to
 * the browser — we never forward raw upstream payloads.
 */

import { z } from "zod";

export const MAX_ADDRESS_LENGTH = 200;
export const MIN_ADDRESS_LENGTH = 3;

export const latLngSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
});

export const geocodeRequestSchema = z.object({
  address: z
    .string()
    .trim()
    .min(MIN_ADDRESS_LENGTH, "Address is too short")
    .max(MAX_ADDRESS_LENGTH, "Address is too long"),
});

export const TRAVEL_MODES = ["DRIVE", "TRANSIT", "BICYCLE", "WALK"] as const;
export const travelModeSchema = z.enum(TRAVEL_MODES);

export const routesRequestSchema = z.object({
  origin: latLngSchema,
  destination: latLngSchema,
});

export const PLACE_CATEGORIES = [
  "recycling",
  "ev_charging",
  "bike_shop",
  "transit_station",
  "farmers_market",
  "plant_forward_restaurant",
] as const;
export const placeCategorySchema = z.enum(PLACE_CATEGORIES);

export const placesRequestSchema = latLngSchema.extend({
  category: placeCategorySchema,
});

export const pointRequestSchema = latLngSchema;

// ---- Normalized result schemas (server -> browser) ----

export const geocodeResultSchema = z.object({
  location: latLngSchema,
  formattedAddress: z.string(),
});

export const routeOptionSchema = z.object({
  mode: travelModeSchema,
  distanceKm: z.number(),
  durationMinutes: z.number(),
  estimatedKgCo2e: z.number(),
});
export const routesResultSchema = z.object({
  options: z.array(routeOptionSchema),
});

export const placeSchema = z.object({
  name: z.string(),
  address: z.string(),
  location: latLngSchema,
});
export const placesResultSchema = z.object({
  category: placeCategorySchema,
  places: z.array(placeSchema),
});

export const airQualityResultSchema = z.object({
  aqi: z.number(),
  category: z.string(),
  dominantPollutant: z.string(),
  healthRecommendation: z.string(),
});

export const solarResultSchema = z.object({
  available: z.boolean(),
  potential: z.enum(["low", "moderate", "high"]),
  maxPanelCount: z.number().optional(),
  yearlyEnergyKwh: z.number().optional(),
  note: z.string(),
});

export const pollenResultSchema = z.object({
  available: z.boolean(),
  level: z.enum(["low", "moderate", "high"]),
  types: z.array(z.string()),
  note: z.string(),
});

export const timezoneResultSchema = z.object({
  timeZoneId: z.string(),
  timeZoneName: z.string(),
  rawOffsetSec: z.number(),
  dstOffsetSec: z.number(),
});

export type LatLng = z.infer<typeof latLngSchema>;
export type TravelMode = z.infer<typeof travelModeSchema>;
export type PlaceCategory = z.infer<typeof placeCategorySchema>;
export type GeocodeResult = z.infer<typeof geocodeResultSchema>;
export type RouteOption = z.infer<typeof routeOptionSchema>;
export type RoutesResult = z.infer<typeof routesResultSchema>;
export type Place = z.infer<typeof placeSchema>;
export type PlacesResult = z.infer<typeof placesResultSchema>;
export type AirQualityResult = z.infer<typeof airQualityResultSchema>;
export type SolarResult = z.infer<typeof solarResultSchema>;
export type PollenResult = z.infer<typeof pollenResultSchema>;
export type TimezoneResult = z.infer<typeof timezoneResultSchema>;

/** Standard envelope returned by every Google proxy route. */
export interface ApiEnvelope<T> {
  data: T;
  demo: boolean;
}
