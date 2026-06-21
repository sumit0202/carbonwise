import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { EcoScore, scoreLabel } from "@/components/dashboard/EcoScore";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { calculateFootprint } from "@/lib/emissions/calculator";
import type { HistoryPoint, Recommendation, UserProfile } from "@/types";

const downloadJson = vi.hoisted(() => vi.fn());
vi.mock("@/lib/utils/download", () => ({ downloadJson }));

const profile: UserProfile = {
  householdSize: 2,
  diet: "omnivore",
  commuteMode: "car",
  weeklyTravelKm: 100,
  electricityKwhPerMonth: 300,
  shoppingLevel: "average",
  recycling: "some",
  goal: "overall",
};
const footprint = calculateFootprint(profile);

function history(...weeks: number[]): HistoryPoint[] {
  return weeks.map((w, i) => ({
    date: `2026-01-0${i + 1}`,
    weeklyKgCo2e: w,
    ecoScore: 50,
  }));
}

describe("scoreLabel", () => {
  it("labels each band", () => {
    expect(scoreLabel(85)).toBe("Excellent");
    expect(scoreLabel(65)).toBe("Good");
    expect(scoreLabel(45)).toBe("Fair");
    expect(scoreLabel(20)).toBe("Needs work");
  });
});

describe("EcoScore", () => {
  it("renders the score and meter", () => {
    render(<EcoScore score={72} />);
    expect(screen.getByText("72")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });
});

describe("TrendChart", () => {
  it("shows a fallback with too little history", () => {
    render(<TrendChart history={history(50)} />);
    expect(screen.getByText(/not enough history/i)).toBeInTheDocument();
  });

  it("renders an SVG trend with enough history", () => {
    render(<TrendChart history={history(60, 50, 40)} />);
    expect(screen.getByRole("img", { name: /trend/i })).toBeInTheDocument();
  });
});

const recommendations: Recommendation[] = [
  {
    id: "rec1",
    category: "transport",
    title: "Take the bus",
    explanation: "",
    estimatedWeeklySavingsKg: 5,
    difficulty: "easy",
    cost: "free",
    timeRequired: "x",
    impact: "medium",
    personalizedReason: "",
  },
];

describe("DashboardView", () => {
  function renderDashboard(overrides?: {
    hist?: HistoryPoint[];
    actions?: { id: string; status: "done" | "planned" | "suggested" }[];
  }) {
    const onClearAll = vi.fn();
    render(
      <DashboardView
        footprint={footprint}
        history={overrides?.hist ?? history(60, 50)}
        actions={overrides?.actions ?? []}
        recommendations={recommendations}
        onExport={() => '{"a":1}'}
        onClearAll={onClearAll}
      />,
    );
    return { onClearAll };
  }

  it("renders score, categories and a decreasing insight", () => {
    renderDashboard();
    expect(screen.getByText(/tracking dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/great progress/i)).toBeInTheDocument();
  });

  it("renders an increasing insight", () => {
    renderDashboard({ hist: history(40, 60) });
    expect(screen.getByText(/rose by/i)).toBeInTheDocument();
  });

  it("renders an unchanged insight", () => {
    renderDashboard({ hist: history(50, 50) });
    expect(screen.getByText(/unchanged/i)).toBeInTheDocument();
  });

  it("lists completed actions, mapping ids to titles", () => {
    renderDashboard({
      actions: [
        { id: "rec1", status: "done" },
        { id: "unknown", status: "done" },
      ],
    });
    expect(screen.getByText("Take the bus")).toBeInTheDocument();
    expect(screen.getByText("unknown")).toBeInTheDocument();
  });

  it("shows an empty actions state", () => {
    renderDashboard();
    expect(screen.getByText(/no actions completed/i)).toBeInTheDocument();
  });

  it("exports data as JSON", async () => {
    renderDashboard();
    await userEvent.click(screen.getByRole("button", { name: /export data/i }));
    expect(downloadJson).toHaveBeenCalledWith(
      "carbonwise-data.json",
      '{"a":1}',
    );
    expect(screen.getByRole("status")).toHaveTextContent(/exported/i);
  });

  it("confirms before deleting, and can cancel", async () => {
    const { onClearAll } = renderDashboard();
    await userEvent.click(
      screen.getByRole("button", { name: /delete all local data/i }),
    );
    await userEvent.click(screen.getByRole("button", { name: /cancel/i }));
    expect(onClearAll).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: /delete all local data/i }),
    );
    await userEvent.click(
      screen.getByRole("button", { name: /confirm delete all/i }),
    );
    expect(onClearAll).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent(/deleted/i);
  });
});
