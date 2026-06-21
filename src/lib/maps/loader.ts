/**
 * Lazily loads the Google Maps JavaScript API by injecting its script tag.
 *
 * The script is only requested when the map is actually shown, never on initial
 * page load. The document/window are injectable so the loader is fully testable
 * without a browser. The returned promise resolves once `google.maps` exists.
 */

const SCRIPT_ID = "google-maps-js";
const BASE_URL = "https://maps.googleapis.com/maps/api/js";

interface MapsWindow {
  google?: { maps?: unknown };
}

export interface LoaderDocument {
  getElementById(id: string): unknown;
  createElement(tag: "script"): MapsScriptElement;
  head: { appendChild(node: MapsScriptElement): void };
}

export interface MapsScriptElement {
  id: string;
  src: string;
  async: boolean;
  onload: (() => void) | null;
  onerror: (() => void) | null;
}

let pending: Promise<unknown> | null = null;

/** Test hook to clear the memoized loader promise between cases. */
export function _resetMapsLoader(): void {
  pending = null;
}

export function loadGoogleMaps(
  apiKey: string,
  win: MapsWindow = window as unknown as MapsWindow,
  doc: LoaderDocument = document as unknown as LoaderDocument,
): Promise<unknown> {
  if (win.google?.maps) return Promise.resolve(win.google.maps);
  if (pending) return pending;

  pending = new Promise((resolve, reject) => {
    const script = doc.createElement("script");
    script.id = SCRIPT_ID;
    script.src = `${BASE_URL}?key=${encodeURIComponent(apiKey)}&loading=async&libraries=maps,marker`;
    script.async = true;
    script.onload = () => {
      if (win.google?.maps) {
        resolve(win.google.maps);
      } else {
        pending = null;
        reject(new Error("Maps API loaded without google.maps"));
      }
    };
    script.onerror = () => {
      pending = null;
      reject(new Error("Failed to load Google Maps"));
    };
    doc.head.appendChild(script);
  });

  return pending;
}
