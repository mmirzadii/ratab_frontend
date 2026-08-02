import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = join(import.meta.dirname!, "..");
const contextualHelp = readFileSync(join(root, "components", "ContextualHelp.tsx"), "utf-8");
const field = readFileSync(join(root, "components", "Field.tsx"), "utf-8");
const helpHint = readFileSync(join(root, "components", "HelpHint.tsx"), "utf-8");
const button = readFileSync(join(root, "components", "Button.tsx"), "utf-8");
const glassCard = readFileSync(join(root, "components", "GlassCard.tsx"), "utf-8");
const pageHeader = readFileSync(join(root, "components", "PageHeader.tsx"), "utf-8");
const companyList = readFileSync(join(root, "..", "pages", "CompanyListPage.tsx"), "utf-8");
const companyCreate = readFileSync(join(root, "..", "pages", "CompanyCreatePage.tsx"), "utf-8");
const landing = readFileSync(join(root, "..", "pages", "LandingPage.tsx"), "utf-8");
const media = readFileSync(join(root, "hooks", "useMediaQuery.ts"), "utf-8");

describe("ContextualHelp behavior contracts", () => {
  it("opens on desktop hover and keyboard focus", () => {
    assert.ok(contextualHelp.includes("onMouseEnter"));
    assert.ok(contextualHelp.includes("onFocus"));
    assert.ok(contextualHelp.includes("useCoarsePointer"));
    assert.ok(media.includes("(hover: none) and (pointer: coarse)"));
  });

  it("opens on mobile tap via coarse-pointer click toggle", () => {
    assert.ok(contextualHelp.includes("if (isCoarse) setOpen"));
    assert.ok(contextualHelp.includes("onClick"));
  });

  it("closes on Escape and outside interaction", () => {
    assert.ok(contextualHelp.includes('event.key === "Escape"'));
    assert.ok(contextualHelp.includes("mousedown"));
    assert.ok(contextualHelp.includes("touchstart"));
  });

  it("trigger is an accessible button with expanded state and focus ring", () => {
    assert.ok(contextualHelp.includes('type="button"'));
    assert.ok(contextualHelp.includes("aria-label"));
    assert.ok(contextualHelp.includes("aria-expanded"));
    assert.ok(contextualHelp.includes("focus-visible:ring-2"));
  });

  it("tooltip panel is plain text without interactive controls", () => {
    const panelMatch = contextualHelp.match(
      /data-testid="contextual-help-panel"[\s\S]*?<\/span>/
    );
    assert.ok(panelMatch);
    assert.ok(!panelMatch![0].includes("<button"));
    assert.ok(!panelMatch![0].includes("<a "));
    assert.ok(panelMatch![0].includes('role="tooltip"'));
  });

  it("documents popover for interactive content; HelpHint re-exports ContextualHelp", () => {
    assert.ok(contextualHelp.includes("use a dedicated popover"));
    assert.ok(helpHint.includes("ContextualHelp as HelpHint"));
  });
});

describe("shared visual system contracts", () => {
  it("PageHeader is compact operational chrome", () => {
    assert.ok(pageHeader.includes("border-b border-ui-border-subtle"));
    assert.ok(pageHeader.includes("text-xl"));
    assert.ok(!pageHeader.includes("text-4xl"));
  });

  it("GlassCard uses restrained radius and shadow", () => {
    assert.ok(glassCard.includes("rounded-xl"));
    assert.ok(glassCard.includes("shadow-ui-sm"));
    assert.ok(!glassCard.includes("via-emerald"));
  });

  it("Button keeps focus-visible and size variants", () => {
    assert.ok(button.includes("focus-visible:ring-2"));
    assert.ok(button.includes('size?: ButtonSize'));
  });

  it("Field keeps required marker outside tooltip", () => {
    assert.ok(field.includes("required"));
    assert.ok(field.includes("ContextualHelp"));
  });
});

describe("essential helpers and validation stay visible", () => {
  it("company create keeps validation and required name outside help", () => {
    assert.ok(companyCreate.includes("نام شرکت الزامی است"));
    assert.ok(companyCreate.includes("formError"));
  });

  it("company list keeps compact cards without hero padding", () => {
    assert.ok(companyList.includes("CompanySummaryCard"));
    assert.ok(!companyList.includes("sm:p-8"));
    assert.ok(!companyList.includes("via-emerald"));
  });
});

describe("authenticated marketing copy removed; landing retains promo", () => {
  it("company list has no decorative marketing badge or duplicate heading", () => {
    assert.ok(!companyList.includes("فضای شرکت‌های متریل"));
    assert.ok(!companyList.includes("شرکت‌های شما"));
    assert.ok(!companyList.includes("نقطه ورود به فضای کار"));
  });

  it("landing page retains intentional marketing copy", () => {
    assert.ok(landing.includes("نسخه آزمایشی") || landing.includes("ورود به فضای"));
  });
});
