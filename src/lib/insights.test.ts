import { describe, expect, it } from "vitest";
import {
  buildChartPoints,
  computeChange,
  localTimeLabel,
} from "@/lib/insights";
import type { HistoryPoint } from "@/types";

function point(date: string, weekly: number): HistoryPoint {
  return { date, weeklyKgCo2e: weekly, ecoScore: 50 };
}

describe("computeChange", () => {
  it("reports no comparison with fewer than two points", () => {
    expect(computeChange([]).hasComparison).toBe(false);
    expect(computeChange([point("2026-01-01", 50)]).hasComparison).toBe(false);
  });

  it("reports a decrease", () => {
    const result = computeChange([
      point("2026-01-01", 60),
      point("2026-01-02", 50),
    ]);
    expect(result.direction).toBe("down");
    expect(result.deltaKg).toBe(-10);
  });

  it("reports an increase", () => {
    const result = computeChange([
      point("2026-01-01", 50),
      point("2026-01-02", 60),
    ]);
    expect(result.direction).toBe("up");
  });

  it("reports no change", () => {
    const result = computeChange([
      point("2026-01-01", 50),
      point("2026-01-02", 50),
    ]);
    expect(result.direction).toBe("same");
  });
});

describe("buildChartPoints", () => {
  it("returns an empty array for empty history", () => {
    expect(buildChartPoints([], 100, 50)).toEqual([]);
  });

  it("centers a single point", () => {
    const points = buildChartPoints([point("2026-01-01", 50)], 100, 50);
    expect(points[0]?.x).toBe(50);
  });

  it("spreads multiple points across the width", () => {
    const points = buildChartPoints(
      [point("2026-01-01", 40), point("2026-01-02", 60)],
      100,
      50,
    );
    expect(points[0]?.x).toBe(0);
    expect(points[1]?.x).toBe(100);
  });

  it("handles a flat trend without dividing by zero", () => {
    const points = buildChartPoints(
      [point("2026-01-01", 50), point("2026-01-02", 50)],
      100,
      50,
    );
    expect(points).toHaveLength(2);
    expect(Number.isFinite(points[0]?.y)).toBe(true);
  });
});

describe("localTimeLabel", () => {
  it("applies the timezone offset", () => {
    const label = localTimeLabel(
      {
        timeZoneId: "America/Los_Angeles",
        timeZoneName: "PDT",
        rawOffsetSec: -28800,
        dstOffsetSec: 3600,
      },
      new Date("2026-06-21T20:00:00Z"),
    );
    expect(label).toBe("13:00 (PDT)");
  });
});
