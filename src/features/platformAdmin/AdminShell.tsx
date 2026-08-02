import { NavLink, Outlet } from "react-router-dom";

import { classNames } from "../../shared/utils/classNames";
import { visibleAdminNavItems } from "./adminNav";
import { StepUpProvider } from "./StepUpProvider";
import { usePlatformAdmin } from "./usePlatformAdmin";

export function AdminShell() {
  const { capabilities, isSuperuser } = usePlatformAdmin();
  const items = visibleAdminNavItems(capabilities, isSuperuser);

  return (
    <StepUpProvider>
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4 px-3 py-4 sm:px-5 lg:flex-row lg:gap-6">
        <aside className="shrink-0 lg:w-56">
          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-3 shadow-ui-sm">
            <p className="px-2 text-xs font-black text-ui-text-muted">پنل مدیریت</p>
            <nav aria-label="ناوبری مدیریت" className="mt-2 flex flex-col gap-1">
              {items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    className={({ isActive }) =>
                      classNames(
                        "flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-bold transition",
                        isActive
                          ? "bg-ui-primary-soft text-ui-primary"
                          : "text-ui-text-secondary hover:bg-ui-surface-hover hover:text-ui-text-primary"
                      )
                    }
                    end={item.to === "/admin"}
                    key={item.to}
                    to={item.to}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="min-w-0 flex-1">
          <Outlet />
        </div>
      </div>
    </StepUpProvider>
  );
}
