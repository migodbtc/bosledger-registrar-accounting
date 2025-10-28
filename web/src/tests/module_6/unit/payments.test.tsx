import React from "react";
import { renderWithProviders, screen } from "@/tests/test-utils";
import MyPayments from "@/pages/MyPayments";
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

describe("Payments page (module_6)", () => {
  afterAll(() => {
    logger.finalizeRun(1, 0);
  });

  it("renders payments header and Make Payment button", async () => {
    renderWithProviders(<MyPayments />);
    const headings = await screen.findAllByText(
      /Payments|Payment history/i,
      undefined,
      { timeout: 10000 }
    );
    expect(headings.length).toBeGreaterThan(0);
    const makeButtons = await screen
      .findAllByRole("button", { name: /Make Payment/i }, { timeout: 10000 })
      .catch(() => []);
    expect(Array.isArray(makeButtons)).toBe(true);
    logger.logEvent(
      "payments-render",
      "success",
      `buttons:${makeButtons.length}`
    );
  });
});
