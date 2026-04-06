import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("returns a single class name unchanged", () => {
    expect(cn("foo")).toBe("foo");
  });

  it("merges multiple class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("deduplicates Tailwind classes (last one wins)", () => {
    // tailwind-merge keeps the last conflicting class
    expect(cn("p-2", "p-4")).toBe("p-4");
  });

  it("ignores falsy values", () => {
    expect(cn("foo", false, undefined, null, "bar")).toBe("foo bar");
  });

  it("handles conditional object syntax from clsx", () => {
    expect(cn({ foo: true, bar: false })).toBe("foo");
  });

  it("handles array syntax from clsx", () => {
    expect(cn(["foo", "bar"])).toBe("foo bar");
  });

  it("returns an empty string when no valid classes are provided", () => {
    expect(cn(false, undefined, null)).toBe("");
  });

  it("merges conflicting Tailwind text-color classes correctly", () => {
    expect(cn("text-red-500", "text-blue-500")).toBe("text-blue-500");
  });

  it("preserves non-conflicting Tailwind classes from both arguments", () => {
    const result = cn("font-bold", "text-lg");
    expect(result).toContain("font-bold");
    expect(result).toContain("text-lg");
  });
});
