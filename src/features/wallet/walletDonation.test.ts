import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const srcRoot = join(import.meta.dirname!, "..", "..");

function read(rel: string) {
  return readFileSync(join(srcRoot, rel), "utf-8");
}

const PERSIAN_ZERO_CODE = "۰".charCodeAt(0);
const ARABIC_ZERO_CODE = "٠".charCodeAt(0);

function normalizePersianDigits(value: string): string {
  return value.replace(/[۰-۹٠-٩]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= PERSIAN_ZERO_CODE && code <= PERSIAN_ZERO_CODE + 9) {
      return String(code - PERSIAN_ZERO_CODE);
    }
    return String(code - ARABIC_ZERO_CODE);
  });
}

function normalizeDonationAmount(value: string): string {
  return normalizePersianDigits(value).trim();
}

function isWholePositiveTokenAmount(value: string): boolean {
  const trimmed = normalizeDonationAmount(value);
  if (!trimmed) return false;
  if (!/^[1-9]\d*$/.test(trimmed)) return false;
  return Number(trimmed) > 0;
}

function validateDonationForm(input: {
  companyId: number | null;
  amount: string;
  personalBalance: string | null | undefined;
}): { ok: true; amount: string } | { ok: false; message: string } {
  if (input.companyId == null || !Number.isInteger(input.companyId) || input.companyId <= 0) {
    return { ok: false, message: "شرکت را انتخاب کنید." };
  }
  const normalized = normalizeDonationAmount(input.amount);
  if (!normalized) return { ok: false, message: "مقدار اهدا را وارد کنید." };
  if (!isWholePositiveTokenAmount(normalized)) {
    return { ok: false, message: "مقدار باید یک عدد صحیح مثبت باشد." };
  }
  const personalBalance = Number(input.personalBalance ?? NaN);
  if (Number.isFinite(personalBalance) && Number(normalized) > personalBalance) {
    return { ok: false, message: "موجودی شخصی برای این اهدا کافی نیست." };
  }
  return { ok: true, amount: normalized };
}

function formatCompanyTokenBadgeLabel(balance: string | null | undefined): string {
  if (balance == null || String(balance).trim() === "") return "شرکت: —";
  const str = String(balance).trim();
  const formatted = str.includes(".") ? str.replace(/\.?0+$/, "") || "0" : str;
  return `شرکت: ${formatted} توکن`;
}

function codeOf(error: unknown): string | null {
  if (typeof error !== "object" || !error || !("data" in error)) return null;
  const data = (error as { data?: { code?: unknown } }).data;
  return typeof data?.code === "string" ? data.code : null;
}

function statusOf(error: unknown): number | string | null {
  if (typeof error !== "object" || !error || !("status" in error)) return null;
  const status = (error as { status?: unknown }).status;
  return typeof status === "number" || typeof status === "string" ? status : null;
}

function formatDonationError(error: unknown): string {
  const code = codeOf(error);
  const status = statusOf(error);
  if (status === 402 && code === "INSUFFICIENT_PERSONAL_TOKEN_BALANCE") {
    return "موجودی توکن کافی نیست.";
  }
  if (status === 403 && code === "COMPANY_MEMBERSHIP_REQUIRED") {
    return "عضویت فعال در این شرکت لازم است.";
  }
  if (status === 400 && code === "INVALID_TOKEN_AMOUNT") {
    return "مقدار باید یک عدد صحیح مثبت باشد.";
  }
  if (status === 409 && code === "IDEMPOTENCY_KEY_REUSED") {
    return "این درخواست قبلاً با محتوای دیگری ثبت شده است. دوباره تلاش کنید.";
  }
  if (status === "FETCH_ERROR" || status === "TIMEOUT_ERROR") {
    return "ارتباط با سرور برقرار نشد. دوباره تلاش کنید.";
  }
  if (status === 404 || status === 503) {
    return "کیف توکن شرکت در دسترس نیست.";
  }
  return "اهدا ناموفق بود. دوباره تلاش کنید.";
}

