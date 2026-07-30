import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildDemoPurchaseBody,
  formatDemoPurchaseError,
  isDemoCommerceMode,
  isDemoPurchaseAvailable,
  sortTokenPackages
} from "./walletPurchase.ts";

const here = dirname(fileURLToPath(import.meta.url));

function read(rel: string) {
  return readFileSync(join(here, rel), "utf8");
}

describe("demo purchase helpers", () => {
  it("enables Buy only when backend commerce.demo_purchase_available is true", () => {
    assert.equal(
      isDemoPurchaseAvailable({
        demo_purchase_available: true,
        online_payments_enabled: false,
        purchasing_disabled: false,
        mode: "demo"
      }),
      true
    );
    assert.equal(
      isDemoPurchaseAvailable({
        demo_purchase_available: false,
        online_payments_enabled: false,
        purchasing_disabled: true,
        mode: "disabled"
      }),
      false
    );
    assert.equal(
      isDemoPurchaseAvailable({
        demo_purchase_available: true,
        online_payments_enabled: false,
        purchasing_disabled: true,
        mode: "demo"
      }),
      false
    );
  });

  it("detects demo mode from commerce.mode", () => {
    assert.equal(isDemoCommerceMode({ demo_purchase_available: true, online_payments_enabled: false, purchasing_disabled: false, mode: "demo" }), true);
    assert.equal(isDemoCommerceMode({ demo_purchase_available: false, online_payments_enabled: false, purchasing_disabled: true, mode: "production" }), false);
  });

  it("builds request with package_code and idempotency_key only", () => {
    const body = buildDemoPurchaseBody("tokens_5", "buy-abc");
    assert.deepEqual(body, { package_code: "tokens_5", idempotency_key: "buy-abc" });
    assert.equal("price_amount" in body, false);
    assert.equal("token_amount" in body, false);
  });

  it("maps stable purchase errors to concise Persian copy", () => {
    assert.equal(
      formatDemoPurchaseError({ status: 403, data: { code: "DEMO_COMMERCE_DISABLED", detail: "x" } }),
      "خرید آزمایشی در این محیط فعال نیست."
    );
    assert.equal(
      formatDemoPurchaseError({ status: 404, data: { code: "TOKEN_PACKAGE_UNAVAILABLE", detail: "x" } }),
      "این بسته در حال حاضر قابل خرید نیست."
    );
    assert.equal(
      formatDemoPurchaseError({ status: 409, data: { code: "IDEMPOTENCY_KEY_REUSED", detail: "x" } }),
      "درخواست خرید تغییر کرده است؛ دوباره تلاش کنید."
    );
    assert.equal(formatDemoPurchaseError({ status: 500, data: { detail: "boom" } }), "خرید انجام نشد. دوباره تلاش کنید.");
    assert.equal(formatDemoPurchaseError({ status: 500, data: { detail: "boom" } }).includes("boom"), false);
  });

  it("sorts active packages by server display_order", () => {
    const ordered = sortTokenPackages([
      {
        code: "tokens_50",
        title_fa: "بسته ۵۰",
        token_amount: "50",
        price_amount: "2999000",
        currency: "IRR",
        display_order: 30,
        is_active: true
      },
      {
        code: "tokens_5",
        title_fa: "بسته ۵",
        token_amount: "5",
        price_amount: "499000",
        currency: "IRR",
        display_order: 10,
        is_active: true
      },
      {
        code: "tokens_inactive",
        title_fa: "غیرفعال",
        token_amount: "1",
        price_amount: "1",
        currency: "IRR",
        display_order: 1,
        is_active: false
      }
    ]);
    assert.deepEqual(
      ordered.map((p) => p.code),
      ["tokens_5", "tokens_50"]
    );
  });
});

describe("demo purchase wiring", () => {
  const api = read("walletApi.ts");
  const section = read("WalletSection.tsx");
  const chip = read("../../shared/components/TokenBalanceChip.tsx");
  const labels = read("walletTransactionLabels.ts");

  it("posts only package_code and idempotency_key to demo-purchase", () => {
    assert.match(api, /\/api\/payments\/demo-purchase\//);
    assert.match(api, /Idempotent-Replayed/);
    assert.match(api, /idempotent_replayed/);
    assert.match(api, /Wallet.*BALANCE/);
    assert.match(api, /Wallet.*TRANSACTIONS/);
    assert.match(api, /createDemoPurchase/);
    assert.equal(/body:[\s\S]*price_amount/.test(api), false);
    assert.equal(/body:[\s\S]*token_amount/.test(api), false);
  });

  it("WalletSection uses server packages and gates Buy on commerce capability", () => {
    assert.match(section, /token_packages/);
    assert.match(section, /isDemoPurchaseAvailable/);
    assert.match(section, /buildDemoPurchaseBody/);
    assert.match(section, /createPurchaseIdempotencyKey/);
    assert.match(section, /token-purchase-confirm/);
    assert.match(section, /max-h-\[min\(92dvh/);
    assert.match(section, /خرید آنلاین فعلاً فعال نیست/);
    assert.match(section, /آزمایشی/);
    assert.match(section, /تأیید خرید/);
    assert.match(section, /انصراف/);
    assert.match(section, /isPurchasing/);
    assert.equal(section.includes("TOKEN_PACKAGE_DISPLAY_CATALOG"), false);
    assert.equal(section.includes("خرید غیرفعال") || section.includes('purchaseEnabled ? "خرید"'), true);
  });

  it("does not invent local balance updates; header chip stays on wallet query", () => {
    assert.equal(section.includes("balance +"), false);
    assert.equal(section.includes("setBalance"), false);
    assert.match(chip, /useGetTokenWalletQuery/);
    assert.match(chip, /token-balance-chip/);
  });

  it("labels purchase credits as خرید بسته توکن", () => {
    assert.match(labels, /demo_package_credit[\s\S]*خرید بسته توکن/);
    assert.match(labels, /token_package_purchase[\s\S]*خرید بسته توکن/);
  });
});
