/**
 * EcoGuide rule set.
 *
 * Each rule is a pure function that inspects the user's profile, current
 * footprint and (optional) environmental context, and returns a tailored
 * Recommendation or null when it does not apply. Keeping every rule isolated
 * and side-effect free makes the assistant fully deterministic and testable.
 */

import { round1 } from "@/lib/emissions/calculator";
import {
  DIET_FACTORS_KG_PER_WEEK,
  TRANSPORT_FACTORS_KG_PER_KM,
} from "@/lib/emissions/factors";
import type {
  EnvironmentContext,
  FootprintResult,
  ImpactLevel,
  Recommendation,
  UserProfile,
} from "@/types";

export interface RuleContext {
  profile: UserProfile;
  footprint: FootprintResult;
  environment: EnvironmentContext;
}

export type Rule = (ctx: RuleContext) => Recommendation | null;

/** Derives a qualitative impact level from weekly kg CO2e savings. */
export function impactFromSavings(savingsKg: number): ImpactLevel {
  if (savingsKg >= 15) return "high";
  if (savingsKg >= 5) return "medium";
  return "low";
}

const transportModeShift: Rule = ({ profile }) => {
  if (profile.commuteMode !== "car" && profile.commuteMode !== "mixed") {
    return null;
  }
  if (profile.weeklyTravelKm <= 0) return null;
  const current = TRANSPORT_FACTORS_KG_PER_KM[profile.commuteMode];
  const savings = round1(
    profile.weeklyTravelKm * (current - TRANSPORT_FACTORS_KG_PER_KM.transit),
  );
  return {
    id: "transport-mode-shift",
    category: "transport",
    title: "Shift some car trips to public transit",
    explanation:
      "Replacing solo car journeys with public transit cuts per-kilometre emissions by roughly 80%.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "medium",
    cost: "low",
    timeRequired: "Plan once, ~10 min",
    impact: impactFromSavings(savings),
    personalizedReason: `You travel about ${profile.weeklyTravelKm} km a week, mostly by ${profile.commuteMode}.`,
  };
};

const transportEv: Rule = ({ profile }) => {
  if (profile.commuteMode !== "car") return null;
  if (profile.weeklyTravelKm <= 0) return null;
  const savings = round1(
    profile.weeklyTravelKm *
      (TRANSPORT_FACTORS_KG_PER_KM.car - TRANSPORT_FACTORS_KG_PER_KM.ev),
  );
  return {
    id: "transport-ev",
    category: "transport",
    title: "Consider an electric vehicle for unavoidable drives",
    explanation:
      "An EV charged from a typical grid emits far less per kilometre than a petrol car.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "hard",
    cost: "high",
    timeRequired: "Research over weeks",
    impact: impactFromSavings(savings),
    personalizedReason:
      "You currently rely on a petrol car for your weekly travel.",
  };
};

const transportActiveTravel: Rule = ({ profile, environment }) => {
  if (profile.commuteMode === "walk" || profile.commuteMode === "bike") {
    return null;
  }
  const goodAir = environment.airQualityIndex === undefined ||
    environment.airQualityIndex <= 100;
  const lowPollen = environment.pollenLevel !== "high";
  if (!goodAir || !lowPollen) return null;
  const savings = round1(
    Math.min(profile.weeklyTravelKm, 20) * TRANSPORT_FACTORS_KG_PER_KM.car,
  );
  return {
    id: "transport-active-travel",
    category: "transport",
    title: "Walk or cycle short local trips",
    explanation:
      "Trips under ~3 km are often faster by bike and produce zero direct emissions.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "easy",
    cost: "free",
    timeRequired: "Use existing trips",
    impact: impactFromSavings(savings),
    personalizedReason:
      environment.airQualityIndex !== undefined
        ? "Local air quality is currently good for outdoor activity."
        : "Active travel suits your current commute mix.",
  };
};