describe("donation amount validation", () => {
  it("accepts positive whole numbers and Persian digits", () => {
    assert.equal(isWholePositiveTokenAmount("10"), true);
    assert.equal(isWholePositiveTokenAmount("۱۰۰"), true);
    assert.equal(normalizeDonationAmount("۲۵"), "25");
    assert.equal(validateDonationForm({ companyId: 1, amount: "۱۰", personalBalance: "20" }).ok, true);
  });

  it("rejects empty, zero, negative, decimal, and over-balance amounts", () => {
    assert.equal(isWholePositiveTokenAmount(""), false);
    assert.equal(isWholePositiveTokenAmount("0"), false);
    assert.equal(isWholePositiveTokenAmount("۰"), false);
    assert.equal(isWholePositiveTokenAmount("-1"), false);
    assert.equal(isWholePositiveTokenAmount("1.5"), false);
    assert.equal(isWholePositiveTokenAmount("01"), false);
    assert.equal(validateDonationForm({ companyId: null, amount: "5", personalBalance: "10" }).ok, false);
    assert.equal(validateDonationForm({ companyId: 1, amount: "", personalBalance: "10" }).ok, false);
    assert.equal(validateDonationForm({ companyId: 1, amount: "0", personalBalance: "10" }).ok, false);
    assert.equal(validateDonationForm({ companyId: 1, amount: "11", personalBalance: "10" }).ok, false);
  });
});

describe("donation error mapping", () => {
  it("maps known backend codes to concise Persian messages", () => {
    assert.equal(
      formatDonationError({
        status: 402,
        data: { code: "INSUFFICIENT_PERSONAL_TOKEN_BALANCE" }
      }),
      "موجودی توکن کافی نیست."
    );
    assert.equal(
      formatDonationError({
        status: 403,
        data: { code: "COMPANY_MEMBERSHIP_REQUIRED", detail: "Active membership required." }
      }),
      "عضویت فعال در این شرکت لازم است."
    );
    assert.equal(
      formatDonationError({
        status: 400,
        data: { code: "INVALID_TOKEN_AMOUNT", detail: "Amount must be a positive whole number." }
      }),
      "مقدار باید یک عدد صحیح مثبت باشد."
    );
    assert.equal(
      formatDonationError({
        status: 409,
        data: { code: "IDEMPOTENCY_KEY_REUSED", detail: "Key reused." }
      }),
      "این درخواست قبلاً با محتوای دیگری ثبت شده است. دوباره تلاش کنید."
    );
    assert.equal(
      formatDonationError({ status: "FETCH_ERROR", error: "TypeError: Failed to fetch" }),
      "ارتباط با سرور برقرار نشد. دوباره تلاش کنید."
    );
    assert.equal(
      formatDonationError({ status: 404, data: { detail: "Not found" } }),
      "کیف توکن شرکت در دسترس نیست."
    );
  });

  it("never returns raw English HTML or JSON blobs", () => {
    const message = formatDonationError({
      status: 500,
      data: "<html>Internal Server Error</html>"
    });
    assert.ok(!message.includes("<html>"));
    assert.ok(!message.includes("Internal Server Error"));
    assert.ok(!message.includes("{"));
  });
});

describe("company badge label", () => {
  it("formats company-only label without personal wording", () => {
    assert.equal(formatCompanyTokenBadgeLabel("24"), "شرکت: 24 توکن");
    assert.equal(formatCompanyTokenBadgeLabel("0"), "شرکت: 0 توکن");
    assert.equal(formatCompanyTokenBadgeLabel(null), "شرکت: —");
    assert.ok(!formatCompanyTokenBadgeLabel("24").includes("شخصی"));
  });
});

