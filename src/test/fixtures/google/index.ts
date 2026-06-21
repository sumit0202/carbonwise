/**
 * Typed demo fixtures for Google APIs.
 *
 * These are returned (clearly labelled as "Demo data") whenever no server API
 * key is configured, and are reused by the test suite. They are realistic but
 * synthetic — never presented as live data.
 */

import type {
  AirQualityResult,
  GeocodeResult,
  PlaceCategory,
  PlacesResult,
  PollenResult,
  RoutesResult,
  SolarResult,
  TimezoneResult,
} from "@/lib/google/schemas";

export const demoGeocode: GeocodeResult = {
  location: { lat: 47.61, lng: -122.33 },
  formattedAddress: "Seattle, WA, USA (demo)",
};

export const demoRoutes: RoutesResult = {
  options: [
    { mode: "DRIVE", distanceKm: 12.4, durationMinutes: 22, estimatedKgCo2e: 2.38 },
    { mode: "TRANSIT", distanceKm: 13.1, durationMinutes: 38, estimatedKgCo2e: 0.54 },
    { mode: "BICYCLE", distanceKm: 11.8, durationMinutes: 46, estimatedKgCo2e: 0 },
    { mode: "WALK", distanceKm: 11.2, durationMinutes: 140, estimatedKgCo2e: 0 },
  ],
};

const DEMO_PLACES: Record<PlaceCategory, PlacesResult["places"]> = {
  recycling: [
    { name: "Greenwood Recycling Center", address: "100 Eco Way", location: { lat: 47.62, lng: -122.34 } },
    { name: "North Transfer Station", address: "200 Reuse Rd", location: { lat: 47.6, lng: -122.35 } },
  ],
  ev_charging: [
    { name: "Downtown EV Hub", address: "5 Volt St", location: { lat: 47.61, lng: -122.33 } },
  ],
  bike_shop: [
    { name: "Cascade Bike Shop", address: "12 Pedal Ave", location: { lat: 47.63, lng: -122.32 } },
  ],
  transit_station: [
    { name: "Westlake Station", address: "400 Pine St", location: { lat: 47.61, lng: -122.34 } },
  ],
  farmers_market: [
    { name: "Pike Place Market", address: "85 Pike St", location: { lat: 47.61, lng: -122.34 } },
  ],
  plant_forward_restaurant: [
    { name: "Plum Bistro", address: "1429 12th Ave", location: { lat: 47.61, lng: -122.32 } },
  ],
};

export function demoPlaces(category: PlaceCategory): PlacesResult {
  return { category, places: DEMO_PLACES[category] };
}

export const demoAirQuality: AirQualityResult = {
  aqi: 42,
  category: "Good air quality",
  dominantPollutant: "pm25",
  healthRecommendation:
    "Air quality is good. It's a great time for outdoor low-carbon activities like walking or cycling.",
};

export const demoSolar: SolarResult = {
  available: true,
  potential: "high",
  maxPanelCount: 24,
  yearlyEnergyKwh: 9200,
  note: "Strong rooftop solar potential — panels could offset a large share of grid electricity.",
};

export const demoPollen: PollenResult = {
  available: true,
  level: "moderate",
  types: ["Grass", "Tree"],
  note: "Moderate pollen today. Sensitive individuals may prefer indoor low-carbon activities.",
};

export const demoTimezone: TimezoneResult = {
  timeZoneId: "America/Los_Angeles",
  timeZoneName: "Pacific Daylight Time",
  rawOffsetSec: -28800,
  dstOffsetSec: 3600,
};
