/** Human-readable option lists for profile selects, and a sensible default. */

import type {
  CommuteMode,
  DietStyle,
  GoalPreference,
  RecyclingHabit,
  ShoppingLevel,
  UserProfile,
} from "@/types";

export const DIET_OPTIONS: ReadonlyArray<{ value: DietStyle; label: string }> = [
  { value: "vegan", label: "Vegan" },
  { value: "vegetarian", label: "Vegetarian" },
  { value: "pescatarian", label: "Pescatarian" },
  { value: "omnivore", label: "Omnivore (some meat)" },
  { value: "heavy_meat", label: "Meat with most meals" },
];

export const COMMUTE_OPTIONS: ReadonlyArray<{ value: CommuteMode; label: string }> =
  [
    { value: "walk", label: "Walk" },
    { value: "bike", label: "Bike" },
    { value: "transit", label: "Public transit" },
    { value: "ev", label: "Electric vehicle" },
    { value: "car", label: "Petrol/diesel car" },
    { value: "mixed", label: "Mixed (car + transit)" },
  ];

export const RECYCLING_OPTIONS: ReadonlyArray<{
  value: RecyclingHabit;
  label: string;
}> = [
  { value: "none", label: "I don't recycle" },
  { value: "some", label: "I recycle some" },
  { value: "most", label: "I recycle most" },
  { value: "all", label: "I recycle and compost everything" },
];

export const SHOPPING_OPTIONS: ReadonlyArray<{
  value: ShoppingLevel;
  label: string;
}> = [
  { value: "minimal", label: "Minimal — only essentials" },
  { value: "average", label: "Average" },
  { value: "frequent", label: "Frequent — I buy new things often" },
];

export const GOAL_OPTIONS: ReadonlyArray<{ value: GoalPreference; label: string }> =
  [
    { value: "overall", label: "Reduce my overall footprint" },
    { value: "transport", label: "Focus on transport" },
    { value: "energy", label: "Focus on home energy" },
    { value: "food", label: "Focus on food" },
    { value: "waste", label: "Focus on waste" },
  ];

export const DEFAULT_PROFILE: UserProfile = {
  city: undefined,
  householdSize: 2,
  diet: "omnivore",
  commuteMode: "car",
  weeklyTravelKm: 100,
  electricityKwhPerMonth: 300,
  shoppingLevel: "average",
  recycling: "some",
  goal: "overall",
};
