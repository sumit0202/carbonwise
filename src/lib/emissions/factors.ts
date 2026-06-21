/**
 * Emission factors for CarbonWise.
 *
 * All values are approximate, sourced from public datasets (UK DEFRA 2023
 * conversion factors, EPA, and Our World in Data food footprint research).
 * They are intentionally simplified for an awareness tool, not an audit-grade
 * carbon accounting system. Every factor is documented with its unit.
 *
 * These constants are the single source of truth for the calculator and are
 * kept free of any logic so they are easy to review and update.
 */

import type {
  CommuteMode,
  DietStyle,
  RecyclingHabit,
  ShoppingLevel,
} from "@/types";

/** kg CO2e emitted per passenger-kilometre, by commute mode. */
export const TRANSPORT_FACTORS_KG_PER_KM: Readonly<Record<CommuteMode, number>> =
  {
    walk: 0,
    bike: 0,
    transit: 0.041,
    ev: 0.05,
    car: 0.192,
    // "mixed" assumes a blend of car + transit commuting.
    mixed: 0.12,
  };

/** kg CO2e per week from diet, per person. Based on daily dietary footprints. */
export const DIET_FACTORS_KG_PER_WEEK: Readonly<Record<DietStyle, number>> = {
  vegan: 20,
  vegetarian: 27,
  pescatarian: 29,
  omnivore: 39,
  heavy_meat: 50,
};

/** kg CO2e per kWh of grid electricity (global-ish average). */
export const ELECTRICITY_FACTOR_KG_PER_KWH = 0.4;

/** Average weeks per month, used to convert monthly inputs to weekly. */
export const WEEKS_PER_MONTH = 4.345;

/** kg CO2e per week from general consumer goods, by shopping intensity. */
export const SHOPPING_FACTORS_KG_PER_WEEK: Readonly<
  Record<ShoppingLevel, number>
> = {
  minimal: 8,
  average: 18,
  frequent: 34,
};

/**
 * kg CO2e per week from household waste, by recycling habit.
 * Better recycling habits reduce landfill methane and disposal emissions.
 */
export const WASTE_FACTORS_KG_PER_WEEK: Readonly<
  Record<RecyclingHabit, number>
> = {
  none: 12,
  some: 9,
  most: 6,
  all: 4,
};

/**
 * Reference weekly footprint (kg CO2e) used to derive the eco score.
 * Roughly the per-capita weekly emissions of a high-impact lifestyle.
 */
export const HIGH_IMPACT_WEEKLY_KG = 180;

/**
 * Aspirational weekly footprint (kg CO2e) aligned with a sustainable
 * per-capita target. Reaching this maps to an eco score of 100.
 */
export const SUSTAINABLE_WEEKLY_KG = 40;
