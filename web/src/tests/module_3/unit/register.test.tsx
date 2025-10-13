import { describe, it, expect, afterAll, vi } from "vitest";
import { renderWithProviders } from "../../../tests/test-utils";
import { screen, fireEvent, waitFor } from "@testing-library/react";
import Register from "../../../pages/auth/Register";
import * as logger from "./test-logger";

const signUpMock = vi.fn();
// Mock useAuth from contexts to provide signUp (use shared mock so tests can override)
vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => ({
    signUp: signUpMock,
  }),
}));

// Default behavior
signUpMock.mockResolvedValue({ error: null });

describe("Register page (module 3)", () => {
  it("submits the form and calls signUp", async () => {
    try {
      renderWithProviders(<Register />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/^password$/i);
      const confirm = screen.getByLabelText(/confirm password/i);
      const submit = screen.getByRole("button", { name: /create account/i });

      fireEvent.change(email, { target: { value: "test@example.com" } });
      fireEvent.change(password, { target: { value: "secret123" } });
      fireEvent.change(confirm, { target: { value: "secret123" } });
      fireEvent.click(submit);

      await waitFor(() => {
        // if mock was called, the test is successful
        expect(signUpMock).toHaveBeenCalled();
        logger.logSuccess("register submits and calls signUp");
      });
    } catch (err) {
      logger.logError("register submits and calls signUp", err);
      throw err;
    }
  });

  it("shows an alert when passwords do not match", async () => {
    try {
      // ensure signUp won't be called
      signUpMock.mockClear();
      renderWithProviders(<Register />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/^password$/i);
      const confirm = screen.getByLabelText(/confirm password/i);
      const submit = screen.getByRole("button", { name: /create account/i });

      fireEvent.change(email, { target: { value: "x@x.com" } });
      fireEvent.change(password, { target: { value: "a" } });
      fireEvent.change(confirm, { target: { value: "b" } });

      const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
      fireEvent.click(submit);
      expect(alertSpy).toHaveBeenCalled();
      logger.logSuccess("password mismatch shows alert");
      alertSpy.mockRestore();
    } catch (err) {
      logger.logError("password mismatch shows alert", err);
      throw err;
    }
  });

  it("handles signUp error gracefully", async () => {
    try {
      signUpMock.mockResolvedValueOnce({ error: "email_exists" });
      renderWithProviders(<Register />);
      const email = screen.getByLabelText(/email address/i);
      const password = screen.getByLabelText(/^password$/i);
      const confirm = screen.getByLabelText(/confirm password/i);
      const submit = screen.getByRole("button", { name: /create account/i });

      fireEvent.change(email, { target: { value: "dup@example.com" } });
      fireEvent.change(password, { target: { value: "secret123" } });
      fireEvent.change(confirm, { target: { value: "secret123" } });
      fireEvent.click(submit);

      await waitFor(() => {
        expect(signUpMock).toHaveBeenCalled();
        logger.logSuccess("signUp error path exercised");
      });
    } catch (err) {
      logger.logError("signUp error path exercised", err);
      throw err;
    }
  });

  afterAll(() => {
    try {
      const res = logger.finalizeRun();
      // eslint-disable-next-line no-console
      console.log("Module 3 register log:", res.finalName);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error("Failed to finalize module_3 register log", e);
    }
  });
});
