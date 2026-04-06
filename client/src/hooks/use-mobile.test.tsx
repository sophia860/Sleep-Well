import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "./use-mobile";

const MOBILE_BREAKPOINT = 768;

function setWindowWidth(width: number) {
  Object.defineProperty(window, "innerWidth", {
    writable: true,
    configurable: true,
    value: width,
  });
}

describe("useIsMobile", () => {
  beforeEach(() => {
    setWindowWidth(1024);
    vi.restoreAllMocks();
  });

  it("returns false when window.innerWidth is wider than the mobile breakpoint", () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when window.innerWidth is below the mobile breakpoint", () => {
    setWindowWidth(375);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("returns false when window.innerWidth is exactly at the breakpoint (768px)", () => {
    setWindowWidth(MOBILE_BREAKPOINT);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when window.innerWidth is one pixel below the breakpoint (767px)", () => {
    setWindowWidth(MOBILE_BREAKPOINT - 1);
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates from false to true when the matchMedia change event fires after a resize", () => {
    // Capture the 'change' listener registered by the hook so we can invoke it.
    let capturedListener: (() => void) | null = null;
    const fakeMql = {
      addEventListener: vi.fn((_: string, cb: () => void) => {
        capturedListener = cb;
      }),
      removeEventListener: vi.fn(),
    };
    vi.spyOn(window, "matchMedia").mockReturnValue(
      fakeMql as unknown as MediaQueryList
    );

    setWindowWidth(1200);
    const { result } = renderHook(() => useIsMobile());
    // Initial render with desktop width
    expect(result.current).toBe(false);

    // Simulate a resize down to a mobile width and fire the listener
    act(() => {
      setWindowWidth(480);
      capturedListener?.();
    });

    expect(result.current).toBe(true);
  });

  it("always returns a boolean (never undefined)", () => {
    setWindowWidth(1024);
    const { result } = renderHook(() => useIsMobile());
    expect(typeof result.current).toBe("boolean");
  });
});
