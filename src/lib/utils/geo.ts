import type { Coordinates } from "@/types";

/**
 * Privacy-preserving coordinate rounding.
 *
 * We never persist precise device coordinates. Rounding to 2 decimal places
 * reduces precision to roughly ~1.1 km, enough for city-level context while
 * preventing the storage of a user's exact location.
 */
export const COORDINATE_PRECISION = 2;

export function roundCoordinate(value: number): number {
  const factor = 10 ** COORDINATE_PRECISION;
  return Math.round(value * factor) / factor;
}

export function roundCoordinates(coords: Coordinates): Coordinates {
  return {
    lat: roundCoordinate(coords.lat),
    lng: roundCoordinate(coords.lng),
  };
}
