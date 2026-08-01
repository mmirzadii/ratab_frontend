import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { focusAdjacentFormField, getFocusableElements, isElementVisible } from "./focusNavigation.ts";

describe("focus navigation helpers", () => {
  it("exports focus helpers for form order and restoration", () => {
    assert.equal(typeof getFocusableElements, "function");
    assert.equal(typeof focusAdjacentFormField, "function");
    assert.equal(typeof isElementVisible, "function");
  });
});
