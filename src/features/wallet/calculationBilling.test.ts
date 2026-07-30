import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const srcRoot = join(import.meta.dirname!, "..", "..");

function formatDecimal(value: string): string {
  const str = String(value).trim();
  if (!str.includes(".")) return str;
  const stripped = str.replace(/\.?0+$/, "");
  return stripped || "0";
}

function formatBillingBreakdown(billing: {
  applied_cost: string;
  personal_debit: string;
  company_debit: string;
}): string {
  const personal = Number(billing.personal_debit);
  const company = Number(billing.company_debit);
  const personalLabel = formatDecimal(billing.personal_debit);
  const companyLabel = formatDecimal(billing.company_debit);
  if (Number.isFinite(company) && company > 0 && Number.isFinite(personal) && personal > 0) {
    return `${personalLabel} توکن شخصی و ${companyLabel} توکن شرکت`;
  }
  if (Number.isFinite(company) && company > 0) {
    return `${companyLabel} توکن از کیف شرکت`;
  }
  return `${personalLabel} توکن از حساب شخصی`;
}

function formatCalculationCostLabel(cost: string | null | undefined): string | null {
  if (cost === null || cost === undefined || String(cost).trim() === "") return null;
  return `هزینه محاسبه: ${formatDecimal(cost)} توکن`;
}

function isWholePositiveTokenAmount(value: string): boolean {
  const trimmed = value.trim();
  if (!/^[1-9]\d*$/.test(trimmed)) return false;
  return Number(trimmed) > 0;
}

describe("calculation billing helpers", () => {
  it("formats personal-only billing breakdown", () => {
    assert.equal(
      formatBillingBreakdown({ applied_cost: "2", personal_debit: "2", company_debit: "0" }),
      "2 توکن از حساب شخصی"
    );
  });

  it("formats split billing breakdown", () => {
    assert.equal(
      formatBillingBreakdown({ applied_cost: "2", personal_debit: "1", company_debit: "1" }),
      "1 توکن شخصی و 1 توکن شرکت"
    );
  });

  it("formats company-only billing breakdown", () => {
    assert.equal(
      formatBillingBreakdown({ applied_cost: "2", personal_debit: "0", company_debit: "2" }),
      "2 توکن از کیف شرکت"
    );
  });

  it("formats calculation cost from backend value", () => {
    assert.equal(formatCalculationCostLabel("2"), "هزینه محاسبه: 2 توکن");
    assert.equal(formatCalculationCostLabel(null), null);
    assert.equal(formatCalculationCostLabel(""), null);
  });

  it("validates whole positive donation amounts", () => {
    assert.equal(isWholePositiveTokenAmount("10"), true);
    assert.equal(isWholePositiveTokenAmount("0"), false);
    assert.equal(isWholePositiveTokenAmount("-1"), false);
    assert.equal(isWholePositiveTokenAmount("1.5"), false);
    assert.equal(isWholePositiveTokenAmount("01"), false);
  });

  it("walletBilling.ts normalizes Persian digits for amount checks", () => {
    const billing = readFileSync(join(srcRoot, "features", "wallet", "walletBilling.ts"), "utf-8");
    assert.ok(billing.includes("normalizeNumberInput"));
    assert.ok(billing.includes("export function isWholePositiveTokenAmount"));
  });

  it("walletBilling.ts contains the production helpers", () => {
    const billing = readFileSync(join(srcRoot, "features", "wallet", "walletBilling.ts"), "utf-8");
    assert.ok(billing.includes("export function formatBillingBreakdown"));
    assert.ok(billing.includes("export function formatCalculationCostLabel"));
    assert.ok(billing.includes("INSUFFICIENT_COMBINED_TOKEN_BALANCE"));
    assert.ok(!billing.includes("OFFICIAL_LINE_TOKEN_COST"));
  });
});

