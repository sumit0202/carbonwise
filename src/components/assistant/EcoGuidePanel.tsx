"use client";

import { RecommendationCard } from "@/components/assistant/RecommendationCard";
import { Card } from "@/components/ui/Card";
import { totalPotentialSavings } from "@/lib/recommendations/ecoGuide";
import { formatKg } from "@/lib/utils/format";
import type {
  ActionStatus,
  EnvironmentContext,
  Recommendation,
  TrackedAction,
} from "@/types";

interface EcoGuidePanelProps {
  recommendations: readonly Recommendation[];
  actions: readonly TrackedAction[];
  environment?: EnvironmentContext;
  onSetStatus: (id: string, status: ActionStatus) => void;
}

function statusFor(
  actions: readonly TrackedAction[],
  id: string,
): ActionStatus {
  return actions.find((a) => a.id === id)?.status ?? "suggested";
}

export function EcoGuidePanel({
  recommendations,
  actions,
  environment,
  onSetStatus,
}: EcoGuidePanelProps) {
  const potential = totalPotentialSavings(recommendations);
  const hasEnvironment =
    environment !== undefined &&
    (environment.airQualityIndex !== undefined ||
      environment.pollenLevel !== undefined ||
      environment.solarPotential !== undefined);

  return (
    <section aria-labelledby="ecoguide-heading">
      <h2 id="ecoguide-heading">EcoGuide — your personalized assistant</h2>
      <p>
        EcoGuide reviews your profile, footprint and local environment to suggest
        the highest-impact actions for you.
      </p>

      {recommendations.length === 0 ? (
        <Card>
          <p>
            Great work — EcoGuide has no high-impact suggestions right now. Your
            profile already reflects low-carbon choices.
          </p>
        </Card>
      ) : (
        <>
          <Card>
            <p>
              <strong>Total potential savings:</strong> {formatKg(potential)} per
              week if you adopt every suggestion below.
            </p>
            {hasEnvironment ? (
              <p className="muted">
                Suggestions also factor in local environmental data (air quality,
                pollen and solar potential).
              </p>
            ) : null}
          </Card>
          <ul className="list-reset grid">
            {recommendations.map((r) => (
              <RecommendationCard
                key={r.id}
                recommendation={r}
                status={statusFor(actions, r.id)}
                onSetStatus={onSetStatus}
              />
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
