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
        "flex w-[4.25rem] shrink-0 flex-col items-center border-l border-ui-border-subtle bg-ui-overlay py-3 backdrop-blur-xl",
        className
      )}
    >
      <Tooltip label={`${companyName} — بازگشت به شرکت‌ها`}>
        <Link
          aria-label="بازگشت به فهرست شرکت‌ها"
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-full border border-ui-primary/30 bg-ui-primary-soft text-sm font-black text-ui-primary transition hover:bg-ui-primary-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
                  "flex h-11 w-11 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
                  selected
                    ? "border-ui-primary/35 bg-ui-primary-soft text-ui-primary"
                    : "border-transparent text-ui-text-muted hover:border-ui-border-subtle hover:bg-ui-surface-subtle hover:text-ui-text-primary"
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

      <div className="mt-2 flex flex-col items-center gap-2 border-t border-ui-border-subtle pt-3">
        <Tooltip label="تنظیمات حساب">
          <Link
            aria-label="تنظیمات حساب"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-subtle hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            to="/settings?tab=account"
          >
            <Settings className="h-4 w-4" />
          </Link>
        </Tooltip>
        <Tooltip label="خروج از حساب">
          <button
            aria-label="خروج از حساب"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-subtle hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-subtle hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
      className="flex shrink-0 gap-0.5 border-t border-ui-border-subtle bg-ui-surface/80 px-1 py-1 backdrop-blur-md lg:hidden"
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
                ? "bg-ui-primary-soft text-ui-primary"
                : "text-ui-text-muted hover:bg-ui-surface-subtle "
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
