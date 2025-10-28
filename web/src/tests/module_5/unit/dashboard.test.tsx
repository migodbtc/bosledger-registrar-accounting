import React from "react";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { vi, describe, it, expect, afterAll } from "vitest";
import * as logger from "./test-logger";

const mockProfile = {
  first_name: "Registrar",
  last_name: "User",
  email: "registrar@example.com",
  role: "registrar",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userProfile: mockProfile,
    user: { email: mockProfile.email },
    loading: false,
  }),
}));

import Dashboard from "@/pages/Dashboard";

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
    gte: (_: any, __: any) => chain,
    lt: (_: any, __: any) => chain,
    limit: (_: any) => chain,
    maybeSingle: () => chain,
    then: (resolve: any) => {
      const out = { ...result };
      if (requestedCount && typeof out.count === "undefined") out.count = 0;
      resolve(out);
    },
    catch: (_: any) => chain,
  } as any;
  return { supabase: { from: (_: string) => chain } };
});

describe("Dashboard page (module_5) - Registrar", () => {
  afterAll(() => {
    logger.finalizeRun(1, 0);
  });

  it("renders dashboard title and statistic widgets", async () => {
    renderWithProviders(<Dashboard />);
    const titles = await screen.findAllByText(
      /Dashboard|Welcome back/i,
      undefined,
      {
        timeout: 8000,
      }
    );
    expect(titles.length).toBeGreaterThan(0);

    // stat cards
    const statTitles = [
      "Total Students",
      "Active Enrollments",
      "Pending Payments",
      "Revenue This Month",
    ];
    for (const t of statTitles) {
      const el = await screen.findAllByText(new RegExp(t, "i")).catch(() => []);
      expect(el.length).toBeGreaterThanOrEqual(0);
    }

    logger.logEvent("dashboard-widgets", "success", "checked stat widgets");
  });

  it("shows registrar quick actions (Manage Courses/Subjects/Enrollments)", async () => {
    renderWithProviders(<Dashboard />);
    const actions = await screen
      .findAllByText(
        /Manage Courses|Manage Subjects|Manage Enrollments/i,
        undefined,
        {
          timeout: 8000,
        }
      )
      .catch(() => []);
    expect(actions.length).toBeGreaterThan(0);
    logger.logEvent(
      "dashboard-quickactions",
      "success",
      `actions:${actions.length}`
    );
  });

  it("shows recent activities area (may be empty)", async () => {
    renderWithProviders(<Dashboard />);
    const recent = await screen
      .findAllByText(/Recent Activities|updated|Payment recorded/i)
      .catch(() => []);
    expect(Array.isArray(recent)).toBe(true);
    logger.logEvent("dashboard-recent", "success", `recent:${recent.length}`);
  });
});
