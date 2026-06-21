"use client";

import { AddActivityForm } from "@/components/calculator/AddActivityForm";
import { CategoryBreakdown } from "@/components/calculator/CategoryBreakdown";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { categoryLabel, formatKg } from "@/lib/utils/format";
import type { FootprintResult, ManualActivity } from "@/types";

const CONFIDENCE_COPY: Record<FootprintResult["confidence"], string> = {
  low: "Low — add more detail to your profile to improve this estimate.",
  medium: "Medium — based on the profile details you provided.",
  high: "High — based on detailed travel, energy and activity inputs.",
};

interface CalculatorViewProps {
  footprint: FootprintResult;
  activities: readonly ManualActivity[];
  onAddActivity: (activity: ManualActivity) => void;
  onRemoveActivity: (id: string) => void;
}

export function CalculatorView({
  footprint,
  activities,
  onAddActivity,
  onRemoveActivity,
}: CalculatorViewProps) {
  return (
    <section aria-labelledby="calc-heading">
      <h2 id="calc-heading">Your carbon footprint</h2>

      <div className="grid grid-2" aria-live="polite">
        <Card>
          <p className="muted">Estimated weekly emissions</p>
          <p className="stat">{formatKg(footprint.weeklyKgCo2e)}</p>
          <p className="muted">CO₂e per week</p>
        </Card>
        <Card>
          <p className="muted">Estimated monthly emissions</p>
          <p className="stat">{formatKg(footprint.monthlyKgCo2e)}</p>
          <p className="muted">CO₂e per month</p>
        </Card>
      </div>

      <Card>
        <h3>Category breakdown</h3>
        <CategoryBreakdown
          breakdown={footprint.byCategory}
          total={footprint.weeklyKgCo2e}
          topContributor={footprint.topContributor}
        />
        <p>
          <strong>Top contributor:</strong>{" "}
          {categoryLabel(footprint.topContributor)}
        </p>
        <p>
          <strong>Confidence:</strong> {CONFIDENCE_COPY[footprint.confidence]}
        </p>
      </Card>

      <Card>
        <AddActivityForm onAdd={onAddActivity} />
        {activities.length > 0 ? (
          <ul className="list-reset grid" aria-label="Manually added activities">
            {activities.map((activity) => (
              <li
                key={activity.id}
                className="tag-row"
                style={{ justifyContent: "space-between" }}
              >
                <span>
                  {categoryLabel(activity.category)}: {activity.label} —{" "}
                  {formatKg(activity.weeklyKgCo2e)}
                </span>
                <Button
                  variant="danger"
                  onClick={() => onRemoveActivity(activity.id)}
                  aria-label={`Remove ${activity.label}`}
                >
                  Remove
                </Button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">No manual activities added yet.</p>
        )}
      </Card>
    </section>
  );
}
