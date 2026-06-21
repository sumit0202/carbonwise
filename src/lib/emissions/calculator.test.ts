import { describe, expect, it } from "vitest";
import {
  CATEGORY_ORDER,
  calculateFootprint,
  computeEcoScore,
  computeFoodWeekly,
  computeHomeWeekly,
  computeShoppingWeekly,
  computeTransportWeekly,
  computeWasteWeekly,
  determineConfidence,
  findTopContributor,
  round1,
  sumActivities,
} from "@/lib/emissions/calculator";
import {
  HIGH_IMPACT_WEEKLY_KG,
  SUSTAINABLE_WEEKLY_KG,
} from "@/lib/emissions/factors";
import type { ManualActivity, UserProfile } from "@/types";

const baseProfile: UserProfile = {
  city: "Seattle",
  householdSize: 2,
  diet: "omnivore",
  commuteMode: "car",
  weeklyTravelKm: 100,
  electricityKwhPerMonth: 300,
  shoppingLevel: "average",
  recycling: "some",
  goal: "overall",
};

describe("round1", () => {
  it("rounds to one decimal place", () => {
    expect(round1(1.249)).toBe(1.2);
    expect(round1(1.25)).toBe(1.3);
  });
});

describe("category computations", () => {
  it("computes transport from km and mode factor", () => {
    expect(computeTransportWeekly(baseProfile)).toBeCloseTo(19.2);
  });

  it("computes zero transport for walking", () => {
    expect(computeTransportWeekly({ ...baseProfile, commuteMode: "walk" })).toBe(0);
  });

  it("divides home energy by household size", () => {
    const single = computeHomeWeekly({ ...baseProfile, householdSize: 1 });
    const shared = computeHomeWeekly({ ...baseProfile, householdSize: 2 });
    expect(shared).toBeCloseTo(single / 2);
  });

  it("maps diet to a weekly value", () => {
    expect(computeFoodWeekly(baseProfile)).toBe(39);
    expect(computeFoodWeekly({ ...baseProfile, diet: "vegan" })).toBe(20);
  });

  it("maps shopping level to a weekly value", () => {
    expect(computeShoppingWeekly(baseProfile)).toBe(18);
  });

  it("divides waste by household size", () => {
    expect(computeWasteWeekly({ ...baseProfile, householdSize: 1 })).toBe(9);
  });
});

describe("sumActivities", () => {
  const activities: ManualActivity[] = [
    { id: "1", category: "transport", label: "a", weeklyKgCo2e: 5 },
    { id: "2", category: "transport", label: "b", weeklyKgCo2e: 3 },
    { id: "3", category: "food", label: "c", weeklyKgCo2e: 2 },
  ];

  it("sums only matching category", () => {
    expect(sumActivities(activities, "transport")).toBe(8);
    expect(sumActivities(activities, "food")).toBe(2);
    expect(sumActivities(activities, "waste")).toBe(0);
  });
});

describe("computeEcoScore", () => {
  it("maps the sustainable target to 100", () => {
    expect(computeEcoScore(SUSTAINABLE_WEEKLY_KG)).toBe(100);
  });
  it("maps the high-impact reference to 0", () => {
    expect(computeEcoScore(HIGH_IMPACT_WEEKLY_KG)).toBe(0);
  });
  it("clamps above 100 and below 0", () => {
    expect(computeEcoScore(10)).toBe(100);
    expect(computeEcoScore(500)).toBe(0);
  });
});

describe("determineConfidence", () => {
  it("is high with three or more signals", () => {
    expect(
      determineConfidence(baseProfile, [
        { id: "1", category: "food", label: "x", weeklyKgCo2e: 1 },
      ]),
    ).toBe("high");
  });
  it("is medium with one or two signals", () => {
    const profile: UserProfile = {
      ...baseProfile,
      city: undefined,
      electricityKwhPerMonth: 0,
    };
    expect(determineConfidence(profile, [])).toBe("medium");
  });
  it("is low with no signals", () => {
    const profile: UserProfile = {
      ...baseProfile,
      city: undefined,
      weeklyTravelKm: 0,
      electricityKwhPerMonth: 0,
    };
    expect(determineConfidence(profile, [])).toBe("low");
  });
});

describe("findTopContributor", () => {
  it("returns the highest emitting category", () => {
    const result = findTopContributor([
      { category: "transport", weeklyKgCo2e: 5 },
      { category: "food", weeklyKgCo2e: 12 },
    ]);
    expect(result).toBe("food");
  });
});

describe("calculateFootprint", () => {
  it("returns a complete result", () => {
    const result = calculateFootprint(baseProfile);
    expect(result.byCategory).toHaveLength(CATEGORY_ORDER.length);
    expect(result.weeklyKgCo2e).toBeGreaterThan(0);
    expect(result.monthlyKgCo2e).toBeGreaterThan(result.weeklyKgCo2e);
    expect(CATEGORY_ORDER).toContain(result.topContributor);
    expect(result.ecoScore).toBeGreaterThanOrEqual(0);
  });

  it("includes manual activities in the relevant category", () => {
    const withActivity = calculateFootprint(baseProfile, [
      { id: "1", category: "food", label: "flight", weeklyKgCo2e: 10 },
    ]);
    const food = withActivity.byCategory.find((c) => c.category === "food");
    expect(food?.weeklyKgCo2e).toBe(49);
  });

  it("defaults activities to an empty list", () => {
    expect(() => calculateFootprint(baseProfile)).not.toThrow();
  });
});
