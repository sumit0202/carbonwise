"use client";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { formatKg } from "@/lib/utils/format";
import type { ActionStatus, Recommendation } from "@/types";

const STATUS_LABEL: Record<ActionStatus, string> = {
  suggested: "Suggested",
  planned: "Planned",
  done: "Done",
};

interface RecommendationCardProps {
  recommendation: Recommendation;
  status: ActionStatus;
  onSetStatus: (id: string, status: ActionStatus) => void;
}

export function RecommendationCard({
  recommendation: r,
  status,
  onSetStatus,
}: RecommendationCardProps) {
  return (
    <Card as="li">
      <h3>{r.title}</h3>
      <p>{r.explanation}</p>
      <dl className="grid grid-3">
        <div>
          <dt className="muted">Estimated savings</dt>
          <dd>
            <strong>{formatKg(r.estimatedWeeklySavingsKg)}</strong> / week
          </dd>
        </div>
        <div>
          <dt className="muted">Impact</dt>
          <dd>{r.impact}</dd>
        </div>
        <div>
          <dt className="muted">Difficulty</dt>
          <dd>{r.difficulty}</dd>
        </div>
        <div>
          <dt className="muted">Cost</dt>
          <dd>{r.cost}</dd>
        </div>
        <div>
          <dt className="muted">Time</dt>
          <dd>{r.timeRequired}</dd>
        </div>
        <div>
          <dt className="muted">Status</dt>
          <dd>{STATUS_LABEL[status]}</dd>
        </div>
      </dl>
      <p className="muted">
        <span aria-hidden="true">★ </span>
        Why this is personal: {r.personalizedReason}
      </p>
      <div className="tag-row">
        <Button
          variant="secondary"
          aria-pressed={status === "planned"}
          onClick={() => onSetStatus(r.id, "planned")}
        >
          Plan this
        </Button>
        <Button
          aria-pressed={status === "done"}
          onClick={() =>
            onSetStatus(r.id, status === "done" ? "suggested" : "done")
          }
        >
          {status === "done" ? "Mark as not done" : "Mark done"}
        </Button>
      </div>
    </Card>
  );
}
