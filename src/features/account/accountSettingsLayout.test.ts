import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  formatAttachmentLimitFa,
  formatPlanPriceFa,
  looksLikeEnglishBackendText
} from "./accountDisplay.ts";
import {
  ACCOUNT_SETTINGS_TABS,
  parseAccountSettingsTab
} from "./accountSettingsTabs.ts";

const srcRoot = join(import.meta.dirname!, "..", "..");

describe("account settings tabs", () => {
  it("parses tab query values including aliases", () => {
    assert.equal(parseAccountSettingsTab("account"), "account");
    assert.equal(parseAccountSettingsTab("tokens"), "tokens");
    assert.equal(parseAccountSettingsTab("wallet"), "tokens");
    assert.equal(parseAccountSettingsTab("subscription"), "subscription");
    assert.equal(parseAccountSettingsTab("quota"), "subscription");
    assert.equal(parseAccountSettingsTab(null), "account");
    assert.equal(parseAccountSettingsTab("nope"), "account");
  });

  it("exposes three stable tabs", () => {
    assert.deepEqual([...ACCOUNT_SETTINGS_TABS], ["account", "tokens", "subscription"]);
  });
});

describe("account settings page layout", () => {
  const page = readFileSync(join(srcRoot, "pages", "AccountSettingsPage.tsx"), "utf-8");
  const wallet = readFileSync(join(srcRoot, "features", "wallet", "WalletSection.tsx"), "utf-8");
  const subscription = readFileSync(
    join(srcRoot, "features", "subscription", "SubscriptionSection.tsx"),
    "utf-8"
  );

  it("uses wide dashboard width instead of narrow stacked column", () => {
    assert.ok(page.includes("max-w-[1240px]"));
    assert.ok(!page.includes("max-w-2xl"));
    assert.ok(page.includes('searchParams.get("tab")'));
    assert.ok(page.includes("role=\"tablist\""));
  });

  it("summary strip covers plan, quota, and status without duplicating header token", () => {
    assert.ok(page.includes("اشتراک مؤثر"));
    assert.ok(page.includes("پیام امروز"));
    assert.ok(page.includes("وضعیت حساب"));
    assert.ok(page.includes("grid-cols-3"));
    assert.ok(!page.includes('label="موجودی"'));
    assert.ok(page.includes("useGetSubscriptionQuery"));
    assert.ok(page.includes("useGetMessageQuotaQuery"));
  });

  it("keeps circular avatar and theme toggle without a header token chip", () => {
    assert.ok(page.includes("rounded-full"));
    assert.ok(page.includes("userInitials"));
    assert.ok(page.includes("ThemeToggle"));
    assert.ok(!page.includes("Coins"));
    assert.ok(!page.includes("TokenBalanceChip"));
    assert.ok(!page.includes("useGetTokenWalletQuery"));
    assert.ok(!page.includes("موجودی توکن"));
  });

  it("does not stack wallet and subscription under account on the same view", () => {
    assert.ok(page.includes('activeTab === "tokens"'));
    assert.ok(page.includes('activeTab === "subscription"'));
    assert.ok(page.includes('activeTab === "account"'));
  });

  it("token tab shows server packages, donation action, and collapsible history", () => {
    assert.ok(wallet.includes("token_packages"));
    assert.ok(wallet.includes("isDemoPurchaseAvailable"));
    assert.ok(wallet.includes("بسته‌های خرید توکن"));
    assert.ok(wallet.includes("اهدای توکن به شرکت"));
    assert.ok(wallet.includes("DonateTokensModal"));
    assert.ok(wallet.includes("تاریخچه تراکنش‌ها"));
    assert.ok(wallet.includes("historyOpen"));
    assert.ok(wallet.includes("aria-expanded"));
    assert.ok(wallet.includes("skip: !historyOpen"));
    assert.ok(!wallet.includes("transaction.reason"));
    assert.ok(wallet.includes("getTransactionTitle"));
    assert.ok(!wallet.includes("TOKEN_PACKAGE_DISPLAY_CATALOG"));
  });

  it("subscription marks current plan from effective code only", () => {
    assert.ok(subscription.includes("getCurrentPlanCode"));
    assert.ok(subscription.includes("plan.code === currentPlanCode"));
    assert.ok(subscription.includes("formatPlanPriceFa"));
    assert.ok(!subscription.includes("{plan.code}</"));
  });

  it("isolates wallet and subscription error surfaces", () => {
    assert.ok(wallet.includes("walletError"));
    assert.ok(wallet.includes("transactionsError"));
    assert.ok(subscription.includes("subscriptionError"));
    assert.ok(subscription.includes("plansError"));
    assert.ok(subscription.includes("quotaError"));
  });
});

describe("token packages come from wallet commerce payload", () => {
  it("WalletSection reads token_packages instead of a hardcoded catalog", () => {
    const wallet = readFileSync(join(srcRoot, "features", "wallet", "WalletSection.tsx"), "utf-8");
    assert.ok(wallet.includes("wallet?.token_packages"));
    assert.ok(wallet.includes("createDemoPurchase"));
  });
});

describe("account display helpers", () => {
  it("formats IRR plan prices as تومان and free zero amounts", () => {
    assert.equal(formatPlanPriceFa("0", "IRR"), "رایگان");
    assert.equal(formatPlanPriceFa("299000", "IRR"), "299,000 تومان");
  });

  it("formats attachment limits without English units alone", () => {
    assert.equal(formatAttachmentLimitFa(10485760), "10 مگابایت");
    assert.equal(formatAttachmentLimitFa(null), "بدون سقف پیوست");
  });

  it("detects English backend prose", () => {
    assert.equal(looksLikeEnglishBackendText("Official pricebook-backed financial document line"), true);
    assert.equal(looksLikeEnglishBackendText("محاسبه آیتم"), false);
  });
});
