import { buildChartPoints } from "@/lib/insights";
import { formatKg } from "@/lib/utils/format";
import type { HistoryPoint } from "@/types";

const WIDTH = 320;
const HEIGHT = 120;

interface TrendChartProps {
  history: readonly HistoryPoint[];
}

/**
 * Lightweight SVG trend chart — no charting library. The data is also exposed
 * as a visually-hidden list so screen-reader users get the same information.
 */
export function TrendChart({ history }: TrendChartProps) {
  const points = buildChartPoints(history, WIDTH, HEIGHT);

  if (points.length < 2) {
    return (
      <p className="muted">
        Not enough history yet to draw a trend. Update your profile over several
        days to see your progress.
      </p>
    );
  }

  const path = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <figure style={{ margin: 0 }}>
      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        width="100%"
        height={HEIGHT}
        role="img"
        aria-label="Trend of your weekly carbon footprint over time"
        preserveAspectRatio="none"
      >
        <polyline
          fill="none"
          stroke="var(--primary)"
          strokeWidth="3"
          points={path}
        />
      </svg>
      <figcaption className="visually-hidden">
        <ul>
          {history.map((h) => (
            <li key={h.date}>
              {h.date}: {formatKg(h.weeklyKgCo2e)} per week
            </li>
          ))}
        </ul>
      </figcaption>
    </figure>
  );
}
