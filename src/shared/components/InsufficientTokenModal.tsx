import { Coins, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

import type { CombinedTokenBillingError } from "../../features/wallet/walletApi";
import { formatDecimal } from "../utils/formatters";
import { Button } from "./Button";

export type InsufficientTokenPurchaseOrigin = {
  companyId?: number;
  financialDocumentId?: number;
  pricebookItemId?: number;
};

export function InsufficientTokenModal({
  error,
  onClose,
  purchaseOrigin
}: {
  error: CombinedTokenBillingError;
  onClose: () => void;
  purchaseOrigin?: InsufficientTokenPurchaseOrigin;
}) {
  const navigate = useNavigate();

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-ui-overlay backdrop-blur-sm sm:items-center sm:p-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-md overflow-hidden rounded-t-2xl border border-ui-border-subtle bg-ui-surface shadow-ui sm:rounded-2xl"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="insufficient-token-title"
      >
        <div className="flex items-start justify-between gap-3 border-b border-ui-border-subtle px-4 py-3">
          <div className="flex min-w-0 items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-amber-300/25 bg-amber-400/10 text-amber-200">
              <Coins className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <h2
                className="text-base font-black text-ui-text-primary"
                id="insufficient-token-title"
              >
                توکن کافی نیست
              </h2>
              <p className="mt-1 text-xs leading-6 text-ui-text-muted">
                برای محاسبه و افزودن این آیتم، توکن کافی ندارید.
              </p>
            </div>
          </div>
          <button
            aria-label="بستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            onClick={onClose}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <dl className="grid grid-cols-2 gap-3 p-4 text-sm">
          <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
            <dt className="text-xs text-ui-text-muted">موردنیاز</dt>
            <dd className="mt-1 font-mono font-black text-ui-text-primary ltr">
              {formatDecimal(error.required_tokens)}
            </dd>
          </div>
          <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
            <dt className="text-xs text-ui-text-muted">موجودی کل</dt>
            <dd className="mt-1 font-mono font-black text-ui-text-primary ltr">
              {formatDecimal(error.total_available)}
            </dd>
          </div>
          <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
            <dt className="text-xs text-ui-text-muted">حساب شخصی</dt>
            <dd className="mt-1 font-mono font-black text-ui-text-primary ltr">
              {formatDecimal(error.personal_balance)}
            </dd>
          </div>
          <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
            <dt className="text-xs text-ui-text-muted">کیف شرکت</dt>
            <dd className="mt-1 font-mono font-black text-ui-text-primary ltr">
              {formatDecimal(error.company_balance)}
            </dd>
          </div>
        </dl>

        <div className="grid grid-cols-[auto_1fr] gap-2 border-t border-ui-border-subtle px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3">
          <Button onClick={onClose} type="button" variant="secondary">
            انصراف
          </Button>
          <Button
            onClick={() => {
              onClose();
              navigate("/settings?tab=tokens", {
                state: purchaseOrigin
                  ? { insufficientTokenOrigin: purchaseOrigin }
                  : undefined
              });
            }}
            type="button"
          >
            خرید توکن
          </Button>
        </div>
      </div>
    </div>
  );
}
