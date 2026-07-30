import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatSignedTokenAmount,
  getTransactionTitle,
  getTransactionTypeLabel,
  isTokenCreditAmount
} from "./walletTransactionLabels.ts";

describe("wallet transaction Persian labels", () => {
  it("maps stable types to concise Persian titles", () => {
    assert.equal(getTransactionTypeLabel("initial_grant"), "اعتبار اولیه ثبت‌نام");
    assert.equal(getTransactionTypeLabel("manual_grant"), "اصلاح توسط مدیر سیستم");
    assert.equal(getTransactionTypeLabel("token_package_purchase"), "خرید بسته توکن");
    assert.equal(getTransactionTypeLabel("demo_package_credit"), "خرید بسته توکن");
    assert.equal(getTransactionTypeLabel("company_donation_debit"), "اهدای توکن به شرکت");
    assert.equal(getTransactionTypeLabel("pricebook_line_usage"), "شارژ تاریخی ثبت ردیف");
  });

  it("distinguishes official vs starred calculation from reason without exposing English", () => {
    assert.equal(
      getTransactionTitle({
        transaction_type: "calculation_usage",
        reason: "Official pricebook-backed calculation"
      }),
      "محاسبه آیتم فهرست‌بها"
    );
    assert.equal(
      getTransactionTitle({
        transaction_type: "calculation_usage",
        reason: "Starred item calculation"
      }),
      "محاسبه آیتم ستاره‌دار"
    );
    assert.equal(
      getTransactionTitle({
        transaction_type: "pricebook_line_usage",
        reason: "Official pricebook-backed financial document line"
      }),
      "شارژ تاریخی ثبت ردیف"
    );
  });

  it("keeps credit and debit distinguishable beyond color", () => {
    assert.equal(isTokenCreditAmount("15"), true);
    assert.equal(isTokenCreditAmount("-2"), false);
    assert.equal(formatSignedTokenAmount("15"), "+15");
    assert.equal(formatSignedTokenAmount("-2"), "-2");
  });

  it("never returns raw English enum values as labels", () => {
    assert.equal(getTransactionTypeLabel("unknown_future_type"), "تراکنش توکن");
    assert.ok(!getTransactionTypeLabel("initial_grant").includes("Initial"));
  });
});
