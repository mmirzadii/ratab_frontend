import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const srcRoot = join(import.meta.dirname!, "..", "..");

function read(rel: string) {
  return readFileSync(join(srcRoot, rel), "utf-8");
}

describe("token balance chip — single shell indicator", () => {
  const chip = read("shared/components/TokenBalanceChip.tsx");
  const topHeader = read("shared/components/TopHeader.tsx");
  const primaryTopBar = read("shared/components/PrimaryTopBar.tsx");
  const settings = read("pages/AccountSettingsPage.tsx");
  const walletApi = read("features/wallet/walletApi.ts");
  const authApi = read("features/auth/authApi.ts");
  const financialApi = read("features/financialDocuments/financialDocumentApi.ts");

  it("shared chip uses wallet query, preferred gold styling, and توکن label", () => {
    assert.ok(chip.includes("useGetTokenWalletQuery"));
    assert.ok(chip.includes("data-tour=\"token-balance-chip\""));
    assert.ok(chip.includes("توکن"));
    assert.ok(chip.includes("Coins"));
    assert.ok(chip.includes("bg-ui-token-soft"));
    assert.ok(chip.includes("text-ui-token"));
    assert.ok(chip.includes('to="/settings?tab=tokens"'));
    assert.ok(chip.includes("min-w-[5.75rem]"));
    assert.ok(chip.includes("isError"));
  });

  it("error/loading states never invent a fake zero balance", () => {
    assert.ok(chip.includes('isError ? "—"'));
    assert.ok(chip.includes('amountLabel ?? "…"'));
    assert.ok(!chip.includes('formatDecimal(0)'));
    assert.ok(!chip.includes('label = "0"'));
  });

  it("desktop TopHeader mounts the chip once beside the user avatar", () => {
    assert.equal((topHeader.match(/<TokenBalanceChip/g) || []).length, 1);
    assert.ok(topHeader.includes("header-identity-group"));
    assert.ok(topHeader.includes("userInitials"));
    assert.ok(topHeader.includes("rounded-full"));
    assert.ok(topHeader.includes('to="/settings?tab=account"'));
    assert.ok(!topHeader.includes("StatusBadge"));
  });

  it("mobile PrimaryTopBar mounts one compact chip beside the avatar", () => {
    assert.equal((primaryTopBar.match(/<TokenBalanceChip/g) || []).length, 1);
    assert.ok(primaryTopBar.includes("<TokenBalanceChip compact"));
    assert.ok(primaryTopBar.includes("userInitials"));
    assert.ok(primaryTopBar.includes("rounded-full"));
    assert.ok(primaryTopBar.includes('to="/settings?tab=account"'));
  });

  it("avatar opens account tab and token chip opens tokens tab", () => {
    assert.ok(topHeader.includes('to="/settings?tab=account"'));
    assert.ok(chip.includes('to="/settings?tab=tokens"'));
    assert.ok(primaryTopBar.includes('to="/settings?tab=account"'));
  });

  it("account settings page does not render a second header-level token badge", () => {
    assert.ok(!settings.includes("TokenBalanceChip"));
    assert.ok(!settings.includes("useGetTokenWalletQuery"));
    assert.ok(!settings.includes("Coins"));
    assert.ok(!settings.includes("موجودی توکن"));
    assert.ok(settings.includes("ThemeToggle"));
    assert.ok(settings.includes("WalletSection"));
    assert.ok(settings.includes('activeTab === "tokens"'));
  });

  it("token-changing mutations invalidate the shared Wallet BALANCE tag", () => {
    assert.ok(walletApi.includes('{ type: "Wallet", id: "BALANCE" }'));
    assert.ok(authApi.includes('{ type: "Wallet", id: "BALANCE" }'));
    assert.ok(financialApi.includes('{ type: "Wallet", id: "BALANCE" }'));
    assert.ok(walletApi.includes("donateTokensToCompany"));
    assert.ok(walletApi.includes('{ type: "CompanyWallet", id: companyId }'));
  });

  it("does not embed debug ingest calls", () => {
    assert.ok(!chip.includes("127.0.0.1:7869"));
    assert.ok(!chip.includes("#region agent log"));
  });
});