describe("shared donation modal wiring", () => {
  const modal = read("shared/components/DonateTokensModal.tsx");
  const companyWallet = read("shared/components/CompanyWalletSection.tsx");
  const walletSection = read("features/wallet/WalletSection.tsx");
  const donationHelpers = read("features/wallet/walletDonation.ts");
  const badge = read("shared/components/CompanyTokenBadge.tsx");
  const contextHeader = read("features/companies/workspace/WorkspaceListRow.tsx");
  const dashboard = read("pages/CompanyDashboardPage.tsx");
  const walletApi = read("features/wallet/walletApi.ts");
  const chip = read("shared/components/TokenBalanceChip.tsx");
  const topHeader = read("shared/components/TopHeader.tsx");
  const primaryTopBar = read("shared/components/PrimaryTopBar.tsx");
  const settings = read("pages/AccountSettingsPage.tsx");
  const companyList = read("pages/CompanyListPage.tsx");

  it("uses one shared DonateTokensModal from company and account settings", () => {
    assert.ok(modal.includes('id="donate-tokens-title"'));
    assert.ok(modal.includes("اهدای توکن به شرکت"));
    assert.ok(modal.includes("DONATION_TRANSFER_NOTICE"));
    assert.ok(modal.includes("DONATION_SUCCESS_TOAST"));
    assert.ok(
      donationHelpers.includes(
        "توکن‌های اهداشده به کیف شرکت منتقل می‌شوند و از موجودی شخصی شما کسر خواهند شد."
      )
    );
    assert.ok(donationHelpers.includes("توکن‌ها با موفقیت به کیف شرکت منتقل شدند."));
    assert.ok(modal.includes("lockedCompanyId"));
    assert.ok(modal.includes("company.is_active"));
    assert.ok(modal.includes("selectableCompanies.length === 1"));
    assert.ok(modal.includes("idempotency_key"));
    assert.ok(modal.includes("disabled={pending}"));
    assert.ok(companyWallet.includes("DonateTokensModal"));
    assert.ok(companyWallet.includes("lockedCompanyId={companyId}"));
    assert.ok(walletSection.includes("DonateTokensModal"));
    assert.ok(walletSection.includes("account-donate-tokens"));
    assert.ok(walletSection.includes("اهدای توکن به شرکت"));
  });

  it("locks company selector from company settings and keeps employee donation open", () => {
    assert.ok(companyWallet.includes("اهدای توکن"));
    assert.ok(!companyWallet.includes("canManage"));
    assert.ok(companyWallet.includes("donation_allowed"));
    assert.ok(modal.includes("companyLocked"));
  });

  it("shows company token badge only in active company workspace header", () => {
    assert.ok(badge.includes("useGetCompanyTokenWalletQuery"));
    assert.ok(badge.includes("company-token-badge"));
    assert.ok(badge.includes("موجودی توکن شرکت"));
    assert.ok(badge.includes("bg-sky-400/15"));
    assert.ok(contextHeader.includes("CompanyTokenBadge"));
    assert.ok(contextHeader.includes("companyId"));
    assert.ok(dashboard.includes("companyId={company.id}"));
    assert.ok(!companyList.includes("CompanyTokenBadge"));
    assert.ok(!settings.includes("CompanyTokenBadge"));
    assert.ok(!topHeader.includes("CompanyTokenBadge"));
    assert.ok(!primaryTopBar.includes("CompanyTokenBadge"));
  });

  it("keeps personal and company header chips visually distinct", () => {
    assert.ok(chip.includes("موجودی توکن شخصی"));
    assert.ok(chip.includes("bg-amber-400/20"));
    assert.ok(badge.includes("bg-sky-400/15"));
    assert.ok(!badge.includes("bg-amber-400/20"));
    assert.ok(!chip.includes("CompanyToken"));
  });

  it("invalidates personal and company wallet caches on donation success only", () => {
    assert.ok(walletApi.includes("CompanyTokenDonationResult"));
    assert.ok(walletApi.includes("Idempotent-Replayed"));
    assert.ok(walletApi.includes('{ type: "Wallet", id: "BALANCE" }'));
    assert.ok(walletApi.includes('{ type: "CompanyWallet", id: companyId }'));
    assert.ok(walletApi.includes("invalidatesTags: (_result, error, { companyId })"));
    assert.ok(!companyWallet.includes("setBalance"));
    assert.ok(!modal.includes("optimistic"));
  });

  it("has no company withdrawal UI", () => {
    assert.ok(!companyWallet.toLowerCase().includes("withdraw"));
    assert.ok(!modal.toLowerCase().includes("withdraw"));
    assert.ok(!companyWallet.includes("برداشت از شرکت"));
    assert.ok(!modal.includes("برداشت از شرکت"));
  });

  it("production helpers live in walletDonation.ts", () => {
    assert.ok(donationHelpers.includes("export function validateDonationForm"));
    assert.ok(donationHelpers.includes("export function formatDonationError"));
    assert.ok(donationHelpers.includes("INSUFFICIENT_PERSONAL_TOKEN_BALANCE"));
    assert.ok(donationHelpers.includes("normalizeNumberInput"));
  });
});
