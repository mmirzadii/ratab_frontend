import { Building2, CircleHelp, Coins, LogOut, Moon, Settings, Sun, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { performLogout } from "../../features/auth/logout";
import { toggleTheme } from "../../features/ui/uiSlice";
import { classNames } from "../utils/classNames";
import { IconButton } from "./IconButton";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip } from "./Tooltip";

const navItems = [
  { label: "لیست شرکت‌ها", icon: Building2, to: "/companies" },
  { label: "افزودن شرکت", icon: UserPlus, to: "/companies/new" },
  { label: "راهنما", icon: CircleHelp, to: "/help" }
] as const;

const utilityItems = [
  { label: "کیف توکن", icon: Coins, to: "/settings?tab=tokens" },
  { label: "تنظیمات حساب", icon: Settings, to: "/settings?tab=account" }
] as const;

function useNavActive(to: string): boolean {
  const { pathname, search } = useLocation();
  if (to.startsWith("/settings")) {
    if (!pathname.startsWith("/settings")) return false;
    const want = new URLSearchParams(to.includes("?") ? to.slice(to.indexOf("?")) : "").get("tab");
    const have = new URLSearchParams(search).get("tab") ?? "account";
    return want ? have === want : true;
  }
  if (to === "/companies/new") return pathname === "/companies/new";
  if (to === "/companies") return pathname.startsWith("/companies") && pathname !== "/companies/new";
  return pathname.startsWith(to);
}

type Props = {
  /** `rail` = icon-only desktop strip; `drawer` = icon + Persian labels for mobile. */
  variant?: "rail" | "drawer";
  onNavigate?: () => void;
};

const activeNav =
  "border-ui-primary/30 bg-ui-primary-soft text-ui-primary";
const idleNav =
  "border-transparent text-ui-text-muted hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary";

function DrawerNavButton({
  label,
  icon: Icon,
  active,
  onClick
}: {
  label: string;
  icon: typeof Building2;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      aria-label={label}
      className={classNames(
        "flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
        active ? activeNav : idleNav
      )}
      onClick={onClick}
      type="button"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="min-w-0 flex-1 text-right">{label}</span>
    </button>
  );
}

function RailNavItem({ label, icon: Icon, to }: (typeof navItems)[number]) {
  const isActive = useNavActive(to);
  const navigate = useNavigate();

  return (
    <Tooltip label={label}>
      <button
        aria-label={label}
        className={classNames(
          "flex h-11 w-11 items-center justify-center rounded-lg border transition sm:h-12 sm:w-12",
          isActive ? activeNav : idleNav
        )}
        onClick={() => navigate(to)}
        type="button"
      >
        <Icon className="h-5 w-5" />
      </button>
    </Tooltip>
  );
}

function DrawerLinkItem({
  label,
  icon,
  to,
  onNavigate
}: {
  label: string;
  icon: typeof Building2;
  to: string;
  onNavigate?: () => void;
}) {
  const isActive = useNavActive(to);
  const navigate = useNavigate();

  return (
    <DrawerNavButton
      active={isActive}
      icon={icon}
      label={label}
      onClick={() => {
        navigate(to);
        onNavigate?.();
      }}
    />
  );
}

export function PrimaryNavContent({ variant = "rail", onNavigate }: Props) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const theme = useAppSelector((state) => state.ui.theme);
  const isDark = theme === "dark";

  async function handleLogout() {
    await performLogout(dispatch);
    onNavigate?.();
    navigate("/login", { replace: true });
  }

  if (variant === "drawer") {
    return (
      <div className="flex h-full min-h-0 w-full flex-col" data-testid="primary-nav-drawer" dir="rtl">
        <div className="mb-4 flex items-center gap-3 px-1">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-base font-black text-white shadow-brand-soft">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-black text-ui-text-primary">متریل</p>
            <p className="truncate text-[11px] text-ui-text-muted">منوی اصلی</p>
          </div>
        </div>

        <nav aria-label="ناوبری اصلی" className="flex flex-1 flex-col gap-1 overflow-y-auto">
          {navItems.map((item) => (
            <DrawerLinkItem
              icon={item.icon}
              key={item.to}
              label={item.label}
              onNavigate={onNavigate}
              to={item.to}
            />
          ))}
        </nav>

        <div className="mt-3 flex flex-col gap-1 border-t border-ui-border-subtle pt-3">
          {utilityItems.map((item) => (
            <DrawerLinkItem
              icon={item.icon}
              key={item.to}
              label={item.label}
              onNavigate={onNavigate}
              to={item.to}
            />
          ))}
          <DrawerNavButton icon={LogOut} label="خروج از حساب" onClick={() => void handleLogout()} />
          <DrawerNavButton
            icon={isDark ? Moon : Sun}
            label="تغییر حالت روشن و تاریک"
            onClick={() => dispatch(toggleTheme())}
          />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-base font-black text-white shadow-brand-soft sm:mb-8 sm:h-12 sm:w-12">
        M
      </div>

      <nav aria-label="ناوبری اصلی" className="flex flex-1 flex-col items-center gap-4">
        {navItems.map((item) => (
          <RailNavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="mb-4 flex flex-col items-center gap-3">
        <Tooltip label="کیف توکن">
          <IconButton aria-label="کیف توکن" onClick={() => navigate("/settings?tab=tokens")}>
            <Coins className="h-5 w-5" />
          </IconButton>
        </Tooltip>
        <Tooltip label="تنظیمات حساب">
          <IconButton aria-label="تنظیمات حساب" onClick={() => navigate("/settings?tab=account")}>
            <Settings className="h-5 w-5" />
          </IconButton>
        </Tooltip>
        <Tooltip label="خروج از حساب">
          <IconButton aria-label="خروج از حساب" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </IconButton>
        </Tooltip>
      </div>

      <Tooltip label="حالت روشن و تاریک">
        <ThemeToggle />
      </Tooltip>
    </>
  );
}
