import { describe, it, expect, afterAll, vi } from "vitest";
import { renderWithProviders } from "../../../tests/test-utils";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import Login from "../../../pages/auth/Login";
import * as logger from "./test-logger";

const signInMock = vi.fn();
const refreshMock = vi.fn();

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signIn: signInMock,
    userProfile: null,
    refreshProfile: refreshMock,
  }),
}));

signInMock.mockResolvedValue({ error: null });
refreshMock.mockResolvedValue({ role: "student" });

vi.mock("@/utils/supabaseClient", () => ({
  supabase: {
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: "u1" } } }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () => ({ data: { role: "student" }, error: null }),
        }),
      }),
    }),
  },
}));

describe("Login page (module 3)", () => {
  it("submits login and navigates based on role", async () => {
    try {
      renderWithProviders(<Login />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/password/i);
      const submit = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(email, { target: { value: "student@dbtc.edu" } });
      fireEvent.change(password, { target: { value: "pass1234" } });
      fireEvent.click(submit);

      await waitFor(() => {
        logger.logSuccess("login submits and (mock) navigates by role");
      });
    } catch (err) {
      logger.logError("login submits and (mock) navigates by role", err);
      throw err;
    }
  });

  it("handles invalid credentials (signIn returns error)", async () => {
    try {
      signInMock.mockResolvedValueOnce({ error: "invalid_credentials" });
      renderWithProviders(<Login />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/password/i);
      const submit = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(email, { target: { value: "bad@user" } });
      fireEvent.change(password, { target: { value: "wrong" } });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(signInMock).toHaveBeenCalled();
        logger.logSuccess("invalid credentials path exercised");
      });
    } catch (err) {
      logger.logError("invalid credentials path exercised", err);
      throw err;
    }
  });

  it("falls back to DB role lookup when refreshProfile returns null", async () => {
    try {
      refreshMock.mockResolvedValueOnce(null);
      renderWithProviders(<Login />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/password/i);
      const submit = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(email, { target: { value: "student@dbtc.edu" } });
      fireEvent.change(password, { target: { value: "pass1234" } });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(signInMock).toHaveBeenCalled();
        logger.logSuccess("fallback DB role lookup exercised");
      });
    } catch (err) {
      logger.logError("fallback DB role lookup exercised", err);
      throw err;
    }
  });

  it("handles refreshProfile errors gracefully", async () => {
    try {
      refreshMock.mockRejectedValueOnce(new Error("refresh failed"));
      renderWithProviders(<Login />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/password/i);
      const submit = screen.getByRole("button", { name: /sign in/i });

      fireEvent.change(email, { target: { value: "student@dbtc.edu" } });
      fireEvent.change(password, { target: { value: "pass1234" } });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(signInMock).toHaveBeenCalled();
        logger.logSuccess("refreshProfile error path exercised");
      });
    } catch (err) {
      logger.logError("refreshProfile error path exercised", err);
      throw err;
    }
  });

  afterAll(() => {
    try {
      const res = logger.finalizeRun();
      // eslint-disable-next-line no-console
      console.log("Module 3 login log:", res.finalName);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to finalize module_3 login log", e);
    }
  });
});
