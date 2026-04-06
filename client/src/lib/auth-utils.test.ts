import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { isUnauthorizedError, redirectToLogin } from "./auth-utils";

describe("isUnauthorizedError", () => {
  it("returns true for a valid 401 Unauthorized message", () => {
    expect(isUnauthorizedError(new Error("401: Unauthorized"))).toBe(true);
  });

  it("returns true for 401 with extra detail after Unauthorized", () => {
    expect(
      isUnauthorizedError(new Error("401: Unauthorized - token expired"))
    ).toBe(true);
  });

  it("returns false for a 403 Forbidden error", () => {
    expect(isUnauthorizedError(new Error("403: Forbidden"))).toBe(false);
  });

  it("returns false for a 500 error", () => {
    expect(isUnauthorizedError(new Error("500: Internal Server Error"))).toBe(
      false
    );
  });

  it("returns false for a generic error with no status code", () => {
    expect(isUnauthorizedError(new Error("Something went wrong"))).toBe(false);
  });

  it("returns false when the message is empty", () => {
    expect(isUnauthorizedError(new Error(""))).toBe(false);
  });

  it("returns false when 401 appears without the 'Unauthorized' word", () => {
    expect(isUnauthorizedError(new Error("401: Access denied"))).toBe(false);
  });
});

describe("redirectToLogin", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    // Provide a writable href on jsdom's location
    Object.defineProperty(window, "location", {
      value: { href: "" },
      writable: true,
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("redirects to /sign-in after 500 ms", () => {
    redirectToLogin();
    expect(window.location.href).toBe(""); // not yet
    vi.advanceTimersByTime(500);
    expect(window.location.href).toBe("/sign-in");
  });

  it("calls the toast callback with the correct arguments", () => {
    const toast = vi.fn();
    redirectToLogin(toast);
    expect(toast).toHaveBeenCalledOnce();
    expect(toast).toHaveBeenCalledWith({
      title: "Unauthorized",
      description: "You are logged out. Logging in again...",
      variant: "destructive",
    });
  });

  it("does not call toast when no callback is provided", () => {
    // Should not throw when toast is undefined
    expect(() => redirectToLogin()).not.toThrow();
  });

  it("still redirects even without a toast callback", () => {
    redirectToLogin();
    vi.advanceTimersByTime(500);
    expect(window.location.href).toBe("/sign-in");
  });
});