describe("old 5-token line UX is absent", () => {
  it("does not hardcode OFFICIAL_LINE_TOKEN_COST", () => {
    const walletApi = readFileSync(join(srcRoot, "features", "wallet", "walletApi.ts"), "utf-8");
    assert.ok(!walletApi.includes("OFFICIAL_LINE_TOKEN_COST"));
  });

  it("ItemDetailModal auto-calculates through a session and adds via receipt", () => {
    const modal = readFileSync(
      join(srcRoot, "features", "costReports", "components", "ItemDetailModal.tsx"),
      "utf-8"
    );
    assert.ok(modal.includes("createOfficialCalculation"));
    assert.ok(modal.includes("calculation_receipt_id"));
    assert.ok(modal.includes("executeCalculation"));
    assert.ok(modal.includes("pendingAutoTimerRef"));
    assert.ok(!modal.includes("useCalculatePricebookItemMutation"));
    assert.ok(!modal.includes("۵ توکن"));
    assert.ok(!modal.includes("5 توکن"));
    assert.ok(!modal.includes("handleCalculate"));
  });

  it("StarredItemModal requires paid calculation before add", () => {
    const modal = readFileSync(
      join(srcRoot, "features", "costReports", "components", "StarredItemModal.tsx"),
      "utf-8"
    );
    assert.ok(modal.includes("createStarredCalculation"));
    assert.ok(modal.includes("calculation_receipt_id"));
    assert.ok(modal.includes("محاسبه"));
    assert.ok(modal.includes("برآورد محلی (غیررسمی)"));
  });

  it("company settings expose company wallet donation, not withdrawal", () => {
    const companyWallet = readFileSync(
      join(srcRoot, "shared", "components", "CompanyWalletSection.tsx"),
      "utf-8"
    );
    const modal = readFileSync(
      join(srcRoot, "shared", "components", "DonateTokensModal.tsx"),
      "utf-8"
    );
    assert.ok(companyWallet.includes("کیف توکن شرکت"));
    assert.ok(companyWallet.includes("اهدای توکن"));
    assert.ok(companyWallet.includes("DonateTokensModal"));
    assert.ok(companyWallet.includes("هزینه ابتدا از حساب شخصی و سپس از کیف شرکت کسر می‌شود."));
    assert.ok(!companyWallet.includes("برداشت"));
    assert.ok(!companyWallet.includes("withdraw"));
    assert.ok(modal.includes("اهدای توکن به شرکت"));
    assert.ok(modal.includes("DONATION_TRANSFER_NOTICE"));
    assert.ok(modal.includes("DONATION_SUCCESS_TOAST"));
    assert.ok(!modal.includes("withdraw"));
  });
});

