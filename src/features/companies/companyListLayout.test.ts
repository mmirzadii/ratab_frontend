import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getWorkspaceHeaderCopy } from "../../shared/components/workspaceHeaderCopy.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

describe("workspace header copy", () => {
  it("uses فضای کار متریل for the companies workspace", () => {
    assert.equal(getWorkspaceHeaderCopy("/companies").title, "فضای کار متریل");
    assert.equal(getWorkspaceHeaderCopy("/help").title, "راهنمای متریل");
    assert.equal(getWorkspaceHeaderCopy("/status").title, "وضعیت سرویس");
  });
});

describe("companies list title hierarchy", () => {
  const page = readFileSync(join(srcRoot, "pages", "CompanyListPage.tsx"), "utf-8");
  const topHeader = readFileSync(join(srcRoot, "shared", "components", "TopHeader.tsx"), "utf-8");
  const primaryTopBar = readFileSync(
    join(srcRoot, "shared", "components", "PrimaryTopBar.tsx"),
    "utf-8"
  );
  const contextHeader = readFileSync(
    join(srcRoot, "shared", "components", "ContextHeader.tsx"),
    "utf-8"
  );

  it("keeps شرکت‌های شما as the page heading with create action", () => {
    assert.ok(page.includes("شرکت‌های شما"));
    assert.ok(page.includes('data-tour="add-company-btn"'));
    assert.ok(page.includes("افزودن شرکت"));
    // Page must not render a second workspace-identity heading (empty-state copy may mention متریل).
    assert.ok(!page.includes(">فضای کار متریل<"));
    assert.ok(!/h1[\s\S]{0,80}فضای کار متریل/.test(page));
  });

  it("shows workspace title once: mobile PrimaryTopBar, desktop TopHeader", () => {
    assert.ok(primaryTopBar.includes("lg:hidden"));
    assert.ok(primaryTopBar.includes("getWorkspaceHeaderCopy"));
    assert.ok(primaryTopBar.includes("workspace-primary-topbar"));
    assert.ok(!primaryTopBar.includes("صفحه کار متریل"));

    assert.ok(topHeader.includes("hidden"));
    assert.ok(topHeader.includes("lg:block"));
    assert.ok(topHeader.includes("workspace-top-header"));
    assert.ok(topHeader.includes("getWorkspaceHeaderCopy"));

    assert.ok(contextHeader.includes("<TopHeader />"));
  });

  it("does not leave a mobile-only duplicate TopHeader title stack", () => {
    // TopHeader must not render on small screens alongside PrimaryTopBar.
    assert.match(topHeader, /className="[^"]*hidden[^"]*lg:block/);
    assert.match(primaryTopBar, /className="[^"]*lg:hidden/);
  });
});
