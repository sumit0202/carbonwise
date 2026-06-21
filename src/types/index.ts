/**
 * Shared domain types for CarbonWise.
 * Type-only declarations — no runtime code lives here.
 */

export type DietStyle =
  | "vegan"
  | "vegetarian"
  | "pescatarian"
  | "omnivore"
  | "heavy_meat";

export type CommuteMode = "walk" | "bike" | "transit" | "ev" | "car" | "mixed";

export type RecyclingHabit = "none" | "some" | "most" | "all";

export type GoalPreference =
  | "overall"
  | "transport"
  | "energy"
  | "food"
  | "waste";

export type EmissionCategory =
  | "transport"
  | "home"
  | "food"
  | "shopping"
  | "waste";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface UserProfile {
  city?: string;
  coordinates?: Coordinates;
  householdSize: number;
  diet: DietStyle;
  commuteMode: CommuteMode;
  weeklyTravelKm: number;
  electricityKwhPerMonth: number;
  shoppingLevel: ShoppingLevel;
  recycling: RecyclingHabit;
  goal: GoalPreference;
}

export type ShoppingLevel = "minimal" | "average" | "frequent";

/** A manually added activity, contributing extra weekly emissions. */
export interface ManualActivity {
  id: string;
  category: EmissionCategory;
  label: string;
  /** Weekly kg CO2e contributed by this activity. */
  weeklyKgCo2e: number;
}

export type ConfidenceLevel = "low" | "medium" | "high";

export interface CategoryBreakdown {
  category: EmissionCategory;
  weeklyKgCo2e: number;
}

export interface FootprintResult {
  weeklyKgCo2e: number;
  monthlyKgCo2e: number;
  byCategory: CategoryBreakdown[];
  topContributor: EmissionCategory;
  confidence: ConfidenceLevel;
  ecoScore: number;
}

export type Difficulty = "easy" | "medium" | "hard";
export type CostLevel = "free" | "low" | "medium" | "high";
export type ImpactLevel = "low" | "medium" | "high";
export type ActionStatus = "suggested" | "planned" | "done";

export interface Recommendation {
  id: string;
  category: EmissionCategory;
  title: string;
  explanation: string;
  estimatedWeeklySavingsKg: number;
  difficulty: Difficulty;
  cost: CostLevel;
  timeRequired: string;
  impact: ImpactLevel;
  personalizedReason: string;
}

export interface TrackedAction {
  id: string;
  status: ActionStatus;
}

/** Optional environmental context passed to EcoGuide for richer advice. */
export interface EnvironmentContext {
  airQualityIndex?: number;
  pollenLevel?: "low" | "moderate" | "high";
  solarPotential?: "low" | "moderate" | "high";
}

export interface PersistedState {
  version: number;
  profile?: UserProfile;
  activities: ManualActivity[];
  actions: TrackedAction[];
  history: HistoryPoint[];
}

export interface HistoryPoint {
  /** ISO date (yyyy-mm-dd). */
  date: string;
  weeklyKgCo2e: number;
  ecoScore: number;
}
