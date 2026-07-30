import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const srcRoot = join(import.meta.dirname!, "..", "..");

describe("InsufficientTokenModal", () => {
  const modal = readFileSync(
    join(srcRoot, "shared", "components", "InsufficientTokenModal.tsx"),
    "utf-8"
  );
  const accountPage = readFileSync(join(srcRoot, "pages", "AccountSettingsPage.tsx"), "utf-8");
  const tabs = readFileSync(
    join(srcRoot, "features", "account", "accountSettingsTabs.ts"),
    "utf-8"
  );

  it("uses approved Persian title, message, and actions", () => {
    assert.ok(modal.includes("توکن کافی نیست"));
    assert.ok(modal.includes("برای محاسبه و افزودن این آیتم، توکن کافی ندارید."));
    assert.ok(modal.includes("خرید توکن"));
    assert.ok(modal.includes("انصراف"));
    assert.ok(modal.includes("موردنیاز"));
    assert.ok(modal.includes("موجودی کل"));
    assert.ok(modal.includes("حساب شخصی"));
    assert.ok(modal.includes("کیف شرکت"));
  });

  it("navigates to Account Settings Token tab and does not auto-retry billing", () => {
    assert.ok(modal.includes('navigate("/settings?tab=tokens"'));
    assert.ok(modal.includes("insufficientTokenOrigin"));
    assert.ok(!modal.includes("createOfficialCalculation"));
    assert.ok(!modal.includes("runPaidCalculation"));
    assert.ok(!modal.includes("createFinancialDocumentLine"));
  });

  it("keeps mobile sheet / desktop dialog layout without raw English errors", () => {
    assert.ok(modal.includes("items-end"));
    assert.ok(modal.includes("sm:items-center"));
    assert.ok(modal.includes("rounded-t-2xl"));
    assert.ok(modal.includes("safe-area-inset-bottom"));
    assert.ok(!modal.includes("INSUFFICIENT_COMBINED_TOKEN_BALANCE"));
    assert.ok(modal.includes("موردنیاز"));
    assert.ok(modal.includes("formatDecimal(error.required_tokens)"));
  });

  it("Token tab selection comes from stable ?tab= query and survives refresh", () => {
    assert.ok(accountPage.includes('searchParams.get("tab")'));
    assert.ok(accountPage.includes("parseAccountSettingsTab"));
    assert.ok(tabs.includes('"tokens"'));
    assert.ok(tabs.includes("wallet"));
  });

  it("ItemDetailModal only opens this dialog from the Add action, never automatically on a background 402", () => {
    const itemDetailModal = readFileSync(
      join(srcRoot, "features", "costReports", "components", "ItemDetailModal.tsx"),
      "utf-8"
    );
    assert.ok(itemDetailModal.includes("showPurchaseModal"));
    assert.ok(itemDetailModal.includes("showPurchaseModal && insufficientBalance"));
    assert.ok(itemDetailModal.includes("setShowPurchaseModal(true)"));

    const executeCalcStart = itemDetailModal.indexOf(
      "const executeCalculation = useCallback"
    );
    const executeCalcEnd = itemDetailModal.indexOf("const handleAddLine = useCallback");
    const executeCalcSource = itemDetailModal.slice(executeCalcStart, executeCalcEnd);
    assert.ok(executeCalcSource.includes("setInsufficientBalance"));
    assert.ok(!executeCalcSource.includes("setShowPurchaseModal"));
  });
});
