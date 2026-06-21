"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/FormControls";
import { StatusMessage } from "@/components/ui/StatusMessage";
import {
  COMMUTE_OPTIONS,
  DIET_OPTIONS,
  GOAL_OPTIONS,
  RECYCLING_OPTIONS,
  SHOPPING_OPTIONS,
} from "@/lib/options";
import { fieldErrors, profileSchema } from "@/lib/validation/profile";
import { roundCoordinates } from "@/lib/utils/geo";
import type {
  CommuteMode,
  Coordinates,
  DietStyle,
  GoalPreference,
  RecyclingHabit,
  ShoppingLevel,
  UserProfile,
} from "@/types";

interface ProfileFormProps {
  initialProfile: UserProfile;
  onSave: (profile: UserProfile) => void;
}

interface FormState {
  city: string;
  householdSize: string;
  diet: DietStyle;
  commuteMode: CommuteMode;
  weeklyTravelKm: string;
  electricityKwhPerMonth: string;
  shoppingLevel: ShoppingLevel;
  recycling: RecyclingHabit;
  goal: GoalPreference;
  coordinates?: Coordinates;
}

function toFormState(p: UserProfile): FormState {
  return {
    city: p.city ?? "",
    householdSize: String(p.householdSize),
    diet: p.diet,
    commuteMode: p.commuteMode,
    weeklyTravelKm: String(p.weeklyTravelKm),
    electricityKwhPerMonth: String(p.electricityKwhPerMonth),
    shoppingLevel: p.shoppingLevel,
    recycling: p.recycling,
    goal: p.goal,
    coordinates: p.coordinates,
  };
}

export function ProfileForm({ initialProfile, onSave }: ProfileFormProps) {
  const [form, setForm] = useState<FormState>(() => toFormState(initialProfile));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");
  const [locating, setLocating] = useState(false);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function useMyLocation() {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("Location is not available in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = roundCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        update("coordinates", coords);
        setLocating(false);
        setStatus(
          `Approximate location saved (${coords.lat}, ${coords.lng}). Exact coordinates are never stored.`,
        );
      },
      () => {
        setLocating(false);
        setStatus("We couldn't get your location. You can still enter a city.");
      },
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = {
      city: form.city,
      coordinates: form.coordinates,
      householdSize: Number(form.householdSize),
      diet: form.diet,
      commuteMode: form.commuteMode,
      weeklyTravelKm: Number(form.weeklyTravelKm),
      electricityKwhPerMonth: Number(form.electricityKwhPerMonth),
      shoppingLevel: form.shoppingLevel,
      recycling: form.recycling,
      goal: form.goal,
    };
    const result = profileSchema.safeParse(candidate);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      setStatus("Please fix the highlighted fields.");
      return;
    }
    setErrors({});
    setStatus("Profile saved. Your footprint has been updated.");
    onSave(result.data as UserProfile);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="profile-heading">
      <h2 id="profile-heading">Your profile</h2>
      <p className="muted">
        All fields are optional estimates. Nothing is sent to a server — your
        data stays in this browser.
      </p>

      <div className="grid grid-2">
        <div>
          <TextField
            id="city"
            label="City or area (optional)"
            description="Used only for local insights. We never ask for your exact address."
            value={form.city}
            error={errors.city}
            onChange={(v) => update("city", v)}
            placeholder="e.g. Seattle"
          />
          <Button
            variant="secondary"
            onClick={useMyLocation}
            disabled={locating}
            aria-describedby="geo-note"
          >
            {locating ? "Locating…" : "Use my location"}
          </Button>
          <p className="desc" id="geo-note">
            Optional. Coordinates are rounded for privacy before being stored.
          </p>
        </div>

        <TextField
          id="householdSize"
          label="Household size"
          description="Number of people sharing your home."
          type="number"
          inputMode="numeric"
          min={1}
          max={20}
          value={form.householdSize}
          error={errors.householdSize}
          onChange={(v) => update("householdSize", v)}
        />
      </div>

      <div className="grid grid-2">
        <SelectField
          id="diet"
          label="Diet style"
          value={form.diet}
          options={DIET_OPTIONS}
          onChange={(v) => update("diet", v as DietStyle)}
        />
        <SelectField
          id="commuteMode"
          label="Main commute mode"
          value={form.commuteMode}
          options={COMMUTE_OPTIONS}
          onChange={(v) => update("commuteMode", v as CommuteMode)}
        />
      </div>

      <div className="grid grid-2">
        <TextField
          id="weeklyTravelKm"
          label="Approximate weekly travel (km)"
          type="number"
          inputMode="decimal"
          min={0}
          value={form.weeklyTravelKm}
          error={errors.weeklyTravelKm}
          onChange={(v) => update("weeklyTravelKm", v)}
        />
        <TextField
          id="electricityKwhPerMonth"
          label="Monthly electricity use (kWh)"
          description="Check a recent utility bill, or leave the estimate."
          type="number"
          inputMode="decimal"
          min={0}
          value={form.electricityKwhPerMonth}
          error={errors.electricityKwhPerMonth}
          onChange={(v) => update("electricityKwhPerMonth", v)}
        />
      </div>

      <div className="grid grid-2">
        <SelectField
          id="shoppingLevel"
          label="Shopping habits"
          value={form.shoppingLevel}
          options={SHOPPING_OPTIONS}
          onChange={(v) => update("shoppingLevel", v as ShoppingLevel)}
        />
        <SelectField
          id="recycling"
          label="Waste & recycling habits"
          value={form.recycling}
          options={RECYCLING_OPTIONS}
          onChange={(v) => update("recycling", v as RecyclingHabit)}
        />
      </div>

      <SelectField
        id="goal"
        label="Your main goal"
        value={form.goal}
        options={GOAL_OPTIONS}
        onChange={(v) => update("goal", v as GoalPreference)}
      />

      <Button type="submit">Calculate my footprint</Button>
      <StatusMessage message={status} />
    </form>
  );
}
