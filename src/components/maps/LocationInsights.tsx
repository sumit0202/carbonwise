"use client";

import { MapView } from "@/components/maps/MapView";
import { DataSourceBadge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { SelectField } from "@/components/ui/FormControls";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { localTimeLabel } from "@/lib/insights";
import type { InsightsData, InsightsStatus } from "@/hooks/useLocationInsights";
import type { PlaceCategory } from "@/lib/google/schemas";

const PLACE_OPTIONS: ReadonlyArray<{ value: PlaceCategory; label: string }> = [
  { value: "recycling", label: "Recycling centers" },
  { value: "ev_charging", label: "EV charging stations" },
  { value: "bike_shop", label: "Bike shops" },
  { value: "transit_station", label: "Public transit stations" },
  { value: "farmers_market", label: "Farmers markets" },
  { value: "plant_forward_restaurant", label: "Plant-forward restaurants" },
];

interface LocationInsightsProps {
  status: InsightsStatus;
  data: InsightsData;
  category: PlaceCategory;
  setCategory: (category: PlaceCategory) => void;
  apiKey: string | null;
}

export function LocationInsights({
  status,
  data,
  category,
  setCategory,
  apiKey,
}: LocationInsightsProps) {
  return (
    <section aria-labelledby="insights-heading">
      <h2 id="insights-heading">Local environment insights</h2>
      <p>
        Powered by Google Maps Platform. Data loads only when you open this tab.
      </p>

      {status === "empty" ? (
        <Card>
          <p>
            Add a city or use your location in the profile to unlock local air
            quality, solar, pollen and nearby eco-friendly places.
          </p>
        </Card>
      ) : null}

      {status === "error" ? (
        <StatusMessage
          tone="error"
          message="We couldn't load local insights for that location. Please try a different city."
        />
      ) : null}

      {status === "loading" ? (
        <StatusMessage message="Loading local environment insights…" />
      ) : null}

      {status === "ready" ? (
        <>
          <Card>
            <h3>Map</h3>
            <MapView apiKey={apiKey} coords={data.coords} />
          </Card>

          <div className="grid grid-2">
            <Card>
              <h3>
                Air quality{" "}
                {data.air ? <DataSourceBadge demo={data.air.demo} /> : null}
              </h3>
              {data.air ? (
                <>
                  <p className="stat" style={{ fontSize: "1.5rem" }}>
                    AQI {data.air.data.aqi}
                  </p>
                  <p>{data.air.data.category}</p>
                  <p className="muted">{data.air.data.healthRecommendation}</p>
                </>
              ) : (
                <p className="muted">Air quality data is unavailable here.</p>
              )}
            </Card>

            <Card>
              <h3>
                Rooftop solar{" "}
                {data.solar ? <DataSourceBadge demo={data.solar.demo} /> : null}
              </h3>
              {data.solar ? (
                <>
                  <p>
                    Potential: <strong>{data.solar.data.potential}</strong>
                  </p>
                  <p className="muted">{data.solar.data.note}</p>
                </>
              ) : (
                <p className="muted">Solar data is unavailable here.</p>
              )}
            </Card>

            <Card>
              <h3>
                Pollen{" "}
                {data.pollen ? <DataSourceBadge demo={data.pollen.demo} /> : null}
              </h3>
              {data.pollen ? (
                <>
                  <p>
                    Level: <strong>{data.pollen.data.level}</strong>
                  </p>
                  <p className="muted">{data.pollen.data.note}</p>
                </>
              ) : (
                <p className="muted">Pollen data is unavailable here.</p>
              )}
            </Card>

            <Card>
              <h3>
                Local time{" "}
                {data.timezone ? (
                  <DataSourceBadge demo={data.timezone.demo} />
                ) : null}
              </h3>
              {data.timezone ? (
                <p>{localTimeLabel(data.timezone.data)}</p>
              ) : (
                <p className="muted">Timezone data is unavailable here.</p>
              )}
            </Card>
          </div>

          <Card>
            <h3>
              Nearby eco-friendly places{" "}
              {data.places ? <DataSourceBadge demo={data.places.demo} /> : null}
            </h3>
            <SelectField
              id="place-category"
              label="Place type"
              value={category}
              options={PLACE_OPTIONS}
              onChange={(v) => setCategory(v as PlaceCategory)}
            />
            {data.places && data.places.data.places.length > 0 ? (
              <ul aria-label="Nearby places">
                {data.places.data.places.map((place) => (
                  <li key={`${place.name}-${place.location.lat}-${place.location.lng}`}>
                    <strong>{place.name}</strong>
                    {place.address ? ` — ${place.address}` : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="muted">No matching places found nearby.</p>
            )}
          </Card>
        </>
      ) : null}
    </section>
  );
}
