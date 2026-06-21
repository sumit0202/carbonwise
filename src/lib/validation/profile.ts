/**
 * Zod schemas for all user-supplied profile and activity data.
 * Every field has explicit bounds (max length, numeric range) so malformed or
 * malicious input is rejected before it reaches storage or calculations.
 */

import { z } from "zod";

export const MAX_CITY_LENGTH = 120;
export const MAX_LABEL_LENGTH = 80;
export const MAX_HOUSEHOLD = 20;
export const MAX_WEEKLY_TRAVEL_KM = 5000;
export const MAX_ELECTRICITY_KWH = 10000;
export const MAX_ACTIVITY_KG = 1000;

export const dietSchema = z.enum([
  "vegan",
  "vegetarian",
  "pescatarian",
  "omnivore",
  "heavy_meat",
]);

export const commuteSchema = z.enum([
  "walk",
  "bike",
  "transit",
  "ev",
  "car",
  "mixed",
]);

export const recyclingSchema = z.enum(["none", "some", "most", "all"]);

export const shoppingSchema = z.enum(["minimal", "average", "frequent"]);

export const goalSchema = z.enum([
  "overall",
  "transport",
  "energy",
  "food",
  "waste",
]);

export const categorySchema = z.enum([
  "transport",
  "home",
  "food",
  "shopping",
  "waste",
]);

export const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

export const profileSchema = z.object({
  city: z.preprocess(
    (value) =>
      typeof value === "string" && value.trim() === "" ? undefined : value,
    z
      .string()
      .trim()
      .max(MAX_CITY_LENGTH, `City must be ${MAX_CITY_LENGTH} characters or fewer`)
      .optional(),
  ),
  coordinates: coordinatesSchema.optional(),
  householdSize: z
    .number({ message: "Household size is required" })
    .int("Household size must be a whole number")
    .min(1, "Household size must be at least 1")
    .max(MAX_HOUSEHOLD, `Household size must be ${MAX_HOUSEHOLD} or fewer`),
  diet: dietSchema,
  commuteMode: commuteSchema,
  weeklyTravelKm: z
    .number({ message: "Weekly travel is required" })
    .min(0, "Travel cannot be negative")
    .max(MAX_WEEKLY_TRAVEL_KM, "That travel distance looks too high"),
  electricityKwhPerMonth: z
    .number({ message: "Electricity use is required" })
    .min(0, "Electricity cannot be negative")
    .max(MAX_ELECTRICITY_KWH, "That electricity figure looks too high"),
  shoppingLevel: shoppingSchema,
  recycling: recyclingSchema,
  goal: goalSchema,
});

export const manualActivitySchema = z.object({
  id: z.string().min(1).max(64),
  category: categorySchema,
  label: z
    .string()
    .trim()
    .min(1, "Describe the activity")
    .max(MAX_LABEL_LENGTH, `Keep it under ${MAX_LABEL_LENGTH} characters`),
  weeklyKgCo2e: z
    .number({ message: "Enter an estimate" })
    .min(0, "Cannot be negative")
    .max(MAX_ACTIVITY_KG, "That estimate looks too high"),
});

export type ProfileInput = z.infer<typeof profileSchema>;
export type ManualActivityInput = z.infer<typeof manualActivitySchema>;

/** Flattens Zod field errors into a simple { field: message } map for forms. */
export function fieldErrors(
  error: z.ZodError,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
