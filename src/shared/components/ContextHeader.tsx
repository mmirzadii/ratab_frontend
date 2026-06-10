import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { useAppShell } from "../../app/appShellContext";
import { StatusBadge } from "./StatusBadge";
import { TopHeader } from "./TopHeader";

export function ContextHeader() {
  const { companyCtx, wizardCtx } = useAppShell();

  if (wizardCtx) {
    return (
      <header className="sticky top-14 md:top-0 z-20 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-6 sm:py-4">
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
              className="flex h-9 items-center gap-1.5 rounded-lg border border-violet-300/30 bg-violet-400/15 px-3 text-sm font-black text-violet-100 transition hover:bg-violet-400/25 light:text-violet-800"
              onClick={wizardCtx.onFinalize}
              type="button"
            >
              <CheckCircle2 className="h-4 w-4" />
              نهایی کردن
            </button>
          ) : null}
        </div>
      </header>
    );
  }

  if (companyCtx) {
    return (
      <header className="sticky top-14 md:top-0 z-20 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
        <div className="flex items-center gap-3 px-3 py-3 sm:px-6 sm:py-4">
          <Link
            aria-label="بازگشت به شرکت‌ها"
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
            to="/companies"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="truncate text-lg font-black leading-6 text-white light:text-slate-950">
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
