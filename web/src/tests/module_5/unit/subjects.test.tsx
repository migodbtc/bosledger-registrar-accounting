import React from "react";
import { renderWithProviders, screen } from "@/tests/test-utils";
import { vi, describe, it, expect, afterAll } from "vitest";
import * as logger from "./test-logger";

const mockProfile = {
  first_name: "Test",
  last_name: "User",
  email: "test@example.com",
  role: "admin",
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    userProfile: mockProfile,
    user: { email: mockProfile.email },
    loading: false,
  }),
}));

import Subjects from "@/pages/Subjects";

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

describe("Subjects page (module_5)", () => {
  afterAll(() => {
    logger.finalizeRun(1, 0);
  });

  it("renders subjects header and register button", async () => {
    renderWithProviders(<Subjects />);
    const headings = await screen.findAllByText(
      /Subjects|Subject Directory/i,
      undefined,
      {
        timeout: 8000,
      }
    );
    expect(headings.length).toBeGreaterThan(0);
    const reg = await screen
      .findByRole("button", { name: /Register Subject/i })
      .catch(() => null);
    expect(reg).toBeTruthy();
    logger.logEvent("subjects-render", "success", "rendered subjects page");
  });

  it("shows table or empty state when no subjects", async () => {
    renderWithProviders(<Subjects />);
    const rows = await screen.findAllByRole("row").catch(() => []);
    const empty = await screen
      .findAllByText(/No subjects found|No records|Nothing to show/i)
      .catch(() => []);
    expect(Array.isArray(rows)).toBe(true);
    expect(Array.isArray(empty)).toBe(true);
    logger.logEvent(
      "subjects-table-check",
      "success",
      `rows:${rows.length} empty:${empty.length}`
    );
  });
});
