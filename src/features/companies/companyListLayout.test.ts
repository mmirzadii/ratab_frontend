import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import { getWorkspaceHeaderCopy } from "../../shared/components/workspaceHeaderCopy.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

describe("workspace header copy", () => {
  it("uses compact shell titles without marketing subtitles", () => {
    assert.equal(getWorkspaceHeaderCopy("/companies").title, "متریل");
    assert.equal(getWorkspaceHeaderCopy("/companies").description, "");
    assert.equal(getWorkspaceHeaderCopy("/help").title, "راهنما");
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
  const pageHeader = readFileSync(join(srcRoot, "shared", "components", "PageHeader.tsx"), "utf-8");

  it("uses شرکت‌ها as the single page heading with create action", () => {
    assert.ok(page.includes("شرکت‌ها"));
    assert.ok(!page.includes("شرکت‌های شما"));
    assert.ok(!page.includes("فضای شرکت‌های متریل"));
    assert.ok(!page.includes("شرکت فعال قابل دسترس"));
    assert.ok(page.includes('data-tour="add-company-btn"'));
    assert.ok(page.includes("افزودن شرکت"));
    assert.ok(page.includes("به‌روزرسانی"));
    assert.ok(page.includes("PageHeader"));
    assert.ok(pageHeader.includes("data-testid=\"page-header\""));
  });

  it("does not wrap the list header in a hero GlassCard", () => {
    assert.ok(!page.includes("via-emerald-300"));
    assert.ok(!page.includes("Sparkles"));
  });

  it("shows workspace title once: mobile PrimaryTopBar, desktop TopHeader", () => {
    assert.ok(primaryTopBar.includes("lg:hidden"));
    assert.ok(primaryTopBar.includes("getWorkspaceHeaderCopy"));
    assert.ok(topHeader.includes("lg:block"));
    assert.ok(topHeader.includes("workspace-top-header"));
    assert.ok(contextHeader.includes("<TopHeader />"));
  });

  it("does not leave a mobile-only duplicate TopHeader title stack", () => {
    assert.match(topHeader, /className="[^"]*hidden[^"]*lg:block/);
    assert.match(primaryTopBar, /className="[^"]*lg:hidden/);
  });
});

describe("company create content hierarchy", () => {
  const page = readFileSync(join(srcRoot, "pages", "CompanyCreatePage.tsx"), "utf-8");

  it("keeps required company name clear without marketing explainer overload", () => {
    assert.ok(page.includes("افزودن شرکت"));
    assert.ok(page.includes('label="نام شرکت"'));
    assert.ok(page.includes("required"));
    assert.ok(page.includes("اطلاعات اصلی"));
    assert.ok(page.includes("اطلاعات تکمیلی"));
    assert.ok(page.includes("برای شروع، فقط نام شرکت الزامی است."));
  });

  it("uses a short 2-step flow with side summary and contextual help", () => {
    assert.ok(page.includes('CreateStep = 1 | 2') || page.includes("type CreateStep"));
    assert.ok(page.includes("company-create-steps"));
    assert.ok(page.includes("company-create-side-panel"));
    assert.ok(page.includes("ContextualHelp"));
    assert.ok(page.includes("مثلا metril-tehran"));
    assert.ok(page.includes("suggestCompanySlug"));
    assert.ok(page.includes("ساخت شرکت"));
    assert.ok(page.includes("ادامه"));
    assert.ok(!page.includes("optional-company-slug"));
  });
});

describe("company list summary cards", () => {
  const page = readFileSync(join(srcRoot, "pages", "CompanyListPage.tsx"), "utf-8");
  const card = readFileSync(join(srcRoot, "features", "companies", "CompanySummaryCard.tsx"), "utf-8");
  const meta = readFileSync(join(srcRoot, "features", "companies", "companySummaryMeta.ts"), "utf-8");

  it("keeps a single شرکت‌ها heading and non-duplicated count location", () => {
    assert.equal((page.match(/title="شرکت‌ها"/g) ?? []).length, 1);
    assert.ok(!page.includes("شرکت فعال قابل دسترس"));
    assert.ok(page.includes("headerStatusParts"));
  });

  it("renders navigable company summary cards with real metadata helpers", () => {
    assert.ok(page.includes("CompanySummaryCard"));
    assert.ok(card.includes("ورود به شرکت"));
    assert.ok(card.includes('data-testid="company-card-enter"'));
    assert.ok(card.includes("buildCompanySummaryMeta"));
    assert.ok(meta.includes("legal_name"));
    assert.ok(meta.includes("registration_number"));
    assert.ok(meta.includes("national_id"));
    assert.ok(meta.includes("active_slug"));
    assert.ok(meta.includes("created_at"));
    assert.ok(meta.includes("never exposes internal IDs"));
  });

  it("uses featured one-company layout and responsive multi-company grid", () => {
    assert.ok(page.includes('data-layout={isSingleCompany ? "featured" : "grid"}'));
    assert.ok(page.includes("max-w-[52rem]"));
    assert.ok(page.includes("auto-fill"));
    assert.ok(page.includes("items-stretch"));
    assert.ok(card.includes('layout === "featured"') || card.includes('isFeatured'));
  });

  it("keeps equal-height card architecture with aligned sections", () => {
    assert.ok(card.includes('data-testid="company-summary-card-shell"'));
    assert.ok(card.includes("h-full"));
    assert.ok(card.includes("flex h-full min-h-0 flex-col") || card.includes("flex h-full"));
    assert.ok(card.includes('data-testid="company-card-badges"'));
    assert.ok(card.includes('data-testid="company-card-actions"'));
    assert.ok(card.includes('data-testid="company-card-meta-region"'));
    assert.ok(card.includes("invisible"));
  });

  it("lazy-loads membership enrichment and keeps access on failure", () => {
    assert.ok(card.includes("IntersectionObserver") || card.includes("useBecameVisible"));
    assert.ok(card.includes("useListCompanyMembersQuery"));
    assert.ok(card.includes("membersError"));
    assert.ok(card.includes("تلاش دوباره"));
    assert.ok(card.includes("ورود به شرکت"));
  });

  it("keeps pending invitations as a separate section", () => {
    assert.ok(page.includes("PendingInvitationsSection"));
    assert.ok(page.includes("دعوت در انتظار"));
  });

  it("keeps focus-visible styling on the enter action", () => {
    assert.ok(card.includes("focus-visible:ring-2"));
    assert.ok(card.includes("focus-visible:ring-ui-focus"));
  });
});
