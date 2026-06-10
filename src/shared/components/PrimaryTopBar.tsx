import { Menu } from "lucide-react";

import { useAppShell } from "../../app/appShellContext";

type Props = { onMenuClick: () => void };

export function PrimaryTopBar({ onMenuClick }: Props) {
  const { wizardCtx } = useAppShell();

  return (
    <header className="md:hidden fixed top-0 right-0 left-0 z-30 h-14 flex items-center justify-between px-4 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
      {wizardCtx ? (
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-violet-300/30 bg-violet-400/20 text-xs font-black text-violet-100 light:text-violet-800">
            {wizardCtx.companyName.charAt(0)}
          </div>
          <span className="max-w-[120px] truncate text-xs font-black text-white light:text-slate-950">
            {wizardCtx.companyName}
          </span>
        </div>
      ) : (
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-base font-black text-slate-950 shadow-emerald-soft">
          م
        </div>
      )}
      <div className="flex items-center gap-2">
        {wizardCtx ? (
          <span className="text-xs font-bold text-slate-400 light:text-slate-500">
            {wizardCtx.tokenBalanceLabel}
          </span>
        ) : null}
        <button
          aria-label="منوی ناوبری"
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
          onClick={onMenuClick}
          type="button"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>
    </header>
  );
}
