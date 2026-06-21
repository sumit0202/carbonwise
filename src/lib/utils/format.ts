/** Small, pure formatting and class-name helpers used across the UI. */

import type { EmissionCategory } from "@/types";

/** Joins truthy class names; falsy values are ignored. */
export function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Formats a kg CO2e value with a unit, e.g. "12.5 kg". */
export function formatKg(value: number): string {
  return `${value.toLocaleString("en-US", {
    maximumFractionDigits: 1,
  })} kg`;
}

const CATEGORY_LABELS: Record<EmissionCategory, string> = {
  transport: "Transport",
  home: "Home Energy",
  food: "Food",
  shopping: "Shopping",
  waste: "Waste",
};

export function categoryLabel(category: EmissionCategory): string {
  return CATEGORY_LABELS[category];
}

/** Returns the percentage (0–100) one value represents of a total. */
export function percentOf(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.round((part / total) * 100);
}
