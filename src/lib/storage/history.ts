/**
 * Pure helpers for maintaining the footprint history trend.
 * Kept separate from React so they are deterministic and easy to test.
 */

import { calculateFootprint } from "@/lib/emissions/calculator";
import type { PersistedState } from "@/types";

export const MAX_HISTORY_POINTS = 30;

export function todayIso(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/**
 * Records a snapshot of the current footprint for the given day. If a snapshot
 * already exists for that day it is replaced, so multiple edits per day collapse
 * into one trend point. History is capped to the most recent entries.
 */
export function appendSnapshot(
  state: PersistedState,
  date: string = todayIso(),
): PersistedState {
  if (!state.profile) return state;
  const footprint = calculateFootprint(state.profile, state.activities);
  const point = {
    date,
    weeklyKgCo2e: footprint.weeklyKgCo2e,
    ecoScore: footprint.ecoScore,
  };
  const withoutToday = state.history.filter((h) => h.date !== date);
  const history = [...withoutToday, point].slice(-MAX_HISTORY_POINTS);
  return { ...state, history };
}
