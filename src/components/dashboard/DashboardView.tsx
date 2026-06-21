"use client";

import { useState } from "react";
import { EcoScore } from "@/components/dashboard/EcoScore";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StatusMessage } from "@/components/ui/StatusMessage";
import { computeChange } from "@/lib/insights";
import { categoryLabel, formatKg } from "@/lib/utils/format";
import { downloadJson } from "@/lib/utils/download";
import type {
  FootprintResult,
  HistoryPoint,
  Recommendation,
  TrackedAction,
} from "@/types";

interface DashboardViewProps {
  footprint: FootprintResult;
  history: readonly HistoryPoint[];
  actions: readonly TrackedAction[];
  recommendations: readonly Recommendation[];
  onExport: () => string;
  onClearAll: () => void;
}

export function DashboardView({
  footprint,
  history,
  actions,
  recommendations,
  onExport,
  onClearAll,
}: DashboardViewProps) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [status, setStatus] = useState("");

  const change = computeChange(history);
  const doneActions = actions.filter((a) => a.status === "done");
  const plannedActions = actions.filter((a) => a.status === "planned");
  const titleFor = (id: string) =>
    recommendations.find((r) => r.id === id)?.title ?? id;

  function handleExport() {
    downloadJson("carbonwise-data.json", onExport());
    setStatus("Your data was exported as carbonwise-data.json.");
  }

  function handleDelete() {
    onClearAll();
    setConfirmingDelete(false);
    setStatus("All local data has been deleted from this browser.");
  }

  return (
    <section aria-labelledby="dashboard-heading">
      <h2 id="dashboard-heading">Tracking dashboard</h2>

      <div className="grid grid-3">
        <Card>
          <EcoScore score={footprint.ecoScore} />
        </Card>
        <Card>
          <p className="muted">Weekly footprint</p>
          <p className="stat">{formatKg(footprint.weeklyKgCo2e)}</p>
        </Card>
        <Card>
          <p className="muted">Monthly footprint</p>
          <p className="stat">{formatKg(footprint.monthlyKgCo2e)}</p>
        </Card>
      </div>

      <Card>
        <h3>Emissions by category</h3>
        <ul className="list-reset grid grid-3" aria-label="Category footprint cards">
          {footprint.byCategory.map((c) => (
            <li key={c.category}>
              <Card>
                <p className="muted">{categoryLabel(c.category)}</p>
                <p className="stat" style={{ fontSize: "1.5rem" }}>
                  {formatKg(c.weeklyKgCo2e)}
                </p>
                <p className="muted">per week</p>
              </Card>
            </li>
          ))}
        </ul>
      </Card>

      <div className="grid grid-2">
        <Card>
          <h3>Weekly trend</h3>
          <TrendChart history={history} />
        </Card>
        <Card>
          <h3>What changed?</h3>
          <p>
            <span aria-hidden="true">
              {change.direction === "down"
                ? "▼ "
                : change.direction === "up"
                  ? "▲ "
                  : "■ "}
            </span>
            {change.message}
          </p>
        </Card>
      </div>

      <Card>
        <h3>Goals &amp; completed actions</h3>
        <p>
          {doneActions.length} completed, {plannedActions.length} planned.
        </p>
        {doneActions.length > 0 ? (
          <ul aria-label="Completed actions">
            {doneActions.map((a) => (
              <li key={a.id}>
                <span aria-hidden="true">✓ </span>
                {titleFor(a.id)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">
            No actions completed yet. Visit EcoGuide to get started.
          </p>
        )}
      </Card>

      <Card>
        <h3>Your data</h3>
        <p className="muted">
          Everything is stored only in this browser. Export a copy or delete it
          all at any time.
        </p>
        <div className="tag-row">
          <Button variant="secondary" onClick={handleExport}>
            Export data as JSON
          </Button>
          {confirmingDelete ? (
            <>
              <Button variant="danger" onClick={handleDelete}>
                Confirm delete all
              </Button>
              <Button
                variant="secondary"
                onClick={() => setConfirmingDelete(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button variant="danger" onClick={() => setConfirmingDelete(true)}>
              Delete all local data
            </Button>
          )}
        </div>
        <StatusMessage message={status} />
      </Card>
    </section>
  );
}
