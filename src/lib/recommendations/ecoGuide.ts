/**
 * EcoGuide — the personalized rule-based assistant.
 *
 * It runs every rule against the user's context, then ranks the resulting
 * recommendations. The user's stated goal boosts the matching category so the
 * advice feels personal, while overall impact (kg CO2e saved) breaks ties.
 */

import { RULES, type RuleContext } from "@/lib/recommendations/rules";
import type {
  EmissionCategory,
  EnvironmentContext,
  FootprintResult,
  GoalPreference,
  Recommendation,
  UserProfile,
} from "@/types";

export const DEFAULT_MAX_RECOMMENDATIONS = 6;

const GOAL_TO_CATEGORY: Record<GoalPreference, EmissionCategory | null> = {
  overall: null,
  transport: "transport",
  energy: "home",
  food: "food",
  waste: "waste",
};

export interface EcoGuideInput {
  profile: UserProfile;
  footprint: FootprintResult;
  environment?: EnvironmentContext;
  maxResults?: number;
}

export function generateRecommendations({
  profile,
  footprint,
  environment = {},
  maxResults = DEFAULT_MAX_RECOMMENDATIONS,
}: EcoGuideInput): Recommendation[] {
  const ctx: RuleContext = { profile, footprint, environment };
  const goalCategory = GOAL_TO_CATEGORY[profile.goal];

  const matched = RULES.map((rule) => rule(ctx)).filter(
    (rec): rec is Recommendation => rec !== null,
  );

  const ranked = matched.sort((a, b) => {
    const aGoal = goalCategory && a.category === goalCategory ? 1 : 0;
    const bGoal = goalCategory && b.category === goalCategory ? 1 : 0;
    if (aGoal !== bGoal) return bGoal - aGoal;
    return b.estimatedWeeklySavingsKg - a.estimatedWeeklySavingsKg;
  });

  return ranked.slice(0, maxResults);
}

/** Total potential weekly savings across a list of recommendations. */
export function totalPotentialSavings(
  recommendations: readonly Recommendation[],
): number {
  const sum = recommendations.reduce(
    (total, r) => total + r.estimatedWeeklySavingsKg,
    0,
  );
  return Math.round(sum * 10) / 10;
}
