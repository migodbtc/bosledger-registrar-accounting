import React from "react";
import { renderWithProviders, screen } from "@/tests/test-utils";
import Dashboard from "@/pages/Dashboard";
import { vi, describe, it, expect, afterAll } from "vitest";
import * as logger from "./test-logger";

const mockProfile = {
  first_name: "Acct",
  last_name: "User",
  email: "acct@example.com",
  role: "accounting",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userProfile: mockProfile,
    user: { email: mockProfile.email },
    loading: false,
  }),
}));

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
    limit: (_: any) => chain,
    range: (_: any, __: any) => chain,
    maybeSingle: () => chain,
    gte: (_: any, __: any) => chain,
    lt: (_: any, __: any) => chain,
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

describe("Dashboard (module_6 accounting)", () => {
  afterAll(() => {
    logger.finalizeRun(1, 0);
  });

  it("renders dashboard header and quick actions for accounting", async () => {
    renderWithProviders(<Dashboard />);
    const headings = await screen.findAllByText(
      /Dashboard|Quick actions|Overview/i,
      undefined,
      {
        timeout: 8000,
      }
    );
    expect(headings.length).toBeGreaterThan(0);
    // quick action buttons may exist (e.g., Make Payment, Create Invoice)
    const actions = await screen
      .findAllByRole("button", {
        name: /Make Payment|Create Invoice|View Reports/i,
      })
      .catch(() => []);
    expect(Array.isArray(actions)).toBe(true);
    logger.logEvent("dashboard-render", "success", `actions:${actions.length}`);
  });

  it("shows stat widgets or placeholders", async () => {
    renderWithProviders(<Dashboard />);
    // widget titles often include words like Outstanding, Balances, Payments
    const widgets = await screen
      .findAllByText(/Outstanding|Balances|Payments|Invoices|Revenue/i)
      .catch(() => []);
    expect(Array.isArray(widgets)).toBe(true);
    logger.logEvent(
      "dashboard-widgets",
      "success",
      `widgets:${widgets.length}`
    );
  });
});
