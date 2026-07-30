import { useState } from "react";
import { Coins, Loader2 } from "lucide-react";

import { useGetCompanyTokenWalletQuery } from "../../features/wallet/walletApi";
import { formatDecimal } from "../utils/formatters";
import { classNames } from "../utils/classNames";
import { Button } from "./Button";
import { DonateTokensModal } from "./DonateTokensModal";

/**
 * Compact company wallet summary for Company Settings.
 * Donation UI lives in the shared DonateTokensModal — any active member may donate.
 */
export function CompanyWalletSection({
  companyId,
  companyName
}: {
  companyId: number;
  companyName?: string;
}) {
  const {
    data: companyWallet,
    error: companyWalletError,
    isFetching: isFetchingCompany,
    isUninitialized
  } = useGetCompanyTokenWalletQuery(companyId, { skip: !companyId });

  const [donateOpen, setDonateOpen] = useState(false);
  const donationAllowed = companyWallet?.donation_allowed !== false;

  return (
    <section
      className="mt-4 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3 sm:p-4"
      data-testid="company-wallet-section"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-sky-300/20 bg-sky-400/10 text-sky-200">
            <Coins className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-ui-text-primary">کیف توکن شرکت</h3>
            <p className="mt-1 text-xs leading-6 text-ui-text-muted">
              هزینه ابتدا از حساب شخصی و سپس از کیف شرکت کسر می‌شود.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs text-ui-text-muted">موجودی شرکت</p>
          {companyWalletError ? (
            <p className="mt-1 text-sm text-rose-300">دریافت موجودی ناموفق بود.</p>
          ) : companyWallet ? (
            <p className="mt-1 font-mono text-xl font-black text-ui-text-primary ltr">
              {formatDecimal(companyWallet.balance)}
            </p>
          ) : (
            <div className="mt-2 flex items-center gap-2 text-xs text-ui-text-muted">
              <Loader2
                className={classNames(
                  "h-3.5 w-3.5",
                  isFetchingCompany || isUninitialized ? "animate-spin" : ""
                )}
              />
              در حال دریافت
            </div>
          )}
        </div>
        {donationAllowed ? (
          <Button
            className="h-9 px-3 text-xs"
            onClick={() => setDonateOpen(true)}
            type="button"
            variant="secondary"
          >
            اهدای توکن
          </Button>
        ) : null}
      </div>

      <DonateTokensModal
        lockedCompanyId={companyId}
        lockedCompanyName={companyName ?? companyWallet?.company_name}
        onClose={() => setDonateOpen(false)}
        open={donateOpen}
      />
    </section>
  );
}
