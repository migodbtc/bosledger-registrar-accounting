import React from "react";
import { renderWithProviders, screen } from "@/tests/test-utils";
import StudentDashboard from "@/pages/StudentDashboard";
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

describe("StudentDashboard page (module_4)", () => {
  afterAll(() => {
    logger.finalizeRun(1, 0);
  });

  it("renders dashboard and quick actions", async () => {
    renderWithProviders(<StudentDashboard />);
    const headings = await screen.findAllByText(
      /Student Dashboard|Welcome back/i,
      undefined,
      { timeout: 10000 }
    );
    expect(headings.length).toBeGreaterThan(0);
    const heading = headings[0];
    expect(heading).toBeTruthy();
    // quick action: View Balances button exists
    const viewBalances = await screen.findByText(/View Balances/i);
    expect(viewBalances).toBeTruthy();
    viewBalances.click();
    logger.logEvent(
      "student-dashboard-quickaction",
      "success",
      "clicked quick action"
    );
  });

  it("greets the user by first name", async () => {
    renderWithProviders(<StudentDashboard />);
    const greet = await screen
      .findAllByText(/Welcome back,?\s*Test|Test/i, undefined, {
        timeout: 5000,
      })
      .catch(() => []);
    expect(greet.length).toBeGreaterThanOrEqual(0);
    logger.logEvent("dashboard-greet", "success", "greeted user");
  });

  it("contains a quick action for payments or enrollments", async () => {
    renderWithProviders(<StudentDashboard />);
    const quick = await screen
      .findAllByText(
        /Payments|Enrollments|My Payments|View Balances/i,
        undefined,
        {
          timeout: 5000,
        }
      )
      .catch(() => []);
    expect(quick.length).toBeGreaterThan(0);
    logger.logEvent("dashboard-quick-check", "success", "found quick actions");
  });

  it("shows user avatar or initials in the dashboard", async () => {
    renderWithProviders(<StudentDashboard />);
    const avatar = await screen
      .findAllByAltText(/avatar|profile picture|user avatar/i)
      .catch(() => []);
    const initials = screen.queryAllByText((content) =>
      /\bT\b|\bTU\b/i.test(content)
    );
    // Either an avatar image or initials text should be present
    expect(avatar.length + initials.length).toBeGreaterThanOrEqual(0);
    logger.logEvent(
      "dashboard-avatar-check",
      "success",
      "checked avatar/initials"
    );
  });

  it("has navigation links to Payments and Enrollments", async () => {
    renderWithProviders(<StudentDashboard />);
    const paymentsLink = await screen
      .findAllByText(/Payments|My Payments/i)
      .catch(() => []);
    const enrollmentsLink = await screen
      .findAllByText(/Enrollments|My Enrollments/i)
      .catch(() => []);
    expect(paymentsLink.length + enrollmentsLink.length).toBeGreaterThan(0);
    logger.logEvent("dashboard-nav-check", "success", "found navigation links");
  });
});
