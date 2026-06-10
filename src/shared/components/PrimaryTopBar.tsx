import { Menu } from "lucide-react";

import { useAppShell } from "../../app/appShellContext";

type Props = { onMenuClick: () => void };

export function PrimaryTopBar({ onMenuClick }: Props) {
  const { companyCtx, wizardCtx } = useAppShell();

  return (
    <header className="md:hidden fixed top-0 right-0 left-0 z-40 h-14 flex items-center justify-between gap-3 px-4 border-b border-white/8 bg-slate-950/55 backdrop-blur-xl light:border-slate-200 light:bg-white/90">
      {/* RIGHT side — brand + context label */}
      <div className="flex items-center gap-2 min-w-0">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-base font-black text-slate-950 shadow-emerald-soft">
          M
        </div>
        {wizardCtx ? (
          <span className="min-w-0 truncate text-sm font-black text-white light:text-slate-950">
            {wizardCtx.companyName}
          </span>
        ) : companyCtx ? (
          <span className="min-w-0 truncate text-sm font-black text-white light:text-slate-950">
            متریل
          </span>
        ) : (
          <span className="text-sm font-black text-white light:text-slate-950">صفحه کار متریل</span>
        )}
      </div>

      {/* LEFT side — menu + optional company badge */}
      <div className="flex items-center gap-2 shrink-0">
        {companyCtx && !wizardCtx ? (
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-emerald-300/25 bg-emerald-400/12 text-sm font-black text-emerald-100 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800">
            {companyCtx.name.charAt(0)}
          </div>
        ) : null}
        <button
          aria-label="منوی ناوبری"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-300 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-600 light:hover:text-slate-900"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
