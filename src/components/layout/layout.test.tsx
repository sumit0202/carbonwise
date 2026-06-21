import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SkipLink } from "@/components/layout/SkipLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Landing } from "@/components/layout/Landing";

describe("SkipLink", () => {
  it("links to the main content", () => {
    render(<SkipLink />);
    expect(screen.getByRole("link", { name: /skip to main content/i })).toHaveAttribute(
      "href",
      "#main-content",
    );
  });
});

describe("Header", () => {
  const tabs = [
    { id: "home", label: "Home" },
    { id: "profile", label: "Profile" },
  ];

  it("marks the active tab and reacts to selection", async () => {
    const onSelect = vi.fn();
    render(<Header tabs={tabs} activeTab="home" onSelect={onSelect} />);
    expect(screen.getByRole("button", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "Profile" })).not.toHaveAttribute(
      "aria-current",
    );
    await userEvent.click(screen.getByRole("button", { name: "Profile" }));
    expect(onSelect).toHaveBeenCalledWith("profile");
  });
});

describe("Footer", () => {
  it("describes demo mode", () => {
    render(<Footer demoMode />);
    expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
  });
  it("describes live mode", () => {
    render(<Footer demoMode={false} />);
    expect(screen.getByText(/live mode/i)).toBeInTheDocument();
  });
});

describe("Landing", () => {
  it("calls onStart from the CTA", async () => {
    const onStart = vi.fn();
    render(<Landing onStart={onStart} demoMode />);
    await userEvent.click(
      screen.getByRole("button", { name: /calculate my footprint/i }),
    );
    expect(onStart).toHaveBeenCalledOnce();
    expect(screen.getByText(/demo mode/i)).toBeInTheDocument();
  });

  it("shows live mode copy when keys are present", () => {
    render(<Landing onStart={() => {}} demoMode={false} />);
    expect(screen.getByText(/live mode is active/i)).toBeInTheDocument();
  });
});
