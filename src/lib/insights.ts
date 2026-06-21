/** Pure helpers for the dashboard "What changed?" insight and trend geometry. */

import { round1 } from "@/lib/emissions/calculator";
import type { TimezoneResult } from "@/lib/google/schemas";
import type { HistoryPoint } from "@/types";

/** Formats the current local time for a timezone using its UTC offsets. */
export function localTimeLabel(
  tz: TimezoneResult,
  now: Date = new Date(),
): string {
  const offsetMs = (tz.rawOffsetSec + tz.dstOffsetSec) * 1000;
  const local = new Date(now.getTime() + offsetMs);
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm} (${tz.timeZoneName})`;
}

export interface ChangeInsight {
  hasComparison: boolean;
  deltaKg: number;
  direction: "down" | "up" | "same";
  message: string;
}

/** Compares the two most recent history snapshots into a friendly insight. */
export function computeChange(history: readonly HistoryPoint[]): ChangeInsight {
  if (history.length < 2) {
    return {
      hasComparison: false,
      deltaKg: 0,
      direction: "same",
      message:
        "Keep updating your profile and actions to build a weekly trend here.",
    };
  }
  const previous = history[history.length - 2]!;
  const current = history[history.length - 1]!;
  const deltaKg = round1(current.weeklyKgCo2e - previous.weeklyKgCo2e);

  if (deltaKg < 0) {
    return {
      hasComparison: true,
      deltaKg,
      direction: "down",
      message: `Your weekly footprint fell by ${Math.abs(deltaKg)} kg CO₂e since your last update. Great progress!`,
    };
  }
  if (deltaKg > 0) {
    return {
      hasComparison: true,
      deltaKg,
      direction: "up",
      message: `Your weekly footprint rose by ${deltaKg} kg CO₂e since your last update. Try one EcoGuide action to reverse it.`,
    };
  }
  return {
    hasComparison: true,
    deltaKg: 0,
    direction: "same",
    message: "Your weekly footprint is unchanged since your last update.",
  };
}

export interface ChartPoint {
  x: number;
  y: number;
}

/**
 * Maps history points to SVG coordinates within the given width/height.
 * Returns an empty array for empty history so the chart can show a fallback.
 */
export function buildChartPoints(
  history: readonly HistoryPoint[],
  width: number,
  height: number,
): ChartPoint[] {
  if (history.length === 0) return [];
  const values = history.map((h) => h.weeklyKgCo2e);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = history.length > 1 ? width / (history.length - 1) : 0;

  return history.map((point, index) => {
    const x = history.length > 1 ? index * step : width / 2;
    const y = height - ((point.weeklyKgCo2e - min) / range) * height;
    return { x: round1(x), y: round1(y) };
  });
}
