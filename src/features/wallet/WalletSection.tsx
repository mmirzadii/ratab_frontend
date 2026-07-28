import { Coins, Loader2, RefreshCw } from "lucide-react";

import { GlassCard } from "../../shared/components/GlassCard";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { classNames } from "../../shared/utils/classNames";
import { formatDecimal } from "../../shared/utils/formatters";
import {
  getTransactionTypeLabel,
  useGetTokenWalletQuery,
  useListTokenWalletTransactionsQuery,
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

function amountTone(amount: string): "emerald" | "rose" {
  return amount.trim().startsWith("-") ? "rose" : "emerald";
}

function TransactionRow({ transaction }: { transaction: TokenWalletTransaction }) {
  const tone = amountTone(transaction.amount);
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 sm:px-4">
      <div className="min-w-0">
        <p className="text-sm font-bold text-slate-100 light:text-slate-900">
          {getTransactionTypeLabel(transaction.transaction_type)}
          {transaction.row_code ? (
            <span className="mr-2 font-mono text-xs text-slate-400 light:text-slate-500 ltr">
              {transaction.row_code}
            </span>
          ) : null}
        </p>
        <p className="mt-0.5 text-xs text-slate-400 light:text-slate-500">
          {formatTransactionTime(transaction.created_at)}
          {transaction.reason ? ` — ${transaction.reason}` : ""}
        </p>
      </div>
      <div className="text-left">
        <p
          className={classNames(
            "font-mono text-sm font-black ltr",
            tone === "rose" ? "text-rose-300 light:text-rose-600" : "text-emerald-300 light:text-emerald-600"
          )}
        >
          {formatDecimal(transaction.amount)}
        </p>
        <p className="mt-0.5 font-mono text-[11px] text-slate-400 light:text-slate-500 ltr">
          مانده: {formatDecimal(transaction.balance_after)}
        </p>
      </div>
    </li>
  );
}

export function WalletSection() {
  const {
    data: wallet,
    error: walletError,
    isFetching: isFetchingWallet,
    refetch: refetchWallet
  } = useGetTokenWalletQuery();
  const {
    data: transactionsData,
    error: transactionsError,
    isFetching: isFetchingTransactions,
    refetch: refetchTransactions
  } = useListTokenWalletTransactionsQuery();
  const transactions = transactionsData?.results ?? [];
  const isRefreshing = isFetchingWallet || isFetchingTransactions;

  return (
    <GlassCard className="overflow-hidden p-0">
      <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 light:border-slate-200 sm:px-5 sm:py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300/20 bg-amber-400/10 text-amber-200 sm:h-11 sm:w-11">
            <Coins className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-white light:text-slate-950 sm:text-lg">کیف توکن</h2>
            <p className="mt-1 text-xs text-slate-400 light:text-slate-500">
              ثبت هر ردیف رسمی فهرست‌بها ۵ توکن هزینه دارد. شارژ فعلاً توسط ادمین انجام می‌شود
              (پرداخت آنلاین غیرفعال است).
            </p>
          </div>
        </div>
        <button
          aria-label="به‌روزرسانی کیف توکن"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-400 transition hover:bg-white/8 hover:text-white disabled:opacity-50 light:hover:bg-slate-100 light:hover:text-slate-900"
          disabled={isRefreshing}
          onClick={() => {
            void refetchWallet();
            void refetchTransactions();
          }}
          type="button"
        >
          <RefreshCw className={classNames("h-4 w-4", isRefreshing ? "animate-spin" : "")} />
        </button>
      </div>

      <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
        {walletError ? (
          <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-100 light:text-rose-800">
            دریافت موجودی کیف توکن ناموفق بود.
          </p>
        ) : wallet ? (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
            <div>
              <p className="text-xs text-slate-400 light:text-slate-500">موجودی فعلی</p>
              <p className="mt-1 font-mono text-2xl font-black text-white light:text-slate-950 ltr">
                {formatDecimal(wallet.balance)}
              </p>
            </div>
            <StatusBadge tone="amber">توکن</StatusBadge>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-2 text-sm text-slate-400 light:text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت موجودی
          </div>
        )}

        <div>
          <h3 className="mb-2 text-sm font-black text-slate-200 light:text-slate-800">تراکنش‌های اخیر</h3>
          {transactionsError ? (
            <p className="rounded-lg border border-rose-300/25 bg-rose-400/10 p-3 text-sm text-rose-100 light:text-rose-800">
              دریافت تراکنش‌های کیف توکن ناموفق بود.
            </p>
          ) : transactionsData ? (
            transactions.length > 0 ? (
              <ul className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 light:divide-slate-200 light:border-slate-200">
                {transactions.map((transaction) => (
                  <TransactionRow key={transaction.id} transaction={transaction} />
                ))}
              </ul>
            ) : (
              <p className="rounded-lg border border-white/10 bg-white/5 p-3 text-sm text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500">
                هنوز تراکنشی ثبت نشده است.
              </p>
            )
          ) : (
            <div className="flex items-center gap-3 p-2 text-sm text-slate-400 light:text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              در حال دریافت تراکنش‌ها
            </div>
          )}
        </div>
      </div>
    </GlassCard>
  );
}
