"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { SelectField, TextField } from "@/components/ui/FormControls";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { createId } from "@/lib/utils/id";
import { fieldErrors, manualActivitySchema } from "@/lib/validation/profile";
import type { EmissionCategory, ManualActivity } from "@/types";

const CATEGORY_OPTIONS: ReadonlyArray<{ value: EmissionCategory; label: string }> =
  [
    { value: "transport", label: "Transport" },
    { value: "home", label: "Home Energy" },
    { value: "food", label: "Food" },
    { value: "shopping", label: "Shopping" },
    { value: "waste", label: "Waste" },
  ];

interface AddActivityFormProps {
  onAdd: (activity: ManualActivity) => void;
}

export function AddActivityForm({ onAdd }: AddActivityFormProps) {
  const [category, setCategory] = useState<EmissionCategory>("transport");
  const [label, setLabel] = useState("");
  const [amount, setAmount] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState("");

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const candidate = {
      id: createId(),
      category,
      label,
      weeklyKgCo2e: Number(amount),
    };
    const result = manualActivitySchema.safeParse(candidate);
    if (!result.success) {
      setErrors(fieldErrors(result.error));
      setStatus("Please correct the activity details.");
      return;
    }
    onAdd(result.data);
    setErrors({});
    setLabel("");
    setAmount("");
    setStatus(`Added "${result.data.label}" to ${category}.`);
  }

  return (
    <form onSubmit={handleSubmit} noValidate aria-labelledby="add-activity-heading">
      <h3 id="add-activity-heading">Add an activity manually</h3>
      <div className="grid grid-3">
        <SelectField
          id="activity-category"
          label="Category"
          value={category}
          options={CATEGORY_OPTIONS}
          onChange={(v) => setCategory(v as EmissionCategory)}
        />
        <TextField
          id="activity-label"
          label="Description"
          value={label}
          error={errors.label}
          onChange={setLabel}
          placeholder="e.g. Weekend flight share"
        />
        <TextField
          id="activity-amount"
          label="Weekly kg CO₂e"
          type="number"
          inputMode="decimal"
          min={0}
          value={amount}
          error={errors.weeklyKgCo2e}
          onChange={setAmount}
        />
      </div>
      <Button type="submit" variant="secondary">
        Add activity
      </Button>
      <StatusMessage message={status} />
    </form>
  );
}
