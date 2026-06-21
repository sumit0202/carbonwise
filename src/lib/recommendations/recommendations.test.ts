import { describe, expect, it } from "vitest";
import { calculateFootprint } from "@/lib/emissions/calculator";
import {
  DEFAULT_MAX_RECOMMENDATIONS,
  generateRecommendations,
  totalPotentialSavings,
} from "@/lib/recommendations/ecoGuide";
import { RULES, impactFromSavings } from "@/lib/recommendations/rules";
import type { EnvironmentContext, UserProfile } from "@/types";

const carProfile: UserProfile = {
  city: "Seattle",
  householdSize: 2,
  diet: "heavy_meat",
  commuteMode: "car",
  weeklyTravelKm: 200,
  electricityKwhPerMonth: 400,
  shoppingLevel: "frequent",
  recycling: "none",
  goal: "overall",
};

function recs(profile: UserProfile, environment?: EnvironmentContext) {
  const footprint = calculateFootprint(profile, []);
  // Request all matches so rule-presence assertions aren't affected by ranking.
  return generateRecommendations({
    profile,
    footprint,
    environment,
    maxResults: 50,
  });
}

describe("impactFromSavings", () => {
  it("classifies savings into impact levels", () => {
    expect(impactFromSavings(20)).toBe("high");
    expect(impactFromSavings(10)).toBe("medium");
    expect(impactFromSavings(2)).toBe("low");
  });
});

