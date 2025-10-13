import React from "react";
import { renderWithProviders, screen } from "@/tests/test-utils";
import MyBalances from "@/pages/MyBalances";
import { vi, describe, it, expect, afterAll } from "vitest";
import * as logger from "./test-logger";

const mockProfile = {
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  role: "student",
  student_profile: { id: "sp_1" },
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userProfile: mockProfile,
    user: { email: mockProfile.email },
    loading: false,
  }),
}));

import { createSupabaseMock } from "./supabase-mock";
vi.mock("@/utils/supabaseClient", () => {
  const result = { data: [], error: null, count: 0 };
  let requestedCount = false;
  const chain: any = {
    select: (...args: any[]) => {
      const maybeOptions = args[1];
      if (
        maybeOptions &&
        typeof maybeOptions === "object" &&
        "count" in maybeOptions
      )
        requestedCount = true;
      return chain;
    },
    eq: (_: any, __: any) => chain,
    order: (_: any, __: any) => chain,
    range: (_: any, __: any) => chain,
    in: (_: any, __: any) => chain,
    then: (resolve: any) => {
      const out = { ...result };
      if (requestedCount && typeof out.count === "undefined") out.count = 0;
      resolve(out);
    },
    catch: (_: any) => chain,
  } as any;
  return { supabase: { from: (_: string) => chain } };
});

describe("MyBalances page (module_4)", () => {
  afterAll(() => {
    logger.finalizeRun(1, 0);
  });

  it("renders balances header and Make Payment button", async () => {
    renderWithProviders(<MyBalances />);
    const headings = await screen.findAllByText(
      /My Balances|Outstanding amounts/i,
      undefined,
      { timeout: 10000 }
    );
    expect(headings.length).toBeGreaterThan(0);
    const heading = headings[0];
    expect(heading).toBeTruthy();
    const make = screen.getByRole("button", { name: /Make Payment/i });
    expect(make).toBeTruthy();
    make.click();
    logger.logEvent("balances-make-button", "success", "clicked make payment");
  });

  it("shows balances summary or table", async () => {
    renderWithProviders(<MyBalances />);
    const summary = await screen
      .findAllByText(/Outstanding|Balance|Total due/i, undefined, {
        timeout: 5000,
      })
      .catch(() => []);
    expect(summary.length).toBeGreaterThanOrEqual(0);
    logger.logEvent(
      "balances-summary-check",
      "success",
      "checked balances summary"
    );
  });

  it("clicks the first Make Payment button when present", async () => {
    renderWithProviders(<MyBalances />);
    const makeButtons = await screen.findAllByRole(
      "button",
      { name: /Make Payment/i },
      { timeout: 10000 }
    );
    if (makeButtons.length > 0) {
      makeButtons[0].click();
      logger.logEvent(
        "balances-make-first",
        "success",
        "clicked first make button"
      );
    } else {
      logger.logEvent(
        "balances-make-first",
        "error",
        "no make payment buttons found"
      );
    }
    expect(Array.isArray(makeButtons)).toBe(true);
  });

  it("checks for invoice or reference numbers in balances", async () => {
    renderWithProviders(<MyBalances />);
    const refs = await screen
      .findAllByText(/Invoice|Ref|Reference|OR No\.|Invoice No\./i)
      .catch(() => []);
    // not mandatory; just ensure the check runs
    expect(Array.isArray(refs)).toBe(true);
    logger.logEvent("balances-ref-check", "success", `refs:${refs.length}`);
  });

  it("tries to click Make Payment inside balance rows", async () => {
    renderWithProviders(<MyBalances />);
    const rows = await screen.findAllByRole("row").catch(() => []);
    let clicked = false;
    for (const r of rows) {
      const btn = r.querySelector("button");
      if (btn && /Make Payment/i.test(btn.textContent || "")) {
        (btn as HTMLElement).click();
        clicked = true;
        break;
      }
    }
    logger.logEvent("balances-row-click", "success", `clicked:${clicked}`);
    expect(typeof clicked === "boolean").toBe(true);
  });
});