const dietPlantForward: Rule = ({ profile }) => {
  if (profile.diet === "vegan" || profile.diet === "vegetarian") return null;
  const target =
    profile.diet === "heavy_meat" ? "omnivore" : "vegetarian";
  const fullDiff =
    DIET_FACTORS_KG_PER_WEEK[profile.diet] - DIET_FACTORS_KG_PER_WEEK[target];
  // Assume a realistic partial shift (about 60% of the full diet change).
  const savings = round1(fullDiff * 0.6);
  return {
    id: "food-plant-forward",
    category: "food",
    title: "Add a few plant-based meals each week",
    explanation:
      "Swapping red meat for plants on several meals is one of the highest-impact food changes.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "easy",
    cost: "low",
    timeRequired: "Per meal",
    impact: impactFromSavings(savings),
    personalizedReason: `Your ${profile.diet.replace("_", " ")} diet is your largest food-related source.`,
  };
};

const homeEnergy: Rule = ({ profile }) => {
  if (profile.electricityKwhPerMonth <= 0) return null;
  const savings = round1(profile.electricityKwhPerMonth * 0.1 * 0.4 / 4.345);
  return {
    id: "home-efficiency",
    category: "home",
    title: "Lower standby power and switch to LED lighting",
    explanation:
      "Efficient lighting and cutting standby loads typically trims 10% off household electricity.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "easy",
    cost: "low",
    timeRequired: "1–2 hours",
    impact: impactFromSavings(savings),
    personalizedReason: `Your household uses about ${profile.electricityKwhPerMonth} kWh per month.`,
  };
};

const homeSolar: Rule = ({ profile, environment }) => {
  if (environment.solarPotential !== "high") return null;
  if (profile.electricityKwhPerMonth <= 0) return null;
  const savings = round1(profile.electricityKwhPerMonth * 0.4 * 0.5 / 4.345);
  return {
    id: "home-solar",
    category: "home",
    title: "Explore rooftop solar potential",
    explanation:
      "Your area shows strong rooftop solar potential, which can offset a large share of grid electricity.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "hard",
    cost: "high",
    timeRequired: "Project over months",
    impact: impactFromSavings(savings),
    personalizedReason:
      "Solar API data indicates high rooftop solar potential at your location.",
  };
};

const wasteRecycling: Rule = ({ profile }) => {
  if (profile.recycling === "all") return null;
  const savings = profile.recycling === "none" ? 4 : 2;
  return {
    id: "waste-recycling",
    category: "waste",
    title: "Recycle and compost more consistently",
    explanation:
      "Diverting recyclables and food scraps from landfill reduces methane and disposal emissions.",
    estimatedWeeklySavingsKg: savings,
    difficulty: "easy",
    cost: "free",
    timeRequired: "Daily habit",
    impact: impactFromSavings(savings),
    personalizedReason: `You currently recycle "${profile.recycling}" of your waste.`,
  };
};

const shoppingReduce: Rule = ({ profile }) => {
  if (profile.shoppingLevel !== "frequent") return null;
  return {
    id: "shopping-reduce",
    category: "shopping",
    title: "Buy less, choose secondhand and durable goods",
    explanation:
      "Extending the life of products and buying secondhand avoids the embodied carbon of new manufacturing.",
    estimatedWeeklySavingsKg: 6,
    difficulty: "medium",
    cost: "free",
    timeRequired: "Ongoing",
    impact: impactFromSavings(6),
    personalizedReason: "You described your shopping as frequent.",
  };
};

const airQualityAware: Rule = ({ environment }) => {
  if (environment.airQualityIndex === undefined) return null;
  if (environment.airQualityIndex <= 100) return null;
  return {
    id: "air-quality-aware",
    category: "transport",
    title: "Leave the car on high-pollution days",
    explanation:
      "When local air quality is poor, reducing car use both protects your health and avoids adding emissions.",
    estimatedWeeklySavingsKg: 3,
    difficulty: "easy",
    cost: "free",
    timeRequired: "On poor-air days",
    impact: impactFromSavings(3),
    personalizedReason: `Current local air quality index is ${environment.airQualityIndex}, which is elevated.`,
  };
};

export const RULES: readonly Rule[] = [
  transportModeShift,
  transportEv,
  transportActiveTravel,
  dietPlantForward,
  homeEnergy,
  homeSolar,
  wasteRecycling,
  shoppingReduce,
  airQualityAware,
];
