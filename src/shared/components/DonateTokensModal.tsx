import { Coins, Loader2, X } from "lucide-react";
import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";

import { useAppDispatch } from "../../app/hooks";
import { useListCompaniesQuery, type Company } from "../../features/companies/companyApi";
import { addToast } from "../../features/ui/uiSlice";
import {
  createDonationIdempotencyKey,
  DONATION_SUCCESS_TOAST,
  DONATION_TRANSFER_NOTICE,
  formatDonationError,
  isIdempotencyKeyReused,
  normalizeDonationAmount,
  useDonateTokensToCompanyMutation,
  useGetCompanyTokenWalletQuery,
  useGetTokenWalletQuery,
  validateDonationForm
} from "../../features/wallet/walletApi";
import { formatDecimal } from "../utils/formatters";
import { Button } from "./Button";

export type DonateTokensModalProps = {
  open: boolean;
  onClose: () => void;
  /** Company Settings: lock selector to this company. */
  lockedCompanyId?: number;
  lockedCompanyName?: string;
};

function activeCompanies(companies: Company[]): Company[] {
  return companies.filter((company) => company.is_active);
}

export function DonateTokensModal({
  open,
  onClose,
  lockedCompanyId,
  lockedCompanyName
}: DonateTokensModalProps) {
  const dispatch = useAppDispatch();
  const amountRef = useRef<HTMLInputElement>(null);
  const companyLocked = lockedCompanyId != null && lockedCompanyId > 0;

  const { data: companiesData, isFetching: isFetchingCompanies } = useListCompaniesQuery(undefined, {
    skip: !open || companyLocked
  });
  const { data: personalWallet } = useGetTokenWalletQuery(undefined, { skip: !open });
  const [donate, donateState] = useDonateTokensToCompanyMutation();

  const selectableCompanies = useMemo(
    () => activeCompanies(companiesData?.results ?? []),
    [companiesData?.results]
  );

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(
    companyLocked ? lockedCompanyId : null
  );
  const [amount, setAmount] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [idempotencyKey, setIdempotencyKey] = useState(() => createDonationIdempotencyKey());

  const effectiveCompanyId = companyLocked ? lockedCompanyId : selectedCompanyId;

  const {
    data: companyWallet,
    error: companyWalletError,
    isFetching: isFetchingCompanyWallet
  } = useGetCompanyTokenWalletQuery(effectiveCompanyId ?? 0, {
    skip: !open || effectiveCompanyId == null || effectiveCompanyId <= 0
  });

  useEffect(() => {
    if (!open) return;

    setAmount("");
    setFormError(null);
    setIdempotencyKey(createDonationIdempotencyKey());

    if (companyLocked) {
      setSelectedCompanyId(lockedCompanyId);
      return;
    }

    setSelectedCompanyId(null);
  }, [open, companyLocked, lockedCompanyId]);

  useEffect(() => {
    if (!open || companyLocked) return;
    if (selectedCompanyId != null) return;
    if (selectableCompanies.length === 1) {
      setSelectedCompanyId(selectableCompanies[0].id);
    }
  }, [open, companyLocked, selectableCompanies, selectedCompanyId]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => amountRef.current?.focus(), 40);
    return () => window.clearTimeout(timer);
  }, [open, effectiveCompanyId]);

  const displayCompanyName =
    (companyLocked ? lockedCompanyName : null) ||
    companyWallet?.company_name ||
    selectableCompanies.find((company) => company.id === effectiveCompanyId)?.name ||
    "—";

  const personalBalance = personalWallet?.balance ?? companyWallet?.personal_balance;
  const companyBalance = companyWallet?.balance;
  const pending = donateState.isLoading;

  function handleClose() {
    if (pending) return;
    onClose();
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (pending) return;
    setFormError(null);

    const validation = validateDonationForm({
      companyId: effectiveCompanyId,
      amount,
      personalBalance
    });
    if (!validation.ok) {
      setFormError(validation.message);
      return;
    }

    const companyId = effectiveCompanyId!;
    const submitKey = idempotencyKey;

    try {
      await donate({
        companyId,
        body: {
          amount: validation.amount,
          idempotency_key: submitKey
        }
      }).unwrap();
      // Exact replay (200 + Idempotent-Replayed) also unwraps as success — one toast only.
      dispatch(addToast({ message: DONATION_SUCCESS_TOAST, type: "success" }));
      onClose();
    } catch (error) {
      if (isIdempotencyKeyReused(error)) {
        setIdempotencyKey(createDonationIdempotencyKey());
      }
      setFormError(formatDonationError(error));
      // Preserve company, amount, personal balance, and modal open state on failure.
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) handleClose();
      }}
    >
      <div
        aria-labelledby="donate-tokens-title"
        aria-modal="true"
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-ui-border-subtle bg-ui-surface shadow-ui sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ui-border-subtle px-4 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-sky-300/25 bg-sky-400/10 text-sky-200">
              <Coins className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-base font-black text-ui-text-primary"
                id="donate-tokens-title"
              >
                اهدای توکن به شرکت
              </h2>
              <p className="mt-1 text-xs leading-6 text-ui-text-muted">
                {DONATION_TRANSFER_NOTICE}
              </p>
            </div>
          </div>
          <button
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
            disabled={pending}
            onClick={handleClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form className="space-y-3 p-4" onSubmit={(event) => void handleSubmit(event)}>
          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-ui-text-secondary">شرکت</span>
            {companyLocked ? (
              <div className="flex h-10 items-center rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-3 text-sm font-bold text-ui-text-primary">
                {displayCompanyName}
              </div>
            ) : (
              <select
                className="h-10 w-full rounded-lg border border-ui-border-subtle bg-ui-surface/50 px-3 text-sm text-ui-text-primary outline-none focus:border-ui-primary/30 disabled:opacity-60"
                disabled={pending || isFetchingCompanies}
                onChange={(event) => {
                  const next = Number(event.target.value);
                  setSelectedCompanyId(Number.isInteger(next) && next > 0 ? next : null);
                  setFormError(null);
                }}
                value={effectiveCompanyId ?? ""}
              >
                <option value="">انتخاب شرکت…</option>
                {selectableCompanies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
            )}
            {!companyLocked && !isFetchingCompanies && selectableCompanies.length === 0 ? (
              <p className="text-xs text-amber-200">
                شرکت فعال برای اهدا یافت نشد.
              </p>
            ) : null}
          </label>

          <div className="grid gap-2 sm:grid-cols-2">
            <div className="rounded-md border border-amber-300/20 bg-amber-400/10 px-3 py-2">
              <p className="text-[11px] text-amber-100/80">موجودی شخصی</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-amber-50 ltr">
                {personalBalance != null ? formatDecimal(personalBalance) : "—"}
              </p>
            </div>
            <div className="rounded-md border border-sky-300/20 bg-sky-400/10 px-3 py-2">
              <p className="text-[11px] text-sky-100/80">موجودی شرکت</p>
              <p className="mt-0.5 font-mono text-sm font-bold text-sky-50 ltr">
                {companyWalletError
                  ? "—"
                  : companyBalance != null
                    ? formatDecimal(companyBalance)
                    : isFetchingCompanyWallet
                      ? "…"
                      : "—"}
              </p>
            </div>
          </div>

          {companyWalletError && effectiveCompanyId != null ? (
            <p className="text-sm text-rose-300">
              کیف توکن شرکت در دسترس نیست.
            </p>
          ) : null}

          <label className="block space-y-1.5">
            <span className="text-xs font-bold text-ui-text-secondary">مقدار اهدا</span>
            <input
              className="h-10 w-full rounded-lg border border-ui-border-subtle bg-ui-surface/50 px-3 text-left text-sm text-ui-text-primary outline-none focus:border-ui-primary/30 disabled:opacity-60"
              dir="ltr"
              disabled={pending}
              inputMode="numeric"
              onChange={(event) => {
                setAmount(normalizeDonationAmount(event.target.value));
                setFormError(null);
              }}
              placeholder="مثلاً 10"
              ref={amountRef}
              value={amount}
            />
          </label>

          {formError ? (
            <p className="text-sm text-rose-300">{formError}</p>
          ) : null}

          <div className="grid grid-cols-[auto_1fr] gap-2 pt-1">
            <Button disabled={pending} onClick={handleClose} type="button" variant="secondary">
              انصراف
            </Button>
            <Button disabled={pending} type="submit">
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              تأیید اهدا
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
