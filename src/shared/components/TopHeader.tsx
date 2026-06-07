import { LogOut, PanelsTopLeft, Sparkles } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { logout } from "../../features/auth/authSlice";
import { baseApi } from "../api/baseApi";
import { Button } from "./Button";
import { StatusBadge } from "./StatusBadge";

function getHeaderCopy(pathname: string) {
  if (pathname === "/status") {
    return {
      title: "وضعیت سرویس",
      description: "بررسی اتصال فرانت‌اند به بک‌اند توسعه"
    };
  }

  return {
    title: "فضای کار رتب",
    description: "فاز ۳: ورود توسعه، نشست امن و پوسته محافظت‌شده"
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
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-xl font-black text-slate-950 shadow-emerald-soft">
            ر
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
          <StatusBadge tone="emerald">
            <Sparkles className="h-3.5 w-3.5" />
            RTL آماده
          </StatusBadge>
          <StatusBadge>
            <PanelsTopLeft className="h-3.5 w-3.5 text-emerald-300" />
            React + RTK Query
          </StatusBadge>
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
