import { Loader2, LogOut, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { useGetCurrentUserQuery } from "../features/auth/authApi";
import { logout } from "../features/auth/authSlice";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { Tooltip } from "../shared/components/Tooltip";
import { baseApi } from "../shared/api/baseApi";

export function AccountSettingsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const { data: freshUser } = useGetCurrentUserQuery();
  const displayUser = freshUser ?? user;

  function handleLogout() {
    dispatch(logout());
    dispatch(baseApi.util.resetApiState());
    navigate("/login", { replace: true });
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <GlassCard className="p-0 overflow-hidden">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-5 py-4 light:border-slate-200">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white light:text-slate-950">تنظیمات حساب</h1>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">اطلاعات حساب کاربری</p>
            </div>
          </div>
          <Tooltip label="حالت روشن و تاریک">
            <ThemeToggle />
          </Tooltip>
        </div>

        {displayUser ? (
          <div className="p-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">نام نمایشی</p>
                <p className="mt-1 font-black text-slate-100 light:text-slate-900">{displayUser.display_name}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">شماره تلفن</p>
                <p className="mt-1 font-black font-mono text-slate-100 light:text-slate-900 ltr">{displayUser.phone_number}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">وضعیت حساب</p>
                <p className="mt-1">
                  <StatusBadge tone={displayUser.is_active ? "emerald" : "amber"}>
                    {displayUser.is_active ? "فعال" : "غیرفعال"}
                  </StatusBadge>
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">دسترسی ادمین</p>
                <p className="mt-1">
                  <StatusBadge tone={displayUser.is_staff ? "violet" : "slate"}>
                    {displayUser.is_staff ? "ادمین" : "کاربر عادی"}
                  </StatusBadge>
                </p>
              </div>
            </div>

            <div className="pt-2">
              <Button onClick={handleLogout} type="button" variant="secondary">
                <LogOut className="h-4 w-4" />
                خروج از حساب
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-3 p-5 text-sm text-slate-400 light:text-slate-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            در حال دریافت اطلاعات
          </div>
        )}
      </GlassCard>
    </div>
  );
}
