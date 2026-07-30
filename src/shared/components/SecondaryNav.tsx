import { useAppShell } from "../../app/appShellContext";
import { classNames } from "../utils/classNames";

export function SecondaryNav() {
  const { secondaryNav, companyCtx } = useAppShell();

  if (!secondaryNav) return null;

  const activeClasses = "border-ui-primary/30 bg-ui-primary-soft text-ui-primary";
  const hoverClasses =
    "border-transparent text-ui-text-muted hover:border-ui-primary/30 hover:bg-ui-primary-soft hover:text-ui-primary";

  return (
    <aside className="fixed right-16 top-0 z-20 hidden h-screen w-56 flex-col border-l border-ui-border-subtle bg-ui-surface sm:right-20 lg:flex">
      {companyCtx ? (
        <div className="border-b border-ui-border-subtle px-3 py-4">
          <p className="truncate text-xs font-black text-ui-text-secondary">{companyCtx.name}</p>
        </div>
      ) : null}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
        {secondaryNav.map((item) => {
          const Icon = item.icon;

          return (
            <button
              className={classNames(
                "flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
                item.isActive
                  ? activeClasses
                  : item.disabled
                    ? "cursor-not-allowed border-transparent text-ui-text-muted opacity-65"
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
