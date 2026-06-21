import { Meter } from "@/components/ui/Meter";

interface EcoScoreProps {
  score: number;
}

export function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Needs work";
}

export function EcoScore({ score }: EcoScoreProps) {
  return (
    <div>
      <p className="muted">Eco score</p>
      <p className="stat">
        {score}
        <span className="muted" style={{ fontSize: "1rem" }}>
          {" "}
          / 100
        </span>
      </p>
      <p>
        <strong>{scoreLabel(score)}</strong>
      </p>
      <Meter
        label="Eco score out of 100"
        value={score}
        max={100}
        valueText={`${score} out of 100 — ${scoreLabel(score)}`}
      />
    </div>
  );
}
