/**
 * Pure, deterministic carbon footprint calculator.
 *
 * Every function here is referentially transparent: given the same profile and
 * activities it always returns the same result, with no side effects. This
 * keeps the core domain trivially testable and safe to memoize in the UI.
 */

import {
  DIET_FACTORS_KG_PER_WEEK,
  ELECTRICITY_FACTOR_KG_PER_KWH,
  HIGH_IMPACT_WEEKLY_KG,
  SHOPPING_FACTORS_KG_PER_WEEK,
  SUSTAINABLE_WEEKLY_KG,
  TRANSPORT_FACTORS_KG_PER_KM,
  WASTE_FACTORS_KG_PER_WEEK,
  WEEKS_PER_MONTH,
} from "@/lib/emissions/factors";
import type {
  CategoryBreakdown,
  ConfidenceLevel,
  EmissionCategory,
  FootprintResult,
  ManualActivity,
  UserProfile,
} from "@/types";

export const CATEGORY_ORDER: readonly EmissionCategory[] = [
  "transport",
  "home",
  "food",
  "shopping",
  "waste",
];

/** Rounds to one decimal place to avoid noisy floating point output. */
export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** Weekly transport emissions from commute mode and distance travelled. */
export function computeTransportWeekly(profile: UserProfile): number {
  return profile.weeklyTravelKm * TRANSPORT_FACTORS_KG_PER_KM[profile.commuteMode];
}

/**
 * Weekly home-energy emissions. Electricity is a shared household resource, so
 * the total is divided by household size to get a per-person share.
 */
export function computeHomeWeekly(profile: UserProfile): number {
  const weeklyKwh = profile.electricityKwhPerMonth / WEEKS_PER_MONTH;
  const householdTotal = weeklyKwh * ELECTRICITY_FACTOR_KG_PER_KWH;
  return householdTotal / profile.householdSize;
}

/** Weekly food emissions from diet style (per person). */
export function computeFoodWeekly(profile: UserProfile): number {
  return DIET_FACTORS_KG_PER_WEEK[profile.diet];
}

/** Weekly emissions from consumer goods (per person). */
export function computeShoppingWeekly(profile: UserProfile): number {
  return SHOPPING_FACTORS_KG_PER_WEEK[profile.shoppingLevel];
}

/** Weekly waste emissions, divided by household size for a per-person share. */
export function computeWasteWeekly(profile: UserProfile): number {
  return WASTE_FACTORS_KG_PER_WEEK[profile.recycling] / profile.householdSize;
}

/** Sum of manual activities belonging to a given category. */
export function sumActivities(
  activities: readonly ManualActivity[],
  category: EmissionCategory,
): number {
  return activities
    .filter((a) => a.category === category)
    .reduce((total, a) => total + a.weeklyKgCo2e, 0);
}

const BASE_BY_CATEGORY: Record<
  EmissionCategory,
  (profile: UserProfile) => number
> = {
  transport: computeTransportWeekly,
  home: computeHomeWeekly,
  food: computeFoodWeekly,
  shopping: computeShoppingWeekly,
  waste: computeWasteWeekly,
};

/** Converts a weekly footprint into a 0–100 eco score (higher is better). */
export function computeEcoScore(weeklyKgCo2e: number): number {
  const range = HIGH_IMPACT_WEEKLY_KG - SUSTAINABLE_WEEKLY_KG;
  const ratio = (HIGH_IMPACT_WEEKLY_KG - weeklyKgCo2e) / range;
  const score = Math.round(ratio * 100);
  return Math.max(0, Math.min(100, score));
}

/**
 * Confidence reflects how much real input the estimate is based on. More
 * supplied signals (travel, electricity, location, manual activities) raise it.
 */
export function determineConfidence(
  profile: UserProfile,
  activities: readonly ManualActivity[],
): ConfidenceLevel {
  let signals = 0;
  if (profile.weeklyTravelKm > 0) signals += 1;
  if (profile.electricityKwhPerMonth > 0) signals += 1;
  if (activities.length > 0) signals += 1;
  if (profile.city) signals += 1;
  if (signals >= 3) return "high";
  if (signals >= 1) return "medium";
  return "low";
}

/** Picks the highest-emitting category, preferring calculator order on ties. */
export function findTopContributor(
  breakdown: readonly CategoryBreakdown[],
): EmissionCategory {
  return breakdown.reduce((top, current) =>
    current.weeklyKgCo2e > top.weeklyKgCo2e ? current : top,
  ).category;
}

/** Computes the complete footprint result from a profile and manual activities. */
export function calculateFootprint(
  profile: UserProfile,
  activities: readonly ManualActivity[] = [],
): FootprintResult {
  const byCategory: CategoryBreakdown[] = CATEGORY_ORDER.map((category) => {
    const base = BASE_BY_CATEGORY[category](profile);
    const extra = sumActivities(activities, category);
    return { category, weeklyKgCo2e: round1(base + extra) };
  });

  const weeklyKgCo2e = round1(
    byCategory.reduce((total, c) => total + c.weeklyKgCo2e, 0),
  );

  return {
    weeklyKgCo2e,
    monthlyKgCo2e: round1(weeklyKgCo2e * WEEKS_PER_MONTH),
    byCategory,
    topContributor: findTopContributor(byCategory),
    confidence: determineConfidence(profile, activities),
    ecoScore: computeEcoScore(weeklyKgCo2e),
  };
}
