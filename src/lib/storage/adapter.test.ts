import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  STORAGE_KEY,
  clearState,
  defaultState,
  exportState,
  getBackend,
  loadState,
  normalizeState,
  saveState,
  type StorageBackend,
} from "@/lib/storage/adapter";
import type { PersistedState } from "@/types";

function memoryBackend(): StorageBackend & { store: Map<string, string> } {
  const store = new Map<string, string>();
  return {
    store,
    getItem: (k) => store.get(k) ?? null,
    setItem: (k, v) => void store.set(k, v),
    removeItem: (k) => void store.delete(k),
  };
}

describe("defaultState", () => {
  it("returns an empty versioned state", () => {
    const state = defaultState();
    expect(state.version).toBe(1);
    expect(state.activities).toEqual([]);
  });
});

describe("normalizeState", () => {
  it("returns default for non-objects", () => {
    expect(normalizeState(null).activities).toEqual([]);
    expect(normalizeState(42).actions).toEqual([]);
  });

  it("coerces missing arrays to empty arrays", () => {
    const state = normalizeState({ profile: { householdSize: 1 } });
    expect(state.activities).toEqual([]);
    expect(state.profile).toBeDefined();
  });

  it("ignores a non-object profile", () => {
    expect(normalizeState({ profile: "x" }).profile).toBeUndefined();
  });

  it("preserves provided arrays", () => {
    const state = normalizeState({
      activities: [{ id: "1" }],
      actions: [{ id: "a" }],
      history: [{ date: "2026-01-01" }],
    });
    expect(state.activities).toHaveLength(1);
    expect(state.actions).toHaveLength(1);
    expect(state.history).toHaveLength(1);
  });
});

describe("backend persistence", () => {
  it("round-trips state through a backend", () => {
    const backend = memoryBackend();
    const state: PersistedState = {
      ...defaultState(),
      activities: [{ id: "1", category: "food", label: "x", weeklyKgCo2e: 2 }],
    };
    saveState(state, backend);
    expect(loadState(backend).activities).toHaveLength(1);
  });

  it("returns default when no data is stored", () => {
    expect(loadState(memoryBackend()).activities).toEqual([]);
  });

  it("returns default for corrupt JSON", () => {
    const backend = memoryBackend();
    backend.store.set(STORAGE_KEY, "{not json");
    expect(loadState(backend)).toEqual(defaultState());
  });

  it("exports pretty JSON", () => {
    const backend = memoryBackend();
    saveState(defaultState(), backend);
    expect(exportState(backend)).toContain("\n");
  });

  it("clears stored data", () => {
    const backend = memoryBackend();
    saveState(defaultState(), backend);
    clearState(backend);
    expect(backend.store.size).toBe(0);
  });

  it("is a no-op when the backend is null", () => {
    expect(() => saveState(defaultState(), null)).not.toThrow();
    expect(() => clearState(null)).not.toThrow();
    expect(loadState(null)).toEqual(defaultState());
  });
});

describe("getBackend", () => {
  it("returns localStorage when available", () => {
    expect(getBackend()).toBe(globalThis.localStorage);
  });

  it("returns null when localStorage is undefined", () => {
    const spy = vi
      .spyOn(globalThis, "localStorage", "get")
      .mockReturnValue(undefined as unknown as Storage);
    expect(getBackend()).toBeNull();
    spy.mockRestore();
  });

  it("returns null when localStorage access throws", () => {
    const spy = vi
      .spyOn(globalThis, "localStorage", "get")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    expect(getBackend()).toBeNull();
    spy.mockRestore();
  });

  it("uses the default backend when none is passed", () => {
    localStorage.clear();
    saveState(defaultState());
    expect(loadState().version).toBe(1);
  });
});

beforeEach(() => localStorage.clear());
