import { Meter } from "@/components/ui/Meter";
import { categoryLabel, formatKg, percentOf } from "@/lib/utils/format";
import type { CategoryBreakdown as Breakdown } from "@/types";

interface CategoryBreakdownProps {
  breakdown: readonly Breakdown[];
  total: number;
  topContributor: string;
}

export function CategoryBreakdown({
  breakdown,
  total,
  topContributor,
}: CategoryBreakdownProps) {
  const max = breakdown.reduce((m, c) => Math.max(m, c.weeklyKgCo2e), 0);
  return (
    <ul className="list-reset grid" aria-label="Weekly emissions by category">
      {breakdown.map((item) => {
        const isTop = item.category === topContributor;
        return (
          <li key={item.category}>
            <div className="tag-row" style={{ justifyContent: "space-between" }}>
              <span>
                <strong>{categoryLabel(item.category)}</strong>
                {isTop ? (
                  <span className="badge badge--demo" style={{ marginLeft: 8 }}>
                    Top contributor
                  </span>
                ) : null}
              </span>
              <span>
                {formatKg(item.weeklyKgCo2e)}{" "}
                <span className="muted">({percentOf(item.weeklyKgCo2e, total)}%)</span>
              </span>
            </div>
            <Meter
              label={`${categoryLabel(item.category)} weekly emissions`}
              value={item.weeklyKgCo2e}
              max={max}
              valueText={formatKg(item.weeklyKgCo2e)}
            />
          </li>
        );
      })}
    </ul>
  );
}
