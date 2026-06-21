"use client";

import { useEffect, useState } from "react";

export interface RuntimeConfig {
  mapsApiKey: string | null;
  mapsAvailable: boolean;
  demoMode: boolean;
}

const FALLBACK: RuntimeConfig = {
  mapsApiKey: null,
  mapsAvailable: false,
  demoMode: true,
};

/** Loads public runtime config from /api/config once on mount. */
export function useRuntimeConfig(): { config: RuntimeConfig; loaded: boolean } {
  const [config, setConfig] = useState<RuntimeConfig>(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    const controller = new AbortController();
    fetch("/api/config", { signal: controller.signal })
      .then((res) => res.json() as Promise<RuntimeConfig>)
      .then((data) => {
        if (active) {
          setConfig(data);
          setLoaded(true);
        }
      })
      .catch(() => {
        if (active) setLoaded(true);
      });
    return () => {
      active = false;
      controller.abort();
    };
  }, []);

  return { config, loaded };
}
