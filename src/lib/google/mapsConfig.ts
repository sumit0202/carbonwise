/**
 * Runtime Maps JavaScript API configuration.
 *
 * The browser key is delivered at runtime through /api/config rather than baked
 * into the bundle, so the same build works with or without a key. When no key
 * is present the UI shows an accessible fallback instead of a live map.
 */

import { getBrowserKey } from "@/lib/google/config";

export interface MapsConfig {
  mapsApiKey: string | null;
  mapsAvailable: boolean;
}

export function getMapsConfig(): MapsConfig {
  const key = getBrowserKey();
  return { mapsApiKey: key ?? null, mapsAvailable: key !== undefined };
}