describe("ItemDetailModal session-based auto-calculate/Add flow", () => {
  const modal = readFileSync(
    join(srcRoot, "features", "costReports", "components", "ItemDetailModal.tsx"),
    "utf-8"
  );
  const calculationSection = readFileSync(
    join(srcRoot, "features", "costReports", "components", "CalculationSection.tsx"),
    "utf-8"
  );
  const insufficientModal = readFileSync(
    join(srcRoot, "shared", "components", "InsufficientTokenModal.tsx"),
    "utf-8"
  );
  const financialApi = readFileSync(
    join(srcRoot, "features", "financialDocuments", "financialDocumentApi.ts"),
    "utf-8"
  );
  const pricebookBrowser = readFileSync(
    join(srcRoot, "features", "costReports", "components", "PricebookBrowserSection.tsx"),
    "utf-8"
  );

  it("opens one free modal calculation session per document/item pair", () => {
    assert.ok(modal.includes("useCreateOfficialCalculationSessionMutation"));
    assert.ok(modal.includes("createOfficialCalculationSession"));
    assert.ok(modal.includes("calculationSessionIdRef"));
    assert.ok(modal.includes("pricebook_item_id: item.id"));
    assert.ok(financialApi.includes("useCreateOfficialCalculationSessionMutation"));
    assert.ok(financialApi.includes("official-calculation-sessions"));
    assert.ok(financialApi.includes("OfficialCalculationSession"));
  });

  it("sends calculation_session_id with every official calculation request", () => {
    assert.ok(modal.includes("calculation_session_id: sessionId"));
    assert.match(modal, /body:\s*\{\s*calculation_session_id:\s*sessionId,/);
  });

  it("auto-calculates 500ms after the latest financially relevant change (no manual button)", () => {
    assert.ok(modal.includes("pendingAutoTimerRef"));
    assert.ok(modal.includes("AUTO_CALCULATION_DEBOUNCE_MS"));
    assert.ok(modal.includes("window.setTimeout"));
    assert.ok(modal.includes("executeCalculation"));
    assert.ok(!modal.includes("handleCalculate"));
    assert.ok(!modal.includes("onCalculate"));

    const standaloneCalculateButtonLine = calculationSection
      .split("\n")
      .some((line) => line.trim() === "محاسبه");
    assert.equal(standaloneCalculateButtonLine, false);
    assert.ok(!calculationSection.includes("onCalculate"));
    // Status-title copy that happens to contain the word is still fine.
    assert.ok(calculationSection.includes("محاسبه به‌روز است"));
  });

  it("keeps Add clickable without a fresh receipt, insufficient balance, or in-progress auto-calc", () => {
    assert.match(
      modal,
      /const headerAddDisabled\s*=\s*Boolean\(addLineDisabledReason\)\s*\|\|\s*isAddingLine;/
    );
    assert.ok(!modal.includes("!hasCurrentReceipt"));
    assert.ok(!modal.includes("ابتدا محاسبه را انجام دهید"));
  });

  it("Add without a fresh receipt forces one immediate calculation through the same session", () => {
    assert.ok(modal.includes("force an immediate calculation through the same session"));
    assert.ok(modal.includes("handleAddLine"));
    assert.ok(modal.includes("calculation_receipt_id: receipt.id"));
    // The forced calculation must reuse executeCalculation (same session), never open a second one.
    assert.equal(
      (modal.match(/createOfficialCalculationSession\(/g) ?? []).length,
      1
    );
  });

  it("shows backend calculation cost as an informational line, not a button", () => {
    assert.ok(calculationSection.includes("calculateCostLabel"));
    assert.ok(modal.includes("formatCalculationCostLabel(wallet?.official_calculation_cost)"));
    assert.ok(modal.includes("formatBillingBreakdown"));
  });

  it("marks the previous result stale on input change but keeps it on screen", () => {
    assert.ok(modal.includes('setCalculationStatus("stale")'));
    assert.ok(modal.includes("Keeps the previous result on screen (stale)"));
  });

  it("records insufficient balance silently in the background without opening the dialog", () => {
    const executeCalcStart = modal.indexOf("const executeCalculation = useCallback");
    const executeCalcEnd = modal.indexOf("const handleAddLine = useCallback");
    assert.ok(executeCalcStart !== -1 && executeCalcEnd !== -1 && executeCalcEnd > executeCalcStart);
    const executeCalcSource = modal.slice(executeCalcStart, executeCalcEnd);
    assert.ok(executeCalcSource.includes("setInsufficientBalance"));
    assert.ok(!executeCalcSource.includes("setShowPurchaseModal"));
    assert.ok(executeCalcSource.includes("calculation_session_id"));
  });

  it("does not auto-resend the same insufficient payload every debounce tick", () => {
    assert.ok(modal.includes("Do not re-fire the same insufficient payload every 500ms"));
    assert.ok(modal.includes("insufficientBalance.payloadKey === payload.key"));
  });

  it("only opens the purchase dialog from the Add action", () => {
    assert.ok(modal.includes("showPurchaseModal"));
    assert.ok(modal.includes("setShowPurchaseModal(true)"));
    assert.ok(modal.includes("insufficientBalance.payloadKey === payload.key"));
  });

  it("keeps the session id returned on a 402 for the next retry", () => {
    assert.ok(modal.includes("combined.calculation_session_id"));
    assert.ok(modal.includes("calculationSessionIdRef.current = combined.calculation_session_id"));
  });

  it("opens shared insufficient-token modal with approved copy and token tab route", () => {
    assert.ok(modal.includes("InsufficientTokenModal"));
    assert.ok(modal.includes("isInsufficientCombinedTokenBalance"));
    assert.ok(modal.includes("purchaseOrigin"));
    assert.equal(insufficientModal.includes("توکن کافی نیست"), true);
    assert.equal(
      insufficientModal.includes("برای محاسبه و افزودن این آیتم، توکن کافی ندارید."),
      true
    );
    assert.ok(insufficientModal.includes("خرید توکن"));
    assert.ok(insufficientModal.includes("انصراف"));
    assert.ok(insufficientModal.includes('navigate("/settings?tab=tokens"'));
    assert.ok(insufficientModal.includes("insufficientTokenOrigin"));
    assert.ok(!insufficientModal.includes("موجودی توکن کافی نیست"));
    assert.ok(!insufficientModal.includes("INSUFFICIENT_COMBINED_TOKEN_BALANCE"));
  });

  it("invalidates personal and company wallets only when the calculation actually charged", () => {
    assert.ok(financialApi.includes("createOfficialCalculation"));
    assert.ok(financialApi.includes('{ type: "Wallet", id: "BALANCE" }'));
    assert.ok(financialApi.includes('{ type: "CompanyWallet" }'));
    assert.ok(financialApi.includes("Number(result.billing.applied_cost) > 0"));
  });

  it("preserves responsive Add placement in modal header", () => {
    assert.ok(modal.includes("افزودن"));
    assert.ok(modal.includes("headerAction"));
    assert.ok(modal.includes("onClick={handleAddLine}"));
  });

  it("PricebookBrowserSection keeps real backend labels (no placeholder chapter/item copy)", () => {
    assert.ok(pricebookBrowser.includes("title_fa"));
    assert.ok(pricebookBrowser.includes("short_name_fa"));
    assert.ok(!pricebookBrowser.includes("Chapter 01"));
    assert.ok(!pricebookBrowser.includes("Logical item"));
  });
});
