import { ChevronDown, Loader2, RefreshCw, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { useAppDispatch } from "../../app/hooks";
import { formatPlanPriceFa } from "../account/accountDisplay";
import { addToast } from "../ui/uiSlice";
import { Button } from "../../shared/components/Button";
import { DonateTokensModal } from "../../shared/components/DonateTokensModal";
import { classNames } from "../../shared/utils/classNames";
import { formatDecimal } from "../../shared/utils/formatters";
import {
  buildDemoPurchaseBody,
  createPurchaseIdempotencyKey,
  formatDemoPurchaseError,
  formatSignedTokenAmount,
  getTransactionTitle,
  isDemoCommerceMode,
  isDemoPurchaseAvailable,
  isPurchaseIdempotencyConflict,
  isTokenCreditAmount,
  sortTokenPackages,
  useCreateDemoPurchaseMutation,
  useGetTokenWalletQuery,
  useListTokenWalletTransactionsQuery,
  type TokenPackage,
  type TokenWalletTransaction
} from "./walletApi";

function formatTransactionTime(value: string): string {
  try {
    return new Intl.DateTimeFormat("fa-IR", {
      dateStyle: "short",
      timeStyle: "short"
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function TransactionRow({ transaction }: { transaction: TokenWalletTransaction }) {
  const credit = isTokenCreditAmount(transaction.amount);

  return (
    <li className="border-b border-ui-border-subtle last:border-b-0">
      <div className="flex items-center gap-2 px-2.5 py-1.5 sm:gap-3 sm:px-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] font-bold text-ui-text-primary">
            {getTransactionTitle(transaction)}
          </p>
          <p className="mt-0.5 text-[10px] text-ui-text-muted">
            {formatTransactionTime(transaction.created_at)}
            <span className="mx-1 text-slate-600">·</span>
            <span>{credit ? "واریز" : "برداشت"}</span>
          </p>
        </div>
        <div className="shrink-0 text-left">
          <p
            className={classNames(
              "font-mono text-[13px] font-black ltr",
              credit ? "text-ui-primary " : "text-rose-300"
            )}
            title={credit ? "واریز" : "برداشت"}
          >
            {formatSignedTokenAmount(formatDecimal(transaction.amount))}
          </p>
          <p className="mt-0.5 font-mono text-[10px] text-ui-text-muted ltr">
            مانده {formatDecimal(transaction.balance_after)}
          </p>
        </div>
      </div>
    </li>
  );
}

function MetricCell({
  label,
  value,
  mono
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="min-w-0 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-2.5 py-2">
      <p className="text-[10px] text-ui-text-muted">{label}</p>
      <p
        className={classNames(
          "mt-0.5 truncate text-sm font-black text-ui-text-primary",
          mono ? "font-mono ltr" : ""
        )}
        title={value}
      >
        {value}
      </p>
    </div>
  );
}

function PurchaseConfirmSheet({
  pkg,
  demoMode,
  pending,
  errorMessage,
  onCancel,
  onConfirm
}: {
  pkg: TokenPackage;
  demoMode: boolean;
  pending: boolean;
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-[120] flex max-h-dvh items-end justify-center overflow-y-auto bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      data-testid="token-purchase-confirm"
      onMouseDown={(event) => {
        if (!pending && event.target === event.currentTarget) onCancel();
      }}
    >
      <div
        aria-labelledby="token-purchase-title"
        aria-modal="true"
        className="flex max-h-[min(92dvh,36rem)] w-full max-w-md flex-col overflow-hidden rounded-t-2xl border border-ui-border-subtle bg-ui-surface shadow-ui sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-ui-border-subtle px-4 py-3">
          <div className="min-w-0">
            <h2
              className="text-base font-black text-ui-text-primary"
              id="token-purchase-title"
            >
              تأیید خرید
            </h2>
            {demoMode ? (
              <p className="mt-1 text-xs text-amber-200/90">
                در محیط فعلی خرید بدون درگاه تکمیل می‌شود.
              </p>
            ) : null}
          </div>
          <button
            aria-label="انصراف"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
            disabled={pending}
            onClick={onCancel}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4 [scrollbar-width:thin]">
          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-3 py-3">
            <p className="text-sm font-black text-ui-text-primary">{pkg.title_fa}</p>
            <p className="mt-2 font-mono text-xl font-black text-amber-200 ltr">
              {formatDecimal(pkg.token_amount)}
              <span className="mr-1 text-sm font-bold text-ui-text-muted">توکن</span>
            </p>
            <p className="mt-1 text-sm font-bold text-ui-text-secondary">
              {formatPlanPriceFa(pkg.price_amount, pkg.currency)}
            </p>
          </div>
          {errorMessage ? (
            <p className="rounded-lg border border-rose-300/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-100">
              {errorMessage}
            </p>
          ) : null}
        </div>

        <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-ui-border-subtle px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Button disabled={pending} onClick={onCancel} type="button" variant="secondary">
            انصراف
          </Button>
          <Button disabled={pending} onClick={onConfirm} type="button">
            {pending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال خرید…
              </>
            ) : (
              "تأیید خرید"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function WalletSection() {
  const dispatch = useAppDispatch();
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<TokenWalletTransaction[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TokenPackage | null>(null);
  const [purchaseKey, setPurchaseKey] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [donateOpen, setDonateOpen] = useState(false);

  const {
    data: wallet,
    error: walletError,
    isFetching: isFetchingWallet,
    refetch: refetchWallet
  } = useGetTokenWalletQuery();
  const {
    data: pageData,
    error: transactionsError,
    isFetching: isFetchingTransactions,
    isSuccess,
    refetch: refetchTransactions
  } = useListTokenWalletTransactionsQuery({ page }, { skip: !historyOpen });
  const [createDemoPurchase, { isLoading: isPurchasing }] = useCreateDemoPurchaseMutation();

  const packages = useMemo(
    () => sortTokenPackages(wallet?.token_packages ?? []),
    [wallet?.token_packages]
  );
  const purchaseEnabled = isDemoPurchaseAvailable(wallet?.commerce);
  const demoMode = isDemoCommerceMode(wallet?.commerce);

  useEffect(() => {
    if (!historyOpen || !isSuccess || !pageData) return;
    setRows((previous) => {
      if (page <= 1) return pageData.results;
      const seen = new Set(previous.map((row) => row.id));
      const merged = [...previous];
      for (const row of pageData.results) {
        if (!seen.has(row.id)) merged.push(row);
      }
      return merged;
    });
  }, [historyOpen, isSuccess, page, pageData]);

  const isRefreshing = isFetchingWallet || (historyOpen && isFetchingTransactions && page <= 1);
  const hasMore = Boolean(pageData?.next);

  function handleRefresh() {
    setPage(1);
    setRows([]);
    void refetchWallet();
    if (historyOpen) void refetchTransactions();
  }

  function openPurchase(pkg: TokenPackage) {
    if (!purchaseEnabled || isPurchasing) return;
    setPurchaseError(null);
    setPurchaseKey(createPurchaseIdempotencyKey());
    setSelectedPackage(pkg);
  }

  function closePurchase() {
    if (isPurchasing) return;
    setSelectedPackage(null);
    setPurchaseKey(null);
    setPurchaseError(null);
  }

  async function confirmPurchase() {
    if (!selectedPackage || !purchaseKey || isPurchasing) return;

    const body = buildDemoPurchaseBody(selectedPackage.code, purchaseKey);
    try {
      await createDemoPurchase(body).unwrap();
      setSelectedPackage(null);
      setPurchaseKey(null);
      setPurchaseError(null);
      setHistoryOpen(true);
      setPage(1);
      setRows([]);
      // First success (201) and exact replay (200 + Idempotent-Replayed) both unwrap as success.
      // One toast only; RTK invalidation refreshes wallet + header chip (no local credit).
      dispatch(
        addToast({
          message: "بسته توکن با موفقیت به حساب شما اضافه شد.",
          type: "success"
        })
      );
    } catch (error) {
      setPurchaseError(formatDemoPurchaseError(error));
      if (isPurchaseIdempotencyConflict(error)) {
        setPurchaseKey(createPurchaseIdempotencyKey());
      }
      dispatch(addToast({ message: formatDemoPurchaseError(error), type: "error" }));
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain [scrollbar-width:thin]">
      <section className="shrink-0 space-y-2">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-xs font-bold text-ui-text-muted">خلاصه کیف</h3>
          <button
            aria-label="به‌روزرسانی کیف توکن"
            className="flex h-7 w-7 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary disabled:opacity-50"
            disabled={isRefreshing}
            onClick={handleRefresh}
            type="button"
          >
            <RefreshCw className={classNames("h-3.5 w-3.5", isRefreshing ? "animate-spin" : "")} />
          </button>
        </div>
        {walletError ? (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-rose-300/25 bg-rose-400/10 px-2.5 py-2 text-sm text-rose-100">
            <span>دریافت موجودی ناموفق بود.</span>
            <button
              className="rounded-md px-2 py-1 text-xs font-bold underline-offset-2 hover:underline"
              onClick={handleRefresh}
              type="button"
            >
              تلاش دوباره
            </button>
          </div>
        ) : wallet ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <MetricCell label="موجودی شخصی" mono value={formatDecimal(wallet.balance)} />
            <MetricCell
              label="هزینه محاسبه فهرست‌بها"
              mono
              value={formatDecimal(wallet.official_calculation_cost)}
            />
            <MetricCell
              label="هزینه محاسبه ستاره‌دار"
              mono
              value={formatDecimal(wallet.starred_calculation_cost)}
            />
          </div>
        ) : (
          <div className="flex items-center gap-2 py-1.5 text-sm text-ui-text-muted">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت موجودی
          </div>
        )}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <p className="text-[11px] leading-5 text-ui-text-muted">
            می‌توانید بخشی از موجودی شخصی را به کیف شرکت اهدا کنید.
          </p>
          <Button
            className="h-8 shrink-0 px-3 text-xs"
            data-testid="account-donate-tokens"
            onClick={() => setDonateOpen(true)}
            type="button"
            variant="secondary"
          >
            اهدای توکن به شرکت
          </Button>
        </div>
      </section>

      <section className="shrink-0 space-y-2" data-testid="token-packages">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-xs font-bold text-ui-text-muted">بسته‌های خرید توکن</h3>
          {demoMode && purchaseEnabled ? (
            <span className="rounded-md border border-amber-300/35 bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-bold text-amber-100">
              آزمایشی
            </span>
          ) : null}
        </div>
        {!purchaseEnabled ? (
          <p className="text-[11px] text-ui-text-muted">
            خرید آنلاین فعلاً فعال نیست.
          </p>
        ) : null}
        {wallet && packages.length === 0 ? (
          <p className="text-sm text-ui-text-muted">بسته‌ای برای نمایش نیست.</p>
        ) : null}
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {packages.map((pkg) => (
            <li
              key={pkg.code}
              className="flex flex-col rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-3 py-3"
            >
              <p className="text-sm font-black text-ui-text-primary">{pkg.title_fa}</p>
              <p className="mt-2 font-mono text-2xl font-black text-amber-200 ltr">
                {formatDecimal(pkg.token_amount)}
                <span className="mr-1 text-sm font-bold text-ui-text-muted">توکن</span>
              </p>
              <p className="mt-1 text-xs font-bold text-ui-text-secondary">
                {formatPlanPriceFa(pkg.price_amount, pkg.currency)}
              </p>
              <button
                className={classNames(
                  "mt-3 h-9 w-full rounded-lg border text-xs font-bold transition",
                  purchaseEnabled
                    ? "border-amber-300/40 bg-amber-400/20 text-amber-50 hover:bg-amber-400/25"
                    : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-muted"
                )}
                disabled={!purchaseEnabled || isPurchasing}
                onClick={() => openPurchase(pkg)}
                type="button"
              >
                {purchaseEnabled ? "خرید" : "خرید غیرفعال"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="shrink-0 rounded-xl border border-ui-border-subtle">
        <button
          aria-controls="token-transaction-history"
          aria-expanded={historyOpen}
          className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-start transition hover:bg-ui-surface-subtle"
          onClick={() => {
            setHistoryOpen((open) => {
              if (!open) {
                setPage(1);
                setRows([]);
              }
              return !open;
            });
          }}
          type="button"
        >
          <span className="text-xs font-bold text-ui-text-secondary">
            تاریخچه تراکنش‌ها
          </span>
          <ChevronDown
            className={classNames(
              "h-4 w-4 text-ui-text-muted transition",
              historyOpen ? "rotate-180" : ""
            )}
          />
        </button>
        {historyOpen ? (
          <div
            className="border-t border-ui-border-subtle px-2 pb-2 pt-1"
            id="token-transaction-history"
          >
            {transactionsError ? (
              <div className="flex flex-wrap items-center justify-between gap-2 px-1 py-2 text-sm text-rose-100">
                <span>دریافت تراکنش‌ها ناموفق بود.</span>
                <button
                  className="rounded-md px-2 py-1 text-xs font-bold underline-offset-2 hover:underline"
                  onClick={() => void refetchTransactions()}
                  type="button"
                >
                  تلاش دوباره
                </button>
              </div>
            ) : pageData || rows.length > 0 ? (
              rows.length > 0 ? (
                <div className="max-h-[min(40vh,20rem)] overflow-hidden rounded-lg border border-ui-border-subtle">
                  <ul className="max-h-[min(40vh,20rem)] overflow-y-auto overscroll-contain [scrollbar-width:thin]">
                    {rows.map((transaction) => (
                      <TransactionRow key={transaction.id} transaction={transaction} />
                    ))}
                  </ul>
                  {hasMore ? (
                    <div className="border-t border-ui-border-subtle px-2.5 py-1.5">
                      <button
                        className="w-full rounded-lg py-1.5 text-[11px] font-bold text-sky-200 transition hover:bg-ui-surface-subtle disabled:opacity-50"
                        disabled={isFetchingTransactions}
                        onClick={() => setPage((current) => current + 1)}
                        type="button"
                      >
                        {isFetchingTransactions ? "در حال بارگذاری…" : "نمایش بیشتر"}
                      </button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="px-1 py-2 text-sm text-ui-text-muted">
                  هنوز تراکنشی ثبت نشده است.
                </p>
              )
            ) : (
              <div className="flex items-center gap-2 px-1 py-2 text-sm text-ui-text-muted">
                <Loader2 className="h-4 w-4 animate-spin" />
                در حال دریافت تراکنش‌ها
              </div>
            )}
          </div>
        ) : null}
      </section>

      {selectedPackage ? (
        <PurchaseConfirmSheet
          demoMode={demoMode}
          errorMessage={purchaseError}
          onCancel={closePurchase}
          onConfirm={() => void confirmPurchase()}
          pending={isPurchasing}
          pkg={selectedPackage}
        />
      ) : null}

      <DonateTokensModal onClose={() => setDonateOpen(false)} open={donateOpen} />
    </div>
  );
}
