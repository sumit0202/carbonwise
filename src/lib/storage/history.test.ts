import { describe, expect, it } from "vitest";
import {
  MAX_HISTORY_POINTS,
  appendSnapshot,
  todayIso,
} from "@/lib/storage/history";
import { defaultState } from "@/lib/storage/adapter";
import type { PersistedState, UserProfile } from "@/types";

const profile: UserProfile = {
  householdSize: 2,
  diet: "omnivore",
  commuteMode: "car",
  weeklyTravelKm: 100,
  electricityKwhPerMonth: 300,
  shoppingLevel: "average",
  recycling: "some",
  goal: "overall",
};

describe("todayIso", () => {
  it("formats a date as yyyy-mm-dd", () => {
    expect(todayIso(new Date("2026-06-21T10:00:00Z"))).toBe("2026-06-21");
  });
});

describe("appendSnapshot", () => {
  it("returns state unchanged without a profile", () => {
    const state = defaultState();
    expect(appendSnapshot(state, "2026-06-21")).toBe(state);
  });

  it("adds a snapshot for the day", () => {
    const state: PersistedState = { ...defaultState(), profile };
    const next = appendSnapshot(state, "2026-06-21");
    expect(next.history).toHaveLength(1);
    expect(next.history[0]?.date).toBe("2026-06-21");
  });

  it("replaces an existing same-day snapshot", () => {
    let state: PersistedState = { ...defaultState(), profile };
    state = appendSnapshot(state, "2026-06-21");
    state = appendSnapshot(state, "2026-06-21");
    expect(state.history).toHaveLength(1);
  });

  it("caps history to the maximum number of points", () => {
    let state: PersistedState = { ...defaultState(), profile };
    for (let i = 0; i < MAX_HISTORY_POINTS + 5; i += 1) {
      const day = String(i + 1).padStart(2, "0");
      state = appendSnapshot(state, `2026-01-${day}`);
    }
    expect(state.history).toHaveLength(MAX_HISTORY_POINTS);
  });

  it("defaults the date to today", () => {
    const state: PersistedState = { ...defaultState(), profile };
    const next = appendSnapshot(state);
    expect(next.history[0]?.date).toBe(todayIso());
  });
});
