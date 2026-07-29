import {
  ArrowRight,
  Building2,
  LogOut,
  MessageCircle,
  Settings,
  Users
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../../app/hooks";
import { performLogout } from "../../auth/logout";
import { classNames } from "../../../shared/utils/classNames";
import { ThemeToggle } from "../../../shared/components/ThemeToggle";
import { Tooltip } from "../../../shared/components/Tooltip";

/** Primary company destinations — conversations-first (no dedicated Projects/Groups nav). */
export type WorkspaceSection = "messages" | "company" | "members";

const sectionItems: Array<{
  id: WorkspaceSection;
  label: string;
  icon: typeof MessageCircle;
}> = [
  { id: "messages", label: "گفتگوها", icon: MessageCircle },
  { id: "members", label: "اعضا", icon: Users },
  { id: "company", label: "اطلاعات شرکت", icon: Building2 }
];

export const PRIMARY_WORKSPACE_SECTION_IDS = sectionItems.map((item) => item.id);

export function CompanyWorkspaceRail({
  companyName,
  activeSection,
  onSectionChange,
  className
}: {
  companyName: string;
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
  className?: string;
}) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const initial = companyName.trim().charAt(0) || "ش";

  async function handleLogout() {
    await performLogout(dispatch);
    navigate("/login", { replace: true });
  }

  return (
    <aside
      aria-label="ناوبری فضای کار شرکت"
      className={classNames(
        "flex w-[4.25rem] shrink-0 flex-col items-center border-l border-white/10 bg-slate-950/70 py-3 backdrop-blur-xl light:border-slate-200 light:bg-white/90",
        className
      )}
    >
      <Tooltip label={`${companyName} — بازگشت به شرکت‌ها`}>
        <Link
          aria-label="بازگشت به فهرست شرکت‌ها"
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-emerald-300/30 bg-emerald-400/15 text-sm font-black text-emerald-100 transition hover:bg-emerald-400/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800"
          to="/companies"
        >
          {initial}
        </Link>
      </Tooltip>

      <nav className="flex flex-1 flex-col items-center gap-1.5" aria-label="بخش‌های شرکت">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          const selected = item.id === activeSection;
          return (
            <Tooltip key={item.id} label={item.label}>
              <button
                aria-current={selected ? "page" : undefined}
                aria-label={item.label}
                className={classNames(
                  "flex h-11 w-11 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50",
                  selected
                    ? "border-emerald-300/35 bg-emerald-400/15 text-emerald-100 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-900"
                )}
                onClick={() => onSectionChange(item.id)}
                type="button"
              >
                <Icon className="h-5 w-5" />
              </button>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mt-2 flex flex-col items-center gap-2 border-t border-white/8 pt-3 light:border-slate-200">
        <Tooltip label="تنظیمات حساب">
          <Link
            aria-label="تنظیمات حساب"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 light:text-slate-500 light:hover:text-slate-900"
            to="/settings"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </Tooltip>
        <Tooltip label="خروج از حساب">
          <button
            aria-label="خروج از حساب"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 light:text-slate-500 light:hover:text-slate-900"
            onClick={() => void handleLogout()}
            type="button"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </Tooltip>
        <ThemeToggle />
        <Tooltip label="بازگشت به شرکت‌ها">
          <Link
            aria-label="بازگشت به شرکت‌ها"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/50 light:text-slate-500"
            to="/companies"
          >
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Tooltip>
      </div>
    </aside>
  );
}

export function CompanyMobileSectionNav({
  activeSection,
  onSectionChange
}: {
  activeSection: WorkspaceSection;
  onSectionChange: (section: WorkspaceSection) => void;
}) {
  return (
    <nav
      aria-label="بخش‌های شرکت"
      className="flex shrink-0 gap-0.5 border-t border-white/10 bg-slate-950/80 px-1 py-1 backdrop-blur-md light:border-slate-200 light:bg-white/95 lg:hidden"
    >
      {sectionItems.map((item) => {
        const Icon = item.icon;
        const selected = item.id === activeSection;
        return (
          <button
            aria-current={selected ? "page" : undefined}
            className={classNames(
              "flex min-h-12 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg px-1 text-[10px] font-bold transition",
              selected
                ? "bg-emerald-400/15 text-emerald-100 light:bg-emerald-50 light:text-emerald-800"
                : "text-slate-400 hover:bg-white/5 light:text-slate-500"
            )}
            key={item.id}
            onClick={() => onSectionChange(item.id)}
            type="button"
          >
            <Icon className="h-4 w-4" />
            <span className="truncate">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
