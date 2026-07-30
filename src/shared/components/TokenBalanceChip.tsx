import { Coins, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useGetTokenWalletQuery } from "../../features/wallet/walletApi";
import { formatDecimal } from "../utils/formatters";
import { classNames } from "../utils/classNames";
import { Tooltip } from "./Tooltip";

type Props = {
  className?: string;
  /** Tighter padding for narrow mobile headers. */
  compact?: boolean;
};

export function TokenBalanceChip({ className, compact = false }: Props) {
  const { data, isFetching, isError, isLoading } = useGetTokenWalletQuery();
  const loading = (isLoading || isFetching) && !data && !isError;

  const amountLabel = isError ? null : data ? formatDecimal(data.balance) : null;
  const ariaValue = isError
    ? "نامشخص"
    : amountLabel != null
      ? amountLabel
      : loading
        ? "در حال دریافت"
        : "نامشخص";

  return (
    <Tooltip label="موجودی توکن شخصی">
      <Link
        aria-label={`موجودی توکن شخصی: ${ariaValue}`}
        className={classNames(
          "inline-flex min-w-[5.75rem] items-center justify-center gap-1.5 rounded-xl border font-black transition",
          compact ? "h-9 px-2 text-xs" : "h-10 px-3 text-sm",
          isError
            ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
            : "border-ui-token/40 bg-ui-token-soft text-ui-token hover:opacity-95",
          className
        )}
        data-tour="token-balance-chip"
        to="/settings?tab=tokens"
      >
        {loading ? (
          <Loader2 className={classNames("animate-spin", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        ) : (
          <Coins className={classNames("shrink-0", compact ? "h-3.5 w-3.5" : "h-4 w-4")} />
        )}
        <span className="min-w-[1.5rem] text-center font-mono tabular-nums ltr">
          {isError ? "—" : amountLabel ?? "…"}
        </span>
        <span className={classNames("shrink-0 font-bold opacity-90", compact ? "text-[10px]" : "text-xs")}>
          توکن
        </span>
      </Link>
    </Tooltip>
  );
}
