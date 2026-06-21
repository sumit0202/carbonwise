import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import HomePage from "@/app/page";

beforeEach(() => {
  localStorage.clear();
  vi.stubGlobal(
    "fetch",
    vi.fn(
      async () =>
        new Response(
          JSON.stringify({ mapsApiKey: null, mapsAvailable: false, demoMode: true }),
          { status: 200 },
        ),
    ),
  );
});
afterEach(() => vi.unstubAllGlobals());

describe("HomePage", () => {
  it("renders the CarbonWise app", async () => {
    render(<HomePage />);
    await waitFor(() =>
      expect(screen.getByText("CarbonWise")).toBeInTheDocument(),
    );
  });
});
