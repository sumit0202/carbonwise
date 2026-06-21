import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecommendationCard } from "@/components/assistant/RecommendationCard";
import { EcoGuidePanel } from "@/components/assistant/EcoGuidePanel";
import type { Recommendation } from "@/types";

const rec: Recommendation = {
  id: "r1",
  category: "transport",
  title: "Take the bus",
  explanation: "Buses are efficient.",
  estimatedWeeklySavingsKg: 12,
  difficulty: "medium",
  cost: "low",
  timeRequired: "10 min",
  impact: "high",
  personalizedReason: "You drive a lot.",
};

describe("RecommendationCard", () => {
  it("renders details and toggles planned/done", async () => {
    const onSetStatus = vi.fn();
    render(
      <ul>
        <RecommendationCard
          recommendation={rec}
          status="suggested"
          onSetStatus={onSetStatus}
        />
      </ul>,
    );
    expect(screen.getByText("Take the bus")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /plan this/i }));
    expect(onSetStatus).toHaveBeenCalledWith("r1", "planned");
    await userEvent.click(screen.getByRole("button", { name: /mark done/i }));
    expect(onSetStatus).toHaveBeenCalledWith("r1", "done");
  });

  it("offers to undo when already done", async () => {
    const onSetStatus = vi.fn();
    render(
      <ul>
        <RecommendationCard
          recommendation={rec}
          status="done"
          onSetStatus={onSetStatus}
        />
      </ul>,
    );
    const doneBtn = screen.getByRole("button", { name: /mark as not done/i });
    expect(doneBtn).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(doneBtn);
    expect(onSetStatus).toHaveBeenCalledWith("r1", "suggested");
  });
});

describe("EcoGuidePanel", () => {
  it("shows an empty state with no recommendations", () => {
    render(
      <EcoGuidePanel recommendations={[]} actions={[]} onSetStatus={vi.fn()} />,
    );
    expect(screen.getByText(/no high-impact suggestions/i)).toBeInTheDocument();
  });

  it("lists recommendations and total savings", () => {
    render(
      <EcoGuidePanel
        recommendations={[rec]}
        actions={[{ id: "r1", status: "planned" }]}
        onSetStatus={vi.fn()}
      />,
    );
    expect(screen.getByText(/total potential savings/i)).toBeInTheDocument();
    expect(screen.getByText("Take the bus")).toBeInTheDocument();
    expect(screen.getByText("Planned")).toBeInTheDocument();
  });

  it("notes environmental context when present", () => {
    render(
      <EcoGuidePanel
        recommendations={[rec]}
        actions={[]}
        environment={{ airQualityIndex: 50 }}
        onSetStatus={vi.fn()}
      />,
    );
    expect(screen.getByText(/local environmental data/i)).toBeInTheDocument();
  });

  it("omits the environment note when context is empty", () => {
    render(
      <EcoGuidePanel
        recommendations={[rec]}
        actions={[]}
        environment={{}}
        onSetStatus={vi.fn()}
      />,
    );
    expect(screen.queryByText(/local environmental data/i)).not.toBeInTheDocument();
  });
});
