import { Building2, CircleHelp, LogOut, Settings, UserPlus } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../api/baseApi";
import { classNames } from "../utils/classNames";
import { IconButton } from "./IconButton";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip } from "./Tooltip";

const navItems = [
  { label: "لیست شرکت‌ها", icon: Building2, to: "/companies" },
  { label: "افزودن شرکت", icon: UserPlus, to: "/companies/new" },
  { label: "راهنما", icon: CircleHelp, to: "/help" }
];

function useNavActive(to: string): boolean {
  const { pathname } = useLocation();
  if (to === "/companies/new") return pathname === "/companies/new";
  if (to === "/companies") return pathname.startsWith("/companies") && pathname !== "/companies/new";
  return pathname.startsWith(to);
}

function NavItem({ label, icon: Icon, to }: (typeof navItems)[number]) {
  const isActive = useNavActive(to);
  const navigate = useNavigate();

  return (
    <Tooltip label={label}>
      <button
        aria-label={label}
        className={classNames(
          "flex h-11 w-11 items-center justify-center rounded-lg border transition sm:h-12 sm:w-12",
          isActive
            ? "border-brand-300/30 bg-brand-400/15 text-brand-200 light:border-brand-300/40 light:bg-brand-50 light:text-brand-700"
            : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
        )}
        onClick={() => navigate(to)}
        type="button"
      >
        <Icon className="h-5 w-5" />
      </button>
    </Tooltip>
  );
}

export function PrimaryNavContent() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  function handleLogout() {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate("/login", { replace: true });
  }

  return (
    <>
      <div className="mb-6 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-600 to-brand-400 text-base font-black text-white shadow-brand-soft sm:mb-8 sm:h-12 sm:w-12">
        M
      </div>

      <nav className="flex flex-1 flex-col items-center gap-4" aria-label="ناوبری اصلی">
        {navItems.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>

      <div className="mb-4 flex flex-col items-center gap-3">
        <Tooltip label="تنظیمات حساب">
          <IconButton aria-label="تنظیمات حساب" onClick={() => navigate("/settings")}>
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
