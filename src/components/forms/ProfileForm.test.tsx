import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { DEFAULT_PROFILE } from "@/lib/options";

const originalGeolocation = navigator.geolocation;

afterEach(() => {
  Object.defineProperty(navigator, "geolocation", {
    value: originalGeolocation,
    configurable: true,
  });
});

function setGeolocation(value: unknown) {
  Object.defineProperty(navigator, "geolocation", {
    value,
    configurable: true,
  });
}

describe("ProfileForm", () => {
  it("saves a valid profile from every field and announces success", async () => {
    const onSave = vi.fn();
    render(<ProfileForm initialProfile={DEFAULT_PROFILE} onSave={onSave} />);
    await userEvent.type(screen.getByLabelText(/city or area/i), "Seattle");
    await userEvent.selectOptions(screen.getByLabelText("Diet style"), "vegan");
    await userEvent.selectOptions(
      screen.getByLabelText("Main commute mode"),
      "bike",
    );
    const travel = screen.getByLabelText(/approximate weekly travel/i);
    await userEvent.clear(travel);
    await userEvent.type(travel, "50");
    const elec = screen.getByLabelText(/monthly electricity/i);
    await userEvent.clear(elec);
    await userEvent.type(elec, "200");
    await userEvent.selectOptions(
      screen.getByLabelText("Shopping habits"),
      "minimal",
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/waste & recycling/i),
      "all",
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/your main goal/i),
      "transport",
    );
    await userEvent.click(
      screen.getByRole("button", { name: /calculate my footprint/i }),
    );
    expect(onSave).toHaveBeenCalledOnce();
    const saved = onSave.mock.calls[0]![0];
    expect(saved).toMatchObject({
      city: "Seattle",
      diet: "vegan",
      commuteMode: "bike",
      weeklyTravelKm: 50,
      electricityKwhPerMonth: 200,
      shoppingLevel: "minimal",
      recycling: "all",
      goal: "transport",
    });
    expect(screen.getByRole("status")).toHaveTextContent(/profile saved/i);
  });

  it("shows a locating state while a position is pending", async () => {
    setGeolocation({ getCurrentPosition: () => undefined });
    render(<ProfileForm initialProfile={DEFAULT_PROFILE} onSave={vi.fn()} />);
    await userEvent.click(
      screen.getByRole("button", { name: /use my location/i }),
    );
    expect(
      screen.getByRole("button", { name: /locating/i }),
    ).toBeDisabled();
  });

  it("shows validation errors and does not save", async () => {
    const onSave = vi.fn();
    render(<ProfileForm initialProfile={DEFAULT_PROFILE} onSave={onSave} />);
    const household = screen.getByLabelText("Household size");
    await userEvent.clear(household);
    await userEvent.type(household, "0");
    await userEvent.click(
      screen.getByRole("button", { name: /calculate my footprint/i }),
    );
    expect(onSave).not.toHaveBeenCalled();
    expect(screen.getByText(/fix the highlighted fields/i)).toBeInTheDocument();
  });

  it("captures an approximate location", async () => {
    setGeolocation({
      getCurrentPosition: (success: PositionCallback) =>
        success({
          coords: { latitude: 47.612345, longitude: -122.334 },
        } as GeolocationPosition),
    });
    const onSave = vi.fn();
    render(<ProfileForm initialProfile={DEFAULT_PROFILE} onSave={onSave} />);
    await userEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/47.61/);
    await userEvent.click(
      screen.getByRole("button", { name: /calculate my footprint/i }),
    );
    expect(onSave.mock.calls[0]![0].coordinates).toEqual({
      lat: 47.61,
      lng: -122.33,
    });
  });

  it("handles a geolocation error", async () => {
    setGeolocation({
      getCurrentPosition: (
        _success: PositionCallback,
        error: PositionErrorCallback,
      ) => error({ code: 1 } as GeolocationPositionError),
    });
    render(<ProfileForm initialProfile={DEFAULT_PROFILE} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/couldn't get your location/i);
  });

  it("reports when geolocation is unavailable", async () => {
    setGeolocation(undefined);
    render(<ProfileForm initialProfile={DEFAULT_PROFILE} onSave={vi.fn()} />);
    await userEvent.click(screen.getByRole("button", { name: /use my location/i }));
    expect(screen.getByRole("status")).toHaveTextContent(/not available/i);
  });
});
