/**
 * Typed, browser-local storage adapter.
 *
 * All personal footprint data stays on the user's device — there is no server
 * database. The adapter is defensive: corrupt or partial data never throws, it
 * falls back to a clean default state. A storage backend can be injected, which
 * makes the adapter fully testable without a real browser.
 */

import type {
  HistoryPoint,
  ManualActivity,
  PersistedState,
  TrackedAction,
  UserProfile,
} from "@/types";

export const STORAGE_KEY = "carbonwise:v1";
export const STATE_VERSION = 1;

export interface StorageBackend {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export function defaultState(): PersistedState {
  return { version: STATE_VERSION, activities: [], actions: [], history: [] };
}

/** Resolves the active backend, or null during SSR / when unavailable. */
export function getBackend(): StorageBackend | null {
  try {
    // Reading localStorage can throw (disabled cookies) or be undefined (SSR).
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

/** Narrows unknown parsed JSON into a safe PersistedState. */
export function normalizeState(value: unknown): PersistedState {
  if (!isRecord(value)) return defaultState();
  const activities = Array.isArray(value.activities)
    ? (value.activities as ManualActivity[])
    : [];
  const actions = Array.isArray(value.actions)
    ? (value.actions as TrackedAction[])
    : [];
  const history = Array.isArray(value.history)
    ? (value.history as HistoryPoint[])
    : [];
  const profile = isRecord(value.profile)
    ? (value.profile as unknown as UserProfile)
    : undefined;
  return { version: STATE_VERSION, profile, activities, actions, history };
}

export function loadState(backend: StorageBackend | null = getBackend()): PersistedState {
  if (!backend) return defaultState();
  const raw = backend.getItem(STORAGE_KEY);
  if (!raw) return defaultState();
  try {
    return normalizeState(JSON.parse(raw));
  } catch {
    return defaultState();
  }
}

export function saveState(
  state: PersistedState,
  backend: StorageBackend | null = getBackend(),
): void {
  if (!backend) return;
  backend.setItem(STORAGE_KEY, JSON.stringify(state));
}

/** Returns a pretty-printed JSON export of all stored data. */
export function exportState(
  backend: StorageBackend | null = getBackend(),
): string {
  return JSON.stringify(loadState(backend), null, 2);
}

export function clearState(
  backend: StorageBackend | null = getBackend(),
): void {
  if (!backend) return;
  backend.removeItem(STORAGE_KEY);
}
