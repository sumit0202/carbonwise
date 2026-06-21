import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CategoryBreakdown } from "@/components/calculator/CategoryBreakdown";
import { AddActivityForm } from "@/components/calculator/AddActivityForm";
import { CalculatorView } from "@/components/calculator/CalculatorView";
import { calculateFootprint } from "@/lib/emissions/calculator";
import type { ManualActivity, UserProfile } from "@/types";

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

describe("CategoryBreakdown", () => {
  it("renders each category and flags the top contributor", () => {
    render(
      <CategoryBreakdown
        breakdown={footprint.byCategory}
        total={footprint.weeklyKgCo2e}
        topContributor={footprint.topContributor}
      />,
    );
    expect(screen.getByText("Transport")).toBeInTheDocument();
    expect(screen.getByText("Top contributor")).toBeInTheDocument();
    expect(
      screen.getAllByRole("progressbar").length,
    ).toBe(footprint.byCategory.length);
  });
});

describe("AddActivityForm", () => {
  it("adds a valid activity and clears the form", async () => {
    const onAdd = vi.fn();
    render(<AddActivityForm onAdd={onAdd} />);
    await userEvent.type(screen.getByLabelText("Description"), "Flight");
    await userEvent.type(screen.getByLabelText(/weekly kg/i), "12");
    await userEvent.click(screen.getByRole("button", { name: /add activity/i }));
    expect(onAdd).toHaveBeenCalledOnce();
    expect(onAdd.mock.calls[0]![0].label).toBe("Flight");
    expect(screen.getByRole("status")).toHaveTextContent(/added/i);
  });

  it("rejects an empty activity", async () => {
    const onAdd = vi.fn();
    render(<AddActivityForm onAdd={onAdd} />);
    await userEvent.selectOptions(screen.getByLabelText("Category"), "waste");
    await userEvent.type(screen.getByLabelText(/weekly kg/i), "5");
    await userEvent.click(screen.getByRole("button", { name: /add activity/i }));
    expect(onAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/correct the activity/i)).toBeInTheDocument();
  });
});

describe("CalculatorView", () => {
  const activities: ManualActivity[] = [
    { id: "a1", category: "food", label: "Flight", weeklyKgCo2e: 10 },
  ];

  it("renders totals, confidence and the activity list", async () => {
    const onRemove = vi.fn();
    render(
      <CalculatorView
        footprint={calculateFootprint(profile, activities)}
        activities={activities}
        onAddActivity={vi.fn()}
        onRemoveActivity={onRemove}
      />,
    );
    expect(screen.getByText(/your carbon footprint/i)).toBeInTheDocument();
    expect(screen.getByText(/confidence:/i)).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /remove flight/i }));
    expect(onRemove).toHaveBeenCalledWith("a1");
  });

  it("shows an empty state without manual activities", () => {
    render(
      <CalculatorView
        footprint={footprint}
        activities={[]}
        onAddActivity={vi.fn()}
        onRemoveActivity={vi.fn()}
      />,
    );
    expect(screen.getByText(/no manual activities/i)).toBeInTheDocument();
  });
});
