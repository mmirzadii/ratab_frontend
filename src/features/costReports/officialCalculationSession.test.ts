import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const srcRoot = join(import.meta.dirname!, "..");

const financialApi = readFileSync(
  join(srcRoot, "financialDocuments", "financialDocumentApi.ts"),
  "utf-8"
);
const modal = readFileSync(
  join(srcRoot, "costReports", "components", "ItemDetailModal.tsx"),
  "utf-8"
);
const calculationSection = readFileSync(
  join(srcRoot, "costReports", "components", "CalculationSection.tsx"),
  "utf-8"
);

describe("financialDocumentApi official calculation session endpoint", () => {
  it("exposes OfficialCalculationSession / OfficialCalculationSessionCreateRequest types", () => {
    assert.ok(financialApi.includes("OfficialCalculationSession"));
    assert.ok(financialApi.includes("OfficialCalculationSessionCreateRequest"));
  });

  it("adds a createOfficialCalculationSession mutation posting to .../official-calculation-sessions/", () => {
    assert.ok(financialApi.includes("createOfficialCalculationSession: builder.mutation"));
    assert.match(
      financialApi,
      /url:\s*`\/api\/financial-documents\/\$\{documentId\}\/official-calculation-sessions\/`/
    );
    assert.ok(financialApi.includes("useCreateOfficialCalculationSessionMutation"));
  });

  it("does not invalidate wallet tags when opening a session (opening is free)", () => {
    const start = financialApi.indexOf("createOfficialCalculationSession: builder.mutation");
    const end = financialApi.indexOf("createOfficialCalculation: builder.mutation");
    assert.ok(start !== -1 && end !== -1 && end > start);
    const sessionEndpointSource = financialApi.slice(start, end);
    assert.ok(!sessionEndpointSource.includes("Wallet"));
    assert.ok(!sessionEndpointSource.includes("CompanyWallet"));
  });

  it("only refreshes wallets on createOfficialCalculation when applied_cost was actually charged", () => {
    const start = financialApi.indexOf("createOfficialCalculation: builder.mutation");
    const end = financialApi.indexOf("createStarredCalculation: builder.mutation");
    assert.ok(start !== -1 && end !== -1 && end > start);
    const officialCalcSource = financialApi.slice(start, end);
    assert.ok(officialCalcSource.includes("Number(result.billing.applied_cost) > 0"));
    assert.ok(officialCalcSource.includes('{ type: "Wallet", id: "BALANCE" }'));
    assert.ok(officialCalcSource.includes('{ type: "CompanyWallet" }'));
  });
});

describe("ItemDetailModal session lifecycle", () => {
  it("creates a session once per document/item pair when the modal opens (not on close)", () => {
    assert.ok(modal.includes("createOfficialCalculationSession({"));
    assert.ok(modal.includes("body: { pricebook_item_id: item.id }"));
    assert.match(modal, /\},\s*\[document\?\.id,\s*item\.id,\s*documentLocked\]\);/);
  });

  it("clears the session id, pending timer, and in-flight request on cleanup", () => {
    const effectStart = modal.indexOf("Session lifecycle: open a free modal session");
    assert.ok(effectStart !== -1);
    const effectSource = modal.slice(effectStart, effectStart + 1800);
    assert.ok(effectSource.includes("return () => {"));
    assert.ok(effectSource.includes("calculationSessionIdRef.current = null"));
    assert.ok(effectSource.includes("setCalculationSessionId(null)"));
    assert.ok(effectSource.includes("clearPendingAutoTimer()"));
    assert.ok(effectSource.includes("inFlightPayloadKeyRef.current = null"));
  });

  it("does not call official-calculations merely because the modal opened", () => {
    // Opening only creates the free session; the paid endpoint fires from the debounced
    // auto-calc effect / forced Add path, never directly inside the session effect.
    const effectStart = modal.indexOf("Session lifecycle: open a free modal session");
    const effectEnd = modal.indexOf("const buildCalculationPayload = useCallback");
    assert.ok(effectStart !== -1 && effectEnd !== -1 && effectEnd > effectStart);
    const sessionEffectSource = modal.slice(effectStart, effectEnd);
    assert.ok(!sessionEffectSource.includes("createOfficialCalculation("));
    assert.ok(sessionEffectSource.includes("createOfficialCalculationSession("));
  });
});

describe("ItemDetailModal auto calculation debounce", () => {
  it("debounces exactly 500ms via AUTO_CALCULATION_DEBOUNCE_MS", () => {
    assert.match(modal, /const AUTO_CALCULATION_DEBOUNCE_MS\s*=\s*500;/);
    assert.ok(modal.includes("pendingAutoTimerRef.current = window.setTimeout"));
    assert.ok(modal.includes("AUTO_CALCULATION_DEBOUNCE_MS"));
  });

  it("guards against duplicate in-flight requests for the same payload", () => {
    assert.ok(modal.includes("inFlightPayloadKeyRef"));
    assert.ok(modal.includes("inFlightPromiseRef"));
    assert.ok(
      modal.includes(
        "if (inFlightPayloadKeyRef.current === payload.key && inFlightPromiseRef.current)"
      )
    );
  });

  it("uses a request id to ignore stale responses", () => {
    assert.ok(modal.includes("latestRequestIdRef"));
    assert.ok(modal.includes("const requestId = ++latestRequestIdRef.current"));
    assert.ok(modal.includes("latestRequestIdRef.current !== requestId"));
  });

  it("skips scheduling when a matching ready result and receipt already exist", () => {
    assert.ok(modal.includes("hasMatchingReadyReceipt"));
  });
});

describe("CalculationSection has no manual Calculate button", () => {
  it("does not render a standalone محاسبه button and forms only preventDefault", () => {
    const standaloneCalculateButtonLine = calculationSection
      .split("\n")
      .some((line) => line.trim() === "محاسبه");
    assert.equal(standaloneCalculateButtonLine, false);
    assert.ok(!calculationSection.includes("onCalculate"));
    assert.match(calculationSection, /event\.preventDefault\(\);\s*\}\}/);
  });

  it("keeps the status dot, inputs, and billing breakdown display", () => {
    assert.ok(calculationSection.includes("calculationStatusDot"));
    assert.ok(calculationSection.includes("billingBreakdown"));
    assert.ok(calculationSection.includes("renderInputField"));
  });
});
