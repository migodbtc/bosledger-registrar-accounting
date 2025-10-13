import { describe, it, expect, afterAll } from "vitest";
import { renderWithProviders } from "../../test-utils";
import { screen } from "@testing-library/react";
import { logSuccess, logError, getCounts, finalizeRun } from "./test-logger";
import Index from "../../../pages/Index";

describe("Index landing page (module 2)", () => {
  it("renders the main heading", () => {
    try {
      renderWithProviders(<Index />);
      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeTruthy();
      logSuccess("renders the main heading", "Found a level-2 heading");
    } catch (err) {
      logError("renders the main heading", err);
      throw err;
    }
  });

  it("has register and sign in links/buttons", () => {
    try {
      renderWithProviders(<Index />);
      const register = screen.getAllByText(/register/i)[0];
      const signin = screen.getAllByText(/sign in/i)[0];
      expect(register).toBeTruthy();
      expect(signin).toBeTruthy();
      logSuccess("has register and sign in links/buttons");
    } catch (err) {
      logError("has register and sign in links/buttons", err);
      throw err;
    }
  });

  it("renders the expected number of popular courses", () => {
    try {
      renderWithProviders(<Index />);
      // there are three courses in the page data; assert three course titles render
      const courseTitles = screen.getAllByText(/Bachelor of Science/i);
      expect(courseTitles.length).toBeGreaterThanOrEqual(3);
      logSuccess(
        "renders the expected number of popular courses",
        `found ${courseTitles.length}`
      );
    } catch (err) {
      logError("renders the expected number of popular courses", err);
      throw err;
    }
  });

  it("shows the hero paragraph text", () => {
    try {
      renderWithProviders(<Index />);
      const para = screen.getByText(
        /BosLedger is your go-to place for enrollment and finance/i
      );
      expect(para).toBeTruthy();
      logSuccess("shows the hero paragraph text");
    } catch (err) {
      logError("shows the hero paragraph text", err);
      throw err;
    }
  });

  it("renders Popular Courses heading", () => {
    try {
      renderWithProviders(<Index />);
      const heading = screen.getByRole("heading", { name: /Popular Courses/i });
      expect(heading).toBeTruthy();
      logSuccess("renders Popular Courses heading");
    } catch (err) {
      logError("renders Popular Courses heading", err);
      throw err;
    }
  });

  it("renders statistics numbers (1953, 120K+, 98%)", () => {
    try {
      renderWithProviders(<Index />);
      // use getAllByText because some numbers appear multiple times (hero overlay + stats)
      const n1953 = screen.getAllByText("1953");
      const n120k = screen.getAllByText("120K+");
      const n98 = screen.getAllByText("98%");
      expect(n1953.length).toBeGreaterThanOrEqual(1);
      expect(n120k.length).toBeGreaterThanOrEqual(1);
      expect(n98.length).toBeGreaterThanOrEqual(1);
      logSuccess("renders statistics numbers (1953, 120K+, 98%)");
    } catch (err) {
      logError("renders statistics numbers (1953, 120K+, 98%)", err);
      throw err;
    }
  });

  it("contains footer links like Privacy Policy", () => {
    try {
      renderWithProviders(<Index />);
      const link = screen.getByRole("link", { name: /Privacy Policy/i });
      expect(link).toBeTruthy();
      logSuccess("contains footer links like Privacy Policy");
    } catch (err) {
      logError("contains footer links like Privacy Policy", err);
      throw err;
    }
  });

  // optional: after suite write a summary to stdout (vitest will show it)
  // but we can also export counts for external use
});

export const __testCounts = getCounts();

afterAll(() => {
  try {
    const res = finalizeRun();
    // eslint-disable-next-line no-console
    console.log("Test log finalized:", res.finalName);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("Failed to finalize test log", e);
  }
});
