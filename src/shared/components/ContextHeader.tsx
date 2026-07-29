import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAppShell } from "../../app/appShellContext";
import { StatusBadge } from "./StatusBadge";
import { TopHeader } from "./TopHeader";

export function ContextHeader() {
  const { companyCtx, wizardCtx } = useAppShell();

  if (wizardCtx) {
    return (
      <header className="fixed left-0 right-0 top-14 z-30 h-14 border-b border-white/8 bg-slate-950/55 backdrop-blur-xl light:border-slate-200 light:bg-white/90 lg:right-[19rem] lg:top-0 lg:h-16">
        <div className="flex h-full items-center gap-3 px-3 sm:px-6">
          <button
            aria-label="بازگشت"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 sm:h-9 sm:w-9 light:text-slate-500 light:hover:text-slate-900"
            onClick={wizardCtx.onBack}
            type="button"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="flex-1 truncate text-sm font-black text-white light:text-slate-950">
            {wizardCtx.title}
          </p>
          {wizardCtx.isLastStep ? (
            <button
              className="flex h-10 items-center gap-1.5 rounded-lg bg-success-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-success-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 motion-safe:active:scale-[.98] light:bg-success-600 light:hover:bg-success-500"
              onClick={wizardCtx.onFinalize}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              نهایی کردن
            </button>
          ) : wizardCtx.onNext !== null ? (
            <button
              className="flex h-10 items-center gap-1.5 rounded-lg bg-success-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-success-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 motion-safe:active:scale-[.98] disabled:cursor-not-allowed disabled:opacity-50 light:bg-success-600 light:hover:bg-success-500"
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
      <header className="sticky top-14 z-20 border-b border-white/8 bg-slate-950/40 backdrop-blur-xl light:border-slate-200 light:bg-white/80 lg:top-0">
        <div className="flex h-11 items-center gap-2 px-2.5 sm:h-12 sm:gap-3 sm:px-4">
          <Link
            aria-label="بازگشت به شرکت‌ها"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-success-400/60 light:text-slate-500 light:hover:text-slate-900"
            to="/companies"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-black text-white light:text-slate-950">{companyCtx.name}</p>
          </div>
          <StatusBadge tone={companyCtx.isActive ? "emerald" : "amber"}>
            {companyCtx.isActive ? "فعال" : "غیرفعال"}
          </StatusBadge>
        </div>
      </header>
    );
  }

  return <TopHeader />;
}
