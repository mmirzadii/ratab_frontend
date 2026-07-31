import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  COMPOSER_TEXTAREA_MAX_HEIGHT_MOBILE_PX,
  COMPOSER_TEXTAREA_MAX_HEIGHT_PX,
  COMPOSER_TEXTAREA_MIN_HEIGHT_PX,
  computeComposerTextareaHeight,
  resolveComposerTextareaMaxHeight,
  shouldSendOnEnterKey
} from "./composerTextarea.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

describe("composer textarea height", () => {
  it("keeps empty/short content at minimum height without a large box", () => {
    const empty = computeComposerTextareaHeight(0);
    assert.equal(empty.heightPx, COMPOSER_TEXTAREA_MIN_HEIGHT_PX);
    assert.equal(empty.overflowY, "hidden");

    const oneLine = computeComposerTextareaHeight(44);
    assert.equal(oneLine.heightPx, COMPOSER_TEXTAREA_MIN_HEIGHT_PX);
    assert.equal(oneLine.overflowY, "hidden");
  });

  it("grows with multiple lines until the maximum", () => {
    const mid = computeComposerTextareaHeight(96);
    assert.equal(mid.heightPx, 96);
    assert.equal(mid.overflowY, "hidden");

    const atMax = computeComposerTextareaHeight(COMPOSER_TEXTAREA_MAX_HEIGHT_PX);
    assert.equal(atMax.heightPx, COMPOSER_TEXTAREA_MAX_HEIGHT_PX);
    assert.equal(atMax.overflowY, "hidden");
  });

  it("caps growth and enables scroll past the maximum", () => {
    const over = computeComposerTextareaHeight(COMPOSER_TEXTAREA_MAX_HEIGHT_PX + 80);
    assert.equal(over.heightPx, COMPOSER_TEXTAREA_MAX_HEIGHT_PX);
    assert.equal(over.overflowY, "auto");
  });

  it("shrinks when scrollHeight decreases", () => {
    const tall = computeComposerTextareaHeight(140);
    const short = computeComposerTextareaHeight(48);
    assert.ok(short.heightPx < tall.heightPx);
    assert.equal(short.overflowY, "hidden");
  });

  it("uses a slightly lower max height on narrow viewports", () => {
    assert.equal(resolveComposerTextareaMaxHeight(390), COMPOSER_TEXTAREA_MAX_HEIGHT_MOBILE_PX);
    assert.equal(resolveComposerTextareaMaxHeight(1280), COMPOSER_TEXTAREA_MAX_HEIGHT_PX);
    const mobile = computeComposerTextareaHeight(200, {
      maxHeightPx: COMPOSER_TEXTAREA_MAX_HEIGHT_MOBILE_PX
    });
    assert.equal(mobile.heightPx, COMPOSER_TEXTAREA_MAX_HEIGHT_MOBILE_PX);
    assert.equal(mobile.overflowY, "auto");
  });
});

describe("composer Enter-to-send", () => {
  it("sends on Enter without Shift", () => {
    assert.equal(shouldSendOnEnterKey({ key: "Enter", shiftKey: false }), true);
  });

  it("creates a new line on Shift+Enter", () => {
    assert.equal(shouldSendOnEnterKey({ key: "Enter", shiftKey: true }), false);
  });

  it("does not send during IME composition", () => {
    assert.equal(
      shouldSendOnEnterKey({
        key: "Enter",
        shiftKey: false,
        nativeEvent: { isComposing: true }
      }),
      false
    );
    assert.equal(
      shouldSendOnEnterKey({ key: "Enter", shiftKey: false, isComposing: true }),
      false
    );
  });
});

describe("MessagesSection composer wiring", () => {
  const messages = readFileSync(
    join(srcRoot, "features", "companies", "MessagesSection.tsx"),
    "utf-8"
  );

  it("uses scrollHeight auto-resize and bottom-aligned controls", () => {
    assert.ok(messages.includes("applyComposerTextareaAutoResize"));
    assert.ok(messages.includes("useLayoutEffect"));
    assert.ok(messages.includes("items-end"));
    assert.ok(messages.includes("shouldSendOnEnterKey"));
    assert.ok(messages.includes("متن پیام"));
    assert.ok(messages.includes("<textarea"));
    assert.ok(!messages.includes("max-h-28"));
    assert.ok(!messages.includes("rows={4}"));
  });

  it("resets draft on successful send and remmeasures on group change", () => {
    assert.ok(messages.includes('setMessageText("")'));
    assert.ok(messages.includes("effectiveGroupId"));
    assert.ok(messages.includes("textareaRef"));
  });

  it("keeps attachment preview above the expanding textarea", () => {
    const areaStart = messages.indexOf('data-tour="message-input-area"');
    const previewIdx = messages.indexOf("pendingAttachments.length > 0", areaStart);
    const textareaIdx = messages.indexOf("<textarea", areaStart);
    assert.ok(areaStart > 0 && previewIdx > areaStart && textareaIdx > previewIdx);
  });
});
