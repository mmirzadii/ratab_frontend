import { CircleHelp, LogOut } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../api/baseApi";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

function getHeaderCopy(pathname: string) {
  if (pathname === "/status") {
    return {
      title: "وضعیت سرویس",
      description: "بررسی اتصال متریل به سرویس توسعه"
    };
  }

  if (pathname === "/help") {
    return {
      title: "راهنمای متریل",
      description: "پاسخ‌های کوتاه برای مسیرهای اصلی نسخه آزمایشی"
    };
  }

  return {
    title: "فضای کار متریل",
    description: "شرکت، پروژه، صورت‌بها و فهرست‌بها در یک فضای کاری"
  };
}

export function TopHeader() {
  const dispatch = useAppDispatch();
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const token = useAppSelector((state) => state.auth.token);
  const copy = getHeaderCopy(pathname);

  function handleLogout() {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate("/login", { replace: true });
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-3 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-lg font-black text-slate-950 shadow-emerald-soft sm:h-11 sm:w-11 sm:text-xl">
            M
          </div>
          <div className="min-w-0">
            <p className="truncate text-lg font-black leading-6 text-white light:text-slate-950">
              {copy.title}
            </p>
            <p className="truncate text-xs text-slate-400 light:text-slate-500">{copy.description}</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          {token && user ? (
            <StatusBadge tone="violet">{user.display_name || user.phone_number}</StatusBadge>
          ) : null}

          <Link
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-3 text-sm font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-white light:text-slate-800"
            to="/help"
          >
            <CircleHelp className="h-4 w-4" />
            راهنما
          </Link>
          {token ? (
            <Button className="h-9 px-3" onClick={handleLogout} variant="ghost">
              <LogOut className="h-4 w-4" />
              خروج
            </Button>
          ) : null}
        </div>
      </div>
    </header>
  );
}
