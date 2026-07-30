import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAppShell } from "../../app/appShellContext";
import { StatusBadge } from "./StatusBadge";
import { TopHeader } from "./TopHeader";

export function ContextHeader() {
  const { companyCtx, wizardCtx } = useAppShell();

  if (wizardCtx) {
    return (
      <header className="fixed left-0 right-0 top-14 z-30 h-14 border-b border-ui-border-subtle bg-ui-surface lg:right-[19rem] lg:top-0 lg:h-16">
        <div className="flex h-full items-center gap-3 px-3 sm:px-6">
          <button
            aria-label="بازگشت"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus sm:h-9 sm:w-9"
            onClick={wizardCtx.onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="flex-1 truncate text-sm font-black text-ui-text-primary">{wizardCtx.title}</p>
          {wizardCtx.isLastStep ? (
            <button
              className="flex h-10 items-center gap-1.5 rounded-lg bg-ui-primary px-4 text-sm font-black text-ui-primary-foreground shadow-ui-sm transition hover:bg-ui-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus motion-safe:active:scale-[.98]"
              onClick={wizardCtx.onFinalize}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              نهایی کردن
            </button>
          ) : wizardCtx.onNext !== null ? (
            <button
              className="flex h-10 items-center gap-1.5 rounded-lg bg-ui-primary px-4 text-sm font-black text-ui-primary-foreground shadow-ui-sm transition hover:bg-ui-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus motion-safe:active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={!wizardCtx.canGoNext}
              onClick={wizardCtx.onNext}
              type="button"
            >
              ادامه
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </header>
    );
  }

  if (companyCtx) {
    return (
      <header className="sticky top-14 z-20 border-b border-ui-border-subtle bg-ui-surface lg:top-0">
        <div className="flex h-11 items-center gap-2 px-2.5 sm:h-12 sm:gap-3 sm:px-4">
          <Link
            aria-label="بازگشت به شرکت‌ها"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            to="/companies"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-ui-text-primary">{companyCtx.name}</p>
          </div>
          <StatusBadge tone={companyCtx.isActive ? "success" : "warning"}>
            {companyCtx.isActive ? "فعال" : "غیرفعال"}
          </StatusBadge>
        </div>
      </header>
    );
  }

  return <TopHeader />;
}
