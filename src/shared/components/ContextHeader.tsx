import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAppShell } from "../../app/appShellContext";
import { StatusBadge } from "./StatusBadge";
import { TopHeader } from "./TopHeader";

export function ContextHeader() {
  const { companyCtx, wizardCtx } = useAppShell();

  if (wizardCtx) {
    return (
      <header className="fixed top-14 lg:top-0 left-0 right-0 lg:right-[19rem] z-30 h-16 border-b border-white/8 bg-slate-950/55 backdrop-blur-xl light:border-slate-200 light:bg-white/90">
        <div className="flex h-full items-center gap-3 px-3 sm:px-6">
          <button
            aria-label="بازگشت"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
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
              className="flex h-10 items-center gap-1.5 rounded-lg bg-success-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-success-500 light:bg-success-600 light:hover:bg-success-500"
              onClick={wizardCtx.onFinalize}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              نهایی کردن
            </button>
          ) : wizardCtx.onNext !== null ? (
            <button
              className="flex h-10 items-center gap-1.5 rounded-lg bg-success-600 px-4 text-sm font-black text-white shadow-sm transition hover:bg-success-500 disabled:cursor-not-allowed disabled:opacity-50 light:bg-success-600 light:hover:bg-success-500"
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
      <header className="sticky top-14 lg:top-0 z-20 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-6 sm:py-4">
          <Link
            aria-label="بازگشت به شرکت‌ها"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
            to="/companies"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-2xl sm:text-3xl font-black leading-6 text-white light:text-slate-950">
              {companyCtx.name}
            </p>
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