describe("generateRecommendations", () => {
  it("produces several tailored recommendations for a high-impact profile", () => {
    const result = generateRecommendations({
      profile: carProfile,
      footprint: calculateFootprint(carProfile),
    });
    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(DEFAULT_MAX_RECOMMENDATIONS);
    expect(result.some((r) => r.category === "transport")).toBe(true);
  });

  it("includes an EV suggestion for a petrol car commuter", () => {
    expect(recs(carProfile).some((r) => r.id === "transport-ev")).toBe(true);
  });

  it("does not suggest EV for a mixed commuter", () => {
    const result = recs({ ...carProfile, commuteMode: "mixed" });
    expect(result.some((r) => r.id === "transport-ev")).toBe(false);
    expect(result.some((r) => r.id === "transport-mode-shift")).toBe(true);
  });

  it("omits transport mode shift when already low-carbon", () => {
    const result = recs({ ...carProfile, commuteMode: "bike" });
    expect(result.some((r) => r.id === "transport-mode-shift")).toBe(false);
  });

  it("omits transport mode shift when no travel", () => {
    const result = recs({ ...carProfile, weeklyTravelKm: 0 });
    expect(result.some((r) => r.id === "transport-mode-shift")).toBe(false);
    expect(result.some((r) => r.id === "transport-ev")).toBe(false);
  });

  it("suggests active travel only in good conditions", () => {
    const good = recs(carProfile, { airQualityIndex: 30, pollenLevel: "low" });
    expect(good.some((r) => r.id === "transport-active-travel")).toBe(true);

    const badAir = recs(carProfile, { airQualityIndex: 150 });
    expect(badAir.some((r) => r.id === "transport-active-travel")).toBe(false);

    const highPollen = recs(carProfile, { pollenLevel: "high" });
    expect(highPollen.some((r) => r.id === "transport-active-travel")).toBe(false);
  });

  it("active travel reason changes with air quality data", () => {
    const withAir = recs(carProfile, { airQualityIndex: 30 }).find(
      (r) => r.id === "transport-active-travel",
    );
    expect(withAir?.personalizedReason).toMatch(/air quality/i);
    const withoutAir = recs(carProfile).find(
      (r) => r.id === "transport-active-travel",
    );
    expect(withoutAir?.personalizedReason).toMatch(/commute mix/i);
  });

  it("does not suggest active travel for existing walkers", () => {
    const result = recs({ ...carProfile, commuteMode: "walk" });
    expect(result.some((r) => r.id === "transport-active-travel")).toBe(false);
  });

  it("suggests plant-forward eating for meat eaters but not vegetarians", () => {
    expect(recs(carProfile).some((r) => r.id === "food-plant-forward")).toBe(true);
    expect(
      recs({ ...carProfile, diet: "vegetarian" }).some(
        (r) => r.id === "food-plant-forward",
      ),
    ).toBe(false);
  });

  it("targets vegetarian for an omnivore", () => {
    const rec = recs({ ...carProfile, diet: "omnivore" }).find(
      (r) => r.id === "food-plant-forward",
    );
    expect(rec?.estimatedWeeklySavingsKg).toBeGreaterThan(0);
  });

  it("suggests home efficiency only with electricity use", () => {
    expect(recs(carProfile).some((r) => r.id === "home-efficiency")).toBe(true);
    expect(
      recs({ ...carProfile, electricityKwhPerMonth: 0 }).some(
        (r) => r.id === "home-efficiency",
      ),
    ).toBe(false);
  });

  it("suggests solar only when potential is high and electricity is used", () => {
    expect(
      recs(carProfile, { solarPotential: "high" }).some(
        (r) => r.id === "home-solar",
      ),
    ).toBe(true);
    expect(recs(carProfile).some((r) => r.id === "home-solar")).toBe(false);
    expect(
      recs(
        { ...carProfile, electricityKwhPerMonth: 0 },
        { solarPotential: "high" },
      ).some((r) => r.id === "home-solar"),
    ).toBe(false);
  });

  it("suggests recycling improvements unless already recycling all", () => {
    expect(recs(carProfile).some((r) => r.id === "waste-recycling")).toBe(true);
    const some = recs({ ...carProfile, recycling: "some" }).find(
      (r) => r.id === "waste-recycling",
    );
    expect(some?.estimatedWeeklySavingsKg).toBe(2);
    expect(
      recs({ ...carProfile, recycling: "all" }).some(
        (r) => r.id === "waste-recycling",
      ),
    ).toBe(false);
  });

  it("suggests reduced shopping only for frequent shoppers", () => {
    expect(recs(carProfile).some((r) => r.id === "shopping-reduce")).toBe(true);
    expect(
      recs({ ...carProfile, shoppingLevel: "minimal" }).some(
        (r) => r.id === "shopping-reduce",
      ),
    ).toBe(false);
  });

  it("adds an air-quality recommendation when AQI is elevated", () => {
    expect(
      recs(carProfile, { airQualityIndex: 130 }).some(
        (r) => r.id === "air-quality-aware",
      ),
    ).toBe(true);
    expect(
      recs(carProfile, { airQualityIndex: 40 }).some(
        (r) => r.id === "air-quality-aware",
      ),
    ).toBe(false);
    expect(recs(carProfile).some((r) => r.id === "air-quality-aware")).toBe(false);
  });

  it("prioritizes the user's goal category", () => {
    expect(recs({ ...carProfile, goal: "food" })[0]?.category).toBe("food");
    expect(recs({ ...carProfile, goal: "transport" })[0]?.category).toBe(
      "transport",
    );
    expect(recs({ ...carProfile, goal: "waste" })[0]?.category).toBe("waste");
  });

  it("respects the maxResults limit", () => {
    const result = generateRecommendations({
      profile: carProfile,
      footprint: calculateFootprint(carProfile),
      maxResults: 2,
    });
    expect(result).toHaveLength(2);
  });

  it("every rule returns a complete recommendation shape", () => {
    expect(RULES.length).toBeGreaterThan(0);
    for (const rec of recs(carProfile, { solarPotential: "high", airQualityIndex: 130 })) {
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.personalizedReason.length).toBeGreaterThan(0);
      expect(rec.timeRequired.length).toBeGreaterThan(0);
    }
  });
});

describe("totalPotentialSavings", () => {
  it("sums savings across recommendations", () => {
    expect(
      totalPotentialSavings([
        {
          id: "a",
          category: "transport",
          title: "t",
          explanation: "e",
          estimatedWeeklySavingsKg: 5.2,
          difficulty: "easy",
          cost: "free",
          timeRequired: "x",
          impact: "medium",
          personalizedReason: "p",
        },
        {
          id: "b",
          category: "food",
          title: "t",
          explanation: "e",
          estimatedWeeklySavingsKg: 1.1,
          difficulty: "easy",
          cost: "free",
          timeRequired: "x",
          impact: "low",
          personalizedReason: "p",
        },
      ]),
    ).toBe(6.3);
  });
});
