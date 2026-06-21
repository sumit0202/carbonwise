import { describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "jest-axe";
import { Landing } from "@/components/layout/Landing";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { CalculatorView } from "@/components/calculator/CalculatorView";
import { EcoGuidePanel } from "@/components/assistant/EcoGuidePanel";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { LocationInsights } from "@/components/maps/LocationInsights";
import { calculateFootprint } from "@/lib/emissions/calculator";
import { generateRecommendations } from "@/lib/recommendations/ecoGuide";
import { DEFAULT_PROFILE } from "@/lib/options";
import type { InsightsData } from "@/hooks/useLocationInsights";

const footprint = calculateFootprint(DEFAULT_PROFILE);
const recommendations = generateRecommendations({
  profile: DEFAULT_PROFILE,
  footprint,
});

async function expectNoViolations(ui: React.ReactElement) {
  const { container } = render(ui);
  expect(await axe(container)).toHaveNoViolations();
}

describe("accessibility (axe)", () => {
  it("landing has no violations", async () => {
    await expectNoViolations(<Landing onStart={vi.fn()} demoMode />);
  });

  it("profile form has no violations", async () => {
    await expectNoViolations(
      <ProfileForm initialProfile={DEFAULT_PROFILE} onSave={vi.fn()} />,
    );
  });

  it("calculator has no violations", async () => {
    await expectNoViolations(
      <CalculatorView
        footprint={footprint}
        activities={[]}
        onAddActivity={vi.fn()}
        onRemoveActivity={vi.fn()}
      />,
    );
  });

  it("assistant has no violations", async () => {
    await expectNoViolations(
      <EcoGuidePanel
        recommendations={recommendations}
        actions={[]}
        onSetStatus={vi.fn()}
      />,
    );
  });

  it("dashboard has no violations", async () => {
    await expectNoViolations(
      <DashboardView
        footprint={footprint}
        history={[
          { date: "2026-01-01", weeklyKgCo2e: 60, ecoScore: 40 },
          { date: "2026-01-02", weeklyKgCo2e: 55, ecoScore: 45 },
        ]}
        actions={[]}
        recommendations={recommendations}
        onExport={() => "{}"}
        onClearAll={vi.fn()}
      />,
    );
  });

  it("location insights has no violations", async () => {
    const data: InsightsData = {
      coords: { lat: 47.6, lng: -122.3 },
      air: {
        data: { aqi: 42, category: "Good", dominantPollutant: "pm25", healthRecommendation: "ok" },
        demo: true,
      },
      solar: { data: { available: true, potential: "high", note: "n" }, demo: true },
      pollen: { data: { available: true, level: "low", types: [], note: "n" }, demo: true },
      timezone: {
        data: { timeZoneId: "UTC", timeZoneName: "UTC", rawOffsetSec: 0, dstOffsetSec: 0 },
        demo: true,
      },
      places: { data: { category: "recycling", places: [] }, demo: true },
    };
    await expectNoViolations(
      <LocationInsights
        status="ready"
        data={data}
        category="recycling"
        setCategory={vi.fn()}
        apiKey={null}
      />,
    );
  });
});
