/**
 * Central access to Google API configuration via environment variables only.
 * Keys are read here and nowhere else, so it is easy to verify the server key
 * never reaches client code.
 */

/** Server-side key used to proxy Google APIs. Never sent to the browser. */
export function getServerKey(): string | undefined {
  const key = process.env.GOOGLE_MAPS_SERVER_API_KEY;
  return key && key.trim().length > 0 ? key : undefined;
}

/** Public browser key for the Maps JavaScript API. Safe to expose. */
export function getBrowserKey(): string | undefined {
  const key = process.env.GOOGLE_MAPS_BROWSER_API_KEY;
  return key && key.trim().length > 0 ? key : undefined;
}

/**
 * Demo mode is active when no server key is configured. In demo mode the app
 * returns labelled fixture data instead of calling real Google endpoints.
 */
export function isDemoMode(): boolean {
  return getServerKey() === undefined;
}

/** Default timeout (ms) for every external Google call. */
export const REQUEST_TIMEOUT_MS = 8000;
