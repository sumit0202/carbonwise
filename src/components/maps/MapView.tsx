"use client";

import { useEffect, useRef, useState } from "react";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { loadGoogleMaps } from "@/lib/maps/loader";
import type { LatLng } from "@/lib/google/schemas";

interface MapsApi {
  Map: new (el: HTMLElement, options: unknown) => unknown;
}

interface MapViewProps {
  apiKey: string | null;
  coords?: LatLng;
}

type MapState = "loading" | "ready" | "error";

export function MapView({ apiKey, coords }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<MapState>("loading");

  useEffect(() => {
    if (!apiKey || !coords) return;
    let active = true;
    setState("loading");
    loadGoogleMaps(apiKey)
      .then((maps) => {
        if (!active || !containerRef.current) return;
        const api = maps as MapsApi;
        new api.Map(containerRef.current, {
          center: { lat: coords.lat, lng: coords.lng },
          zoom: 12,
          disableDefaultUI: false,
        });
        setState("ready");
      })
      .catch(() => {
        if (active) setState("error");
      });
    return () => {
      active = false;
    };
  }, [apiKey, coords]);

  if (!apiKey) {
    return (
      <div className="map-fallback" role="note">
        <p>
          <strong>Interactive map unavailable.</strong>
        </p>
        <p>
          A Maps browser key isn&apos;t configured, so the live map is turned
          off. All other location insights below still work.
        </p>
      </div>
    );
  }

  if (!coords) {
    return (
      <p className="muted">
        Add a city or use your location in your profile to see the map.
      </p>
    );
  }

  if (state === "error") {
    return (
      <div className="map-fallback" role="alert">
        <p>
          <strong>The map couldn&apos;t load.</strong> Please check your
          connection. Location insights below are unaffected.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div
        ref={containerRef}
        className="map-canvas"
        role="application"
        aria-label="Interactive map of your area"
      />
      <StatusMessage message={state === "loading" ? "Loading map…" : "Map loaded."} />
    </div>
  );
}
