import { Building2, Loader2 } from "lucide-react";

import {
  formatCompanyTokenBadgeLabel,
  useGetCompanyTokenWalletQuery
} from "../../features/wallet/walletApi";
import { classNames } from "../utils/classNames";
import { Tooltip } from "./Tooltip";

type Props = {
  companyId: number;
  className?: string;
};

/**
 * Compact company-wallet badge for the active company context header.
 * Uses brand-cyan soft treatment; distinct from the personal token gold chip.
 */
export function CompanyTokenBadge({ companyId, className }: Props) {
  const { data, isError, isFetching, isLoading, isUninitialized } = useGetCompanyTokenWalletQuery(
    companyId,
    { skip: !companyId }
  );

  const loading = (isLoading || isFetching || isUninitialized) && !data && !isError;
  const label = isError
    ? "شرکت: —"
    : data
      ? formatCompanyTokenBadgeLabel(data.balance)
      : loading
        ? "شرکت: …"
        : "شرکت: —";

  return (
    <Tooltip label="موجودی توکن شرکت">
      <span
        aria-label={`موجودی توکن شرکت: ${isError ? "نامشخص" : data ? data.balance : loading ? "در حال دریافت" : "نامشخص"}`}
        className={classNames(
          "inline-flex max-w-full items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
          isError
            ? "border-ui-danger/30 bg-ui-danger-soft text-ui-danger"
            : "border-brand-cyan/35 bg-ui-info-soft text-brand-cyan-dark",
          className
        )}
        data-testid="company-token-badge"
      >
        {loading ? (
          <Loader2 className="h-3 w-3 shrink-0 animate-spin" />
        ) : (
          <Building2 className="h-3 w-3 shrink-0 opacity-90" />
        )}
        <span className="min-w-0 truncate">{label}</span>
      </span>
    </Tooltip>
  );
}
