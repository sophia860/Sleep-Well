import { describe, it, expect } from "vitest";
import { reducer } from "./use-toast";

// The ToasterToast type is not exported, so we derive the toast shape from the
// ADD_TOAST action parameter to keep tests properly typed.
type AddToastAction = Extract<Parameters<typeof reducer>[1], { type: "ADD_TOAST" }>;
type MinimalToast = AddToastAction["toast"];

function makeToast(id: string, open = true): MinimalToast {
  // Minimum fields needed to exercise the reducer; remaining ToastProps fields
  // are not relevant for these unit tests.
  return { id, open } as MinimalToast;
}

describe("toast reducer", () => {
  const initialState = { toasts: [] };

  describe("ADD_TOAST", () => {
    it("adds a toast to an empty list", () => {
      const state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1"),
      });
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe("1");
    });

    it("prepends the new toast (newest first)", () => {
      const first = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1"),
      });
      const second = reducer(first, {
        type: "ADD_TOAST",
        toast: makeToast("2"),
      });
      // TOAST_LIMIT is 1, so only the latest survives
      expect(second.toasts[0].id).toBe("2");
    });

    it("respects TOAST_LIMIT of 1 — only keeps the most recent toast", () => {
      let state = initialState;
      state = reducer(state, { type: "ADD_TOAST", toast: makeToast("a") });
      state = reducer(state, { type: "ADD_TOAST", toast: makeToast("b") });
      state = reducer(state, { type: "ADD_TOAST", toast: makeToast("c") });
      expect(state.toasts).toHaveLength(1);
      expect(state.toasts[0].id).toBe("c");
    });
  });

  describe("UPDATE_TOAST", () => {
    it("updates an existing toast by id", () => {
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1"),
      });
      state = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "1", open: false },
      });
      expect(state.toasts[0].open).toBe(false);
    });

    it("does not modify toasts with a different id", () => {
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1", true),
      });
      state = reducer(state, {
        type: "UPDATE_TOAST",
        toast: { id: "99", open: false },
      });
      expect(state.toasts[0].open).toBe(true);
    });
  });

  describe("DISMISS_TOAST", () => {
    it("sets open:false for the targeted toast", () => {
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1", true),
      });
      state = reducer(state, { type: "DISMISS_TOAST", toastId: "1" });
      expect(state.toasts[0].open).toBe(false);
    });

    it("sets open:false for ALL toasts when toastId is undefined", () => {
      // Only one toast allowed by TOAST_LIMIT=1, but the reducer logic is still testable
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1", true),
      });
      state = reducer(state, { type: "DISMISS_TOAST" });
      expect(state.toasts.every((t) => t.open === false)).toBe(true);
    });
  });

  describe("REMOVE_TOAST", () => {
    it("removes a specific toast by id", () => {
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1"),
      });
      state = reducer(state, { type: "REMOVE_TOAST", toastId: "1" });
      expect(state.toasts).toHaveLength(0);
    });

    it("clears all toasts when toastId is undefined", () => {
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1"),
      });
      state = reducer(state, { type: "REMOVE_TOAST" });
      expect(state.toasts).toHaveLength(0);
    });

    it("leaves state unchanged when the id does not match", () => {
      let state = reducer(initialState, {
        type: "ADD_TOAST",
        toast: makeToast("1"),
      });
      state = reducer(state, { type: "REMOVE_TOAST", toastId: "99" });
      expect(state.toasts).toHaveLength(1);
    });
  });
});
