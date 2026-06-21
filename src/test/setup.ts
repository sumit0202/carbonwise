import "@testing-library/jest-dom/vitest";
import { afterEach, expect } from "vitest";
import { cleanup } from "@testing-library/react";
import { toHaveNoViolations } from "jest-axe";

// Register the jest-axe accessibility matcher (toHaveNoViolations).
expect.extend(toHaveNoViolations);

afterEach(() => {
  cleanup();
  localStorage.clear();
});
