import { Building2, CircleHelp, LogOut, Menu, Settings, UserPlus } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../api/baseApi";
import { classNames } from "../utils/classNames";
import { IconButton } from "./IconButton";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip } from "./Tooltip";

const navItems = [
  { label: "لیست شرکت‌ها", icon: Building2, to: "/companies" },
  { label: "افزودن شرکت", icon: UserPlus, to: "/companies" },
  { label: "راهنما", icon: CircleHelp, to: "/help" }
];

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
      <Tooltip label="منوی اصلی">
        <IconButton
          aria-label="منوی اصلی"
          className="mb-6 bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 shadow-emerald-soft hover:scale-105 sm:mb-8"
        >
          <Menu className="h-6 w-6" />
        </IconButton>
      </Tooltip>

      <nav className="flex flex-1 flex-col items-center gap-4" aria-label="ناوبری اصلی">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <Tooltip key={item.label} label={item.label}>
              <NavLink
                aria-label={item.label}
                className={({ isActive }) =>
                  classNames(
                    "flex h-11 w-11 items-center justify-center rounded-lg border transition sm:h-12 sm:w-12",
                    isActive
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
                      : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
                  )
                }
                to={item.to}
              >
                <Icon className="h-5 w-5" />
              </NavLink>
            </Tooltip>
          );
        })}
      </nav>

      <div className="mb-4 flex flex-col items-center gap-3">
        <Tooltip label="افزودن مخاطب - به زودی">
          <span>
            <IconButton aria-label="افزودن مخاطب - به زودی" disabled>
              <UserPlus className="h-5 w-5" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip label="تنظیمات حساب - به زودی">
          <span>
            <IconButton aria-label="تنظیمات حساب - به زودی" disabled>
              <Settings className="h-5 w-5" />
            </IconButton>
          </span>
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
