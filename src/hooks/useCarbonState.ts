"use client";

import { useCallback, useEffect, useState } from "react";
import {
  clearState,
  defaultState,
  exportState,
  loadState,
  saveState,
} from "@/lib/storage/adapter";
import { appendSnapshot } from "@/lib/storage/history";
import type {
  ActionStatus,
  ManualActivity,
  PersistedState,
  UserProfile,
} from "@/types";

export interface CarbonState {
  state: PersistedState;
  hydrated: boolean;
  setProfile: (profile: UserProfile) => void;
  addActivity: (activity: ManualActivity) => void;
  removeActivity: (id: string) => void;
  setActionStatus: (id: string, status: ActionStatus) => void;
  exportData: () => string;
  clearAll: () => void;
}

export function useCarbonState(): CarbonState {
  const [state, setState] = useState<PersistedState>(defaultState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(loadState());
    setHydrated(true);
  }, []);

  const setProfile = useCallback(
    (profile: UserProfile) => {
      setState((prev) => {
        const next = { ...prev, profile };
        const snapshotted = appendSnapshot(next);
        saveState(snapshotted);
        return snapshotted;
      });
    },
    [],
  );

  const addActivity = useCallback(
    (activity: ManualActivity) => {
      setState((prev) => {
        const next = { ...prev, activities: [...prev.activities, activity] };
        const snapshotted = appendSnapshot(next);
        saveState(snapshotted);
        return snapshotted;
      });
    },
    [],
  );

  const removeActivity = useCallback((id: string) => {
    setState((prev) => {
      const next = {
        ...prev,
        activities: prev.activities.filter((a) => a.id !== id),
      };
      const snapshotted = appendSnapshot(next);
      saveState(snapshotted);
      return snapshotted;
    });
  }, []);

  const setActionStatus = useCallback((id: string, status: ActionStatus) => {
    setState((prev) => {
      const exists = prev.actions.some((a) => a.id === id);
      const actions = exists
        ? prev.actions.map((a) => (a.id === id ? { ...a, status } : a))
        : [...prev.actions, { id, status }];
      const next = { ...prev, actions };
      saveState(next);
      return next;
    });
  }, []);

  const exportData = useCallback(() => exportState(), []);

  const clearAll = useCallback(() => {
    clearState();
    setState(defaultState());
  }, []);

  return {
    state,
    hydrated,
    setProfile,
    addActivity,
    removeActivity,
    setActionStatus,
    exportData,
    clearAll,
  };
}
