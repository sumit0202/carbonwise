import { beforeEach, describe, expect, it } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useCarbonState } from "@/hooks/useCarbonState";
import { loadState } from "@/lib/storage/adapter";
import type { UserProfile } from "@/types";

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

beforeEach(() => localStorage.clear());

describe("useCarbonState", () => {
  it("hydrates from storage on mount", () => {
    const { result } = renderHook(() => useCarbonState());
    expect(result.current.hydrated).toBe(true);
    expect(result.current.state.profile).toBeUndefined();
  });

  it("saves a profile and records a history snapshot", () => {
    const { result } = renderHook(() => useCarbonState());
    act(() => result.current.setProfile(profile));
    expect(result.current.state.profile).toEqual(profile);
    expect(result.current.state.history).toHaveLength(1);
    expect(loadState().profile).toEqual(profile);
  });

  it("adds and removes activities", () => {
    const { result } = renderHook(() => useCarbonState());
    act(() => result.current.setProfile(profile));
    act(() =>
      result.current.addActivity({
        id: "a1",
        category: "food",
        label: "Flight",
        weeklyKgCo2e: 10,
      }),
    );
    expect(result.current.state.activities).toHaveLength(1);
    act(() => result.current.removeActivity("a1"));
    expect(result.current.state.activities).toHaveLength(0);
  });

  it("creates then updates an action status, leaving others intact", () => {
    const { result } = renderHook(() => useCarbonState());
    act(() => result.current.setActionStatus("rec1", "planned"));
    act(() => result.current.setActionStatus("rec2", "planned"));
    expect(result.current.state.actions).toHaveLength(2);
    act(() => result.current.setActionStatus("rec1", "done"));
    const rec1 = result.current.state.actions.find((a) => a.id === "rec1");
    const rec2 = result.current.state.actions.find((a) => a.id === "rec2");
    expect(rec1?.status).toBe("done");
    expect(rec2?.status).toBe("planned");
  });

  it("exports the current state as JSON", () => {
    const { result } = renderHook(() => useCarbonState());
    act(() => result.current.setProfile(profile));
    expect(result.current.exportData()).toContain("omnivore");
  });

  it("clears all data", () => {
    const { result } = renderHook(() => useCarbonState());
    act(() => result.current.setProfile(profile));
    act(() => result.current.clearAll());
    expect(result.current.state.profile).toBeUndefined();
    expect(loadState().profile).toBeUndefined();
  });
});
