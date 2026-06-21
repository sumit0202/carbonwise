import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CarbonWiseApp } from "@/components/app/CarbonWiseApp";

function envelope(data: unknown) {
  return new Response(JSON.stringify({ data, demo: true }), { status: 200 });
}

function appFetch() {
  return vi.fn(async (url: string) => {
    if (url.includes("/api/config")) {
      return new Response(
        JSON.stringify({ mapsApiKey: null, mapsAvailable: false, demoMode: true }),
        { status: 200 },
      );
    }
    if (url.includes("/geocode")) {
      return envelope({ location: { lat: 47.6, lng: -122.3 }, formattedAddress: "Seattle" });
    }
    if (url.includes("/air-quality")) {
      return envelope({ aqi: 42, category: "Good", dominantPollutant: "pm25", healthRecommendation: "ok" });
    }
    if (url.includes("/solar")) return envelope({ available: true, potential: "high", note: "n" });
    if (url.includes("/pollen")) return envelope({ available: true, level: "low", types: [], note: "n" });
    if (url.includes("/timezone")) return envelope({ timeZoneId: "UTC", timeZoneName: "UTC", rawOffsetSec: 0, dstOffsetSec: 0 });
    if (url.includes("/places")) return envelope({ category: "recycling", places: [] });
    throw new Error(`unexpected url ${url}`);
  });
}

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal("fetch", appFetch());
});
afterEach(() => vi.unstubAllGlobals());

describe("CarbonWiseApp", () => {
  it("walks from landing through calculation and tabs", async () => {
    render(<CarbonWiseApp />);
    await waitFor(() =>
      expect(screen.getByText(/understand and shrink/i)).toBeInTheDocument(),
    );

    await userEvent.click(
      screen.getByRole("button", { name: /^calculate my footprint$/i }),
    );
    await userEvent.type(screen.getByLabelText(/city or area/i), "Seattle");
    await userEvent.click(
      screen.getByRole("button", { name: /^calculate my footprint$/i }),
    );

    expect(
      await screen.findByText(/your carbon footprint/i),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "EcoGuide" }));
    expect(
      screen.getByRole("heading", { name: /your personalized assistant/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(
      screen.getByRole("heading", { name: /tracking dashboard/i }),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Local Insights" }));
    await waitFor(() =>
      expect(screen.getByText(/AQI 42/)).toBeInTheDocument(),
    );
  });

  it("guides users to the profile before gated tabs", async () => {
    render(<CarbonWiseApp />);
    await waitFor(() =>
      expect(screen.getByText(/understand and shrink/i)).toBeInTheDocument(),
    );
    await userEvent.click(screen.getByRole("button", { name: "Dashboard" }));
    expect(screen.getByText(/start with your profile/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /go to profile/i }));
    expect(screen.getByRole("heading", { name: /your profile/i })).toBeInTheDocument();
  });
});
