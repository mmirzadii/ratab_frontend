import { useAppShell } from "../../app/appShellContext";
import { classNames } from "../utils/classNames";

export function SecondaryNav() {
  const { secondaryNav, companyCtx, secondaryNavVariant } = useAppShell();

  if (!secondaryNav) return null;

  const isViolet = secondaryNavVariant === "violet";

  const activeClasses = isViolet
    ? "border-violet-300/30 bg-violet-400/15 text-violet-100 light:text-violet-800"
    : "border-emerald-300/30 bg-emerald-400/15 text-emerald-100 light:text-emerald-800";

  const hoverClasses = isViolet
    ? "border-transparent text-slate-400 hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-violet-100 light:text-slate-600 light:hover:text-violet-800"
    : "border-transparent text-slate-400 hover:border-emerald-300/30 hover:bg-emerald-400/10 hover:text-emerald-100 light:text-slate-600 light:hover:text-emerald-800";

  const headerTextClasses = isViolet
    ? "text-violet-200 light:text-violet-700"
    : "text-slate-300 light:text-slate-600";

  return (
    <aside className="hidden md:flex fixed right-16 sm:right-20 top-0 z-20 h-screen w-56 flex-col border-l border-white/10 bg-slate-950/55 backdrop-blur-xl light:border-slate-200 light:bg-white/78">
      {companyCtx ? (
        <div className="border-b border-white/10 px-3 py-4 light:border-slate-200">
          <p className={classNames("truncate text-xs font-black", headerTextClasses)}>
            {companyCtx.name}
          </p>
        </div>
      ) : null}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {secondaryNav.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={classNames(
                "flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition",
                item.isActive
                  ? activeClasses
                  : item.disabled
                    ? "cursor-not-allowed border-transparent text-slate-500 opacity-65 light:text-slate-400"
                    : hoverClasses
              )}
              disabled={item.disabled}
              key={item.id}
              onClick={item.onClick}
              title={item.disabled ? "ابتدا اطلاعات پروژه و صورت‌بها را تکمیل کنید." : item.label}
              type="button"
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
