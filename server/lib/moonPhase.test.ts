import { describe, it, expect } from "vitest";
import {
  getMoonPhase,
  getMoonGlyph,
  type MoonPhaseResult,
} from "./moonPhase";

// Known moon phase dates for deterministic assertions (UTC midnight used).
// Verified against published lunar calendar data.
const NEW_MOON_DATE = new Date("2024-01-11T00:00:00Z"); // New Moon, Jan 11 2024
const FULL_MOON_DATE = new Date("2024-01-25T00:00:00Z"); // Full Moon, Jan 25 2024
const WAXING_CRESCENT_DATE = new Date("2024-01-15T00:00:00Z");
const FIRST_QUARTER_DATE = new Date("2024-01-18T00:00:00Z");
const WAXING_GIBBOUS_DATE = new Date("2024-01-21T00:00:00Z");
const WANING_GIBBOUS_DATE = new Date("2024-01-28T00:00:00Z");
const LAST_QUARTER_DATE = new Date("2024-02-02T00:00:00Z");
const WANING_CRESCENT_DATE = new Date("2024-02-07T00:00:00Z");

describe("getMoonPhase", () => {
  it("returns a MoonPhaseResult with the expected shape", () => {
    const result = getMoonPhase(FULL_MOON_DATE);
    expect(result).toHaveProperty("phase");
    expect(result).toHaveProperty("illumination");
    expect(result).toHaveProperty("glyph");
    expect(result).toHaveProperty("label");
    expect(result).toHaveProperty("isNewMoon");
    expect(result).toHaveProperty("isFullMoon");
    expect(result).toHaveProperty("message");
  });

  it("returns illumination between 0 and 1 (inclusive)", () => {
    const dates = [
      NEW_MOON_DATE,
      WAXING_CRESCENT_DATE,
      FIRST_QUARTER_DATE,
      WAXING_GIBBOUS_DATE,
      FULL_MOON_DATE,
      WANING_GIBBOUS_DATE,
      LAST_QUARTER_DATE,
      WANING_CRESCENT_DATE,
    ];
    for (const date of dates) {
      const { illumination } = getMoonPhase(date);
      expect(illumination).toBeGreaterThanOrEqual(0);
      expect(illumination).toBeLessThanOrEqual(1);
    }
  });

  it("rounds illumination to two decimal places", () => {
    const { illumination } = getMoonPhase(WAXING_GIBBOUS_DATE);
    const decimalPlaces = (illumination.toString().split(".")[1] ?? "").length;
    expect(decimalPlaces).toBeLessThanOrEqual(2);
  });

  it("identifies new moon correctly", () => {
    const result = getMoonPhase(NEW_MOON_DATE);
    expect(result.phase).toBe("new_moon");
    expect(result.isNewMoon).toBe(true);
    expect(result.isFullMoon).toBe(false);
    expect(result.message).toBe("New moon. A good night to begin something.");
    expect(result.glyph).toBe("🌑");
    expect(result.label).toBe("New Moon");
  });

  it("identifies full moon correctly", () => {
    const result = getMoonPhase(FULL_MOON_DATE);
    expect(result.phase).toBe("full_moon");
    expect(result.isFullMoon).toBe(true);
    expect(result.isNewMoon).toBe(false);
    expect(result.message).toBe("Full moon. A good night to finish something.");
    expect(result.glyph).toBe("🌕");
    expect(result.label).toBe("Full Moon");
  });

  it("identifies waxing crescent correctly", () => {
    const result = getMoonPhase(WAXING_CRESCENT_DATE);
    expect(result.phase).toBe("waxing_crescent");
    expect(result.isNewMoon).toBe(false);
    expect(result.isFullMoon).toBe(false);
    expect(result.message).toBeNull();
    expect(result.glyph).toBe("🌒");
    expect(result.label).toBe("Waxing Crescent");
  });

  it("identifies first quarter correctly", () => {
    const result = getMoonPhase(FIRST_QUARTER_DATE);
    expect(result.phase).toBe("first_quarter");
    expect(result.glyph).toBe("🌓");
    expect(result.label).toBe("First Quarter");
    expect(result.message).toBeNull();
  });

  it("identifies waxing gibbous correctly", () => {
    const result = getMoonPhase(WAXING_GIBBOUS_DATE);
    expect(result.phase).toBe("waxing_gibbous");
    expect(result.glyph).toBe("🌔");
    expect(result.label).toBe("Waxing Gibbous");
    expect(result.message).toBeNull();
  });

  it("identifies waning gibbous correctly", () => {
    const result = getMoonPhase(WANING_GIBBOUS_DATE);
    expect(result.phase).toBe("waning_gibbous");
    expect(result.glyph).toBe("🌖");
    expect(result.label).toBe("Waning Gibbous");
    expect(result.message).toBeNull();
  });

  it("identifies last quarter correctly", () => {
    const result = getMoonPhase(LAST_QUARTER_DATE);
    expect(result.phase).toBe("last_quarter");
    expect(result.glyph).toBe("🌗");
    expect(result.label).toBe("Last Quarter");
    expect(result.message).toBeNull();
  });

  it("identifies waning crescent correctly", () => {
    const result = getMoonPhase(WANING_CRESCENT_DATE);
    expect(result.phase).toBe("waning_crescent");
    expect(result.glyph).toBe("🌘");
    expect(result.label).toBe("Waning Crescent");
    expect(result.message).toBeNull();
  });

  it("defaults to the current date when no argument is provided", () => {
    // Should not throw and should return a valid result shape
    const result = getMoonPhase();
    expect(result.phase).toBeTruthy();
    expect(typeof result.illumination).toBe("number");
  });

  it("message is null for non-special phases", () => {
    const phases = [
      WAXING_CRESCENT_DATE,
      FIRST_QUARTER_DATE,
      WAXING_GIBBOUS_DATE,
      WANING_GIBBOUS_DATE,
      LAST_QUARTER_DATE,
      WANING_CRESCENT_DATE,
    ];
    for (const date of phases) {
      expect(getMoonPhase(date).message).toBeNull();
    }
  });

  it("full-moon illumination is near 1.0", () => {
    const { illumination } = getMoonPhase(FULL_MOON_DATE);
    expect(illumination).toBeGreaterThan(0.9);
  });

  it("new-moon illumination is near 0.0", () => {
    const { illumination } = getMoonPhase(NEW_MOON_DATE);
    expect(illumination).toBeLessThan(0.1);
  });

  it("handles January (month < 3) year adjustment correctly", () => {
    // Any January date should not throw and should yield a valid result
    const jan = new Date("2023-01-15T00:00:00Z");
    const result = getMoonPhase(jan);
    expect(result.phase).toBeTruthy();
  });

  it("handles February (month < 3) year adjustment correctly", () => {
    const feb = new Date("2023-02-10T00:00:00Z");
    const result = getMoonPhase(feb);
    expect(result.phase).toBeTruthy();
  });
});

describe("getMoonGlyph", () => {
  it("returns the glyph from getMoonPhase", () => {
    const glyph = getMoonGlyph(FULL_MOON_DATE);
    expect(glyph).toBe(getMoonPhase(FULL_MOON_DATE).glyph);
  });

  it("returns a non-empty string", () => {
    expect(getMoonGlyph(NEW_MOON_DATE)).toBeTruthy();
  });

  it("defaults to the current date when no argument is provided", () => {
    expect(() => getMoonGlyph()).not.toThrow();
    expect(getMoonGlyph()).toBeTruthy();
  });

  it("returns different glyphs for new and full moon", () => {
    expect(getMoonGlyph(NEW_MOON_DATE)).not.toBe(getMoonGlyph(FULL_MOON_DATE));
  });
});
