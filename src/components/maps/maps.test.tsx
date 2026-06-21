import { afterEach, describe, expect, it, vi } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MapView } from "@/components/maps/MapView";
import { LocationInsights } from "@/components/maps/LocationInsights";
import { loadGoogleMaps } from "@/lib/maps/loader";
import type { InsightsData } from "@/hooks/useLocationInsights";

vi.mock("@/lib/maps/loader", () => ({ loadGoogleMaps: vi.fn() }));
const mockedLoad = vi.mocked(loadGoogleMaps);

afterEach(() => vi.clearAllMocks());

const coords = { lat: 47.6, lng: -122.3 };

describe("MapView", () => {
  it("shows a fallback when no browser key is configured", () => {
    render(<MapView apiKey={null} coords={coords} />);
    expect(screen.getByText(/interactive map unavailable/i)).toBeInTheDocument();
  });

  it("prompts for a location when coordinates are missing", () => {
    render(<MapView apiKey="key" coords={undefined} />);
    expect(screen.getByText(/add a city or use your location/i)).toBeInTheDocument();
  });

  it("loads and renders the map", async () => {
    mockedLoad.mockResolvedValue({ Map: vi.fn() });
    render(<MapView apiKey="key" coords={coords} />);
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/map loaded/i),
    );
  });

  it("shows an accessible error when the map fails to load", async () => {
    mockedLoad.mockRejectedValue(new Error("boom"));
    render(<MapView apiKey="key" coords={coords} />);
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load/i),
    );
  });

  it("ignores a load that resolves after unmount", async () => {
    let resolve!: (value: unknown) => void;
    mockedLoad.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );
    const { unmount } = render(<MapView apiKey="key" coords={coords} />);
    unmount();
    await act(async () => {
      resolve({ Map: vi.fn() });
      await Promise.resolve();
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});

const fullData: InsightsData = {
  coords,
  air: {
    data: { aqi: 42, category: "Good", dominantPollutant: "pm25", healthRecommendation: "Go outside" },
    demo: true,
  },
  solar: { data: { available: true, potential: "high", note: "Solar note" }, demo: false },
  pollen: { data: { available: true, level: "moderate", types: ["Grass"], note: "Pollen note" }, demo: true },
  timezone: {
    data: { timeZoneId: "UTC", timeZoneName: "UTC", rawOffsetSec: 0, dstOffsetSec: 0 },
    demo: true,
  },
  places: {
    data: {
      category: "recycling",
      places: [
        { name: "Center", address: "1 St", location: coords },
        { name: "No address", address: "", location: { lat: 47.7, lng: -122.4 } },
      ],
    },
    demo: true,
  },
};

describe("LocationInsights", () => {
  it("prompts to add a location when empty", () => {
    render(
      <LocationInsights
        status="empty"
        data={{}}
        category="recycling"
        setCategory={vi.fn()}
        apiKey={null}
      />,
    );
    expect(screen.getByText(/add a city or use your location/i)).toBeInTheDocument();
  });

  it("shows a loading message", () => {
    render(
      <LocationInsights
        status="loading"
        data={{}}
        category="recycling"
        setCategory={vi.fn()}
        apiKey={null}
      />,
    );
    expect(screen.getByText(/loading local environment/i)).toBeInTheDocument();
  });

  it("shows an error message", () => {
    render(
      <LocationInsights
        status="error"
        data={{}}
        category="recycling"
        setCategory={vi.fn()}
        apiKey={null}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent(/couldn't load/i);
  });

  it("renders all insight cards and reacts to category change", async () => {
    const setCategory = vi.fn();
    render(
      <LocationInsights
        status="ready"
        data={fullData}
        category="recycling"
        setCategory={setCategory}
        apiKey={null}
      />,
    );
    expect(screen.getByText(/AQI 42/)).toBeInTheDocument();
    expect(screen.getByText("Solar note")).toBeInTheDocument();
    expect(screen.getByText("Pollen note")).toBeInTheDocument();
    expect(screen.getByText("Center")).toBeInTheDocument();
    expect(screen.getAllByText("Demo data").length).toBeGreaterThan(0);
    expect(screen.getByText("Live data")).toBeInTheDocument();
    await userEvent.selectOptions(
      screen.getByLabelText(/place type/i),
      "ev_charging",
    );
    expect(setCategory).toHaveBeenCalledWith("ev_charging");
  });

  it("shows unavailable states when data is missing", () => {
    render(
      <LocationInsights
        status="ready"
        data={{ coords }}
        category="recycling"
        setCategory={vi.fn()}
        apiKey={null}
      />,
    );
    expect(screen.getByText(/air quality data is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/solar data is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/pollen data is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/timezone data is unavailable/i)).toBeInTheDocument();
    expect(screen.getByText(/no matching places/i)).toBeInTheDocument();
  });
});
