import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  compareShortcutPriority,
  eventMatchesShortcut,
  formatShortcutChord,
  isComposingEvent,
  isEditableTarget,
  primaryModifierPressed,
  selectShortcutToRun,
  type RegisteredShortcut
} from "./shortcutRegistry.ts";

describe("shortcut registry matching", () => {
  it("matches Ctrl/Command+S with platform primary modifier", () => {
    const def = {
      id: "save",
      key: "s",
      ctrlOrMeta: true,
      scope: "global" as const,
      titleFa: "ذخیره",
      run: () => undefined
    };
    const event = {
      key: "s",
      ctrlKey: true,
      metaKey: false,
      shiftKey: false,
      altKey: false,
      isComposing: false
    } as KeyboardEvent;
    assert.equal(eventMatchesShortcut(event, def), true);
  });

  it("blocks shortcuts during IME composition", () => {
    assert.equal(isComposingEvent({ isComposing: true } as KeyboardEvent), true);
    assert.equal(
      eventMatchesShortcut(
        { key: "s", ctrlKey: true, metaKey: false, shiftKey: false, altKey: false, isComposing: true } as KeyboardEvent,
        {
          id: "save",
          key: "s",
          ctrlOrMeta: true,
          scope: "global",
          titleFa: "ذخیره",
          run: () => undefined
        }
      ),
      false
    );
  });

  it("prefers modal scope over page/global", () => {
    const globalItem: RegisteredShortcut = {
      id: "g",
      key: "Escape",
      scope: "global",
      titleFa: "g",
      order: 1,
      run: () => undefined
    };
    const modalItem: RegisteredShortcut = {
      id: "m",
      key: "Escape",
      scope: "modal",
      titleFa: "m",
      order: 2,
      run: () => undefined
    };
    assert.ok(compareShortcutPriority(modalItem, globalItem) < 0);
    const selected = selectShortcutToRun(
      {
        key: "Escape",
        ctrlKey: false,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        isComposing: false,
        target: null
      } as unknown as KeyboardEvent,
      [globalItem, modalItem]
    );
    assert.equal(selected?.id, "m");
  });

  it("skips disabled shortcuts", () => {
    const selected = selectShortcutToRun(
      {
        key: "k",
        ctrlKey: true,
        metaKey: false,
        shiftKey: false,
        altKey: false,
        isComposing: false,
        target: null
      } as unknown as KeyboardEvent,
      [
        {
          id: "search",
          key: "k",
          ctrlOrMeta: true,
          scope: "global",
          titleFa: "جستجو",
          order: 1,
          enabled: () => false,
          run: () => undefined
        }
      ]
    );
    assert.equal(selected, null);
  });

  it("formats chords without inventing labels from UI copy", () => {
    const chord = formatShortcutChord({ key: "/", ctrlOrMeta: true });
    assert.match(chord, /\/$/);
  });
});

describe("shortcut wiring contracts", () => {
  const here = import.meta.dirname!;
  const srcRoot = join(here, "..", "..");

  it("mounts ShortcutProvider and registers global save/search/help", () => {
    const providers = readFileSync(join(srcRoot, "app/providers.tsx"), "utf8");
    const hooks = readFileSync(join(here, "useShortcut.tsx"), "utf8");
    assert.match(providers, /ShortcutProvider/);
    assert.match(hooks, /global\.save/);
    assert.match(hooks, /global\.search/);
    assert.match(hooks, /global\.help/);
    assert.match(hooks, /registerEscapeLayer/);
  });

  it("wires Ctrl\/Command\+Enter send and Escape layers in chat\/modals", () => {
    const messages = readFileSync(join(srcRoot, "features/companies/MessagesSection.tsx"), "utf8");
    const itemModal = readFileSync(
      join(srcRoot, "features/costReports/components/ItemDetailModal.tsx"),
      "utf8"
    );
    assert.match(messages, /primaryModifierPressed/);
    assert.match(messages, /useEscapeLayer/);
    assert.match(itemModal, /useEscapeLayer/);
  });
});

// Silence unused in node strip environment without DOM Element constructors for isEditableTarget
void isEditableTarget;
void primaryModifierPressed;
