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
    <div className="mx-auto w-full max-w-2xl px-3 pb-6 pt-3 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
      <GlassCard className="overflow-hidden p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/10 px-4 py-3 light:border-slate-200 sm:px-5 sm:py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-violet-300/20 bg-violet-400/10 text-violet-200 sm:h-11 sm:w-11">
              <Settings className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white light:text-slate-950 sm:text-lg">تنظیمات حساب</h1>
              <p className="mt-1 text-xs text-slate-400 light:text-slate-500">اطلاعات حساب کاربری</p>
            </div>
          </div>
          <Tooltip label="حالت روشن و تاریک">
            <ThemeToggle />
          </Tooltip>
        </div>

        {displayUser ? (
          <div className="space-y-3 p-3 sm:space-y-4 sm:p-5">
            <div className="grid divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10 light:divide-slate-200 light:border-slate-200 sm:grid-cols-2 sm:gap-3 sm:divide-y-0 sm:overflow-visible sm:rounded-none sm:border-0">
              <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:block sm:rounded-lg sm:border sm:border-white/10 sm:bg-white/7 sm:p-4 light:sm:border-slate-200 light:sm:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">نام نمایشی</p>
                <p className="min-w-0 break-words text-sm font-black text-slate-100 light:text-slate-900 sm:mt-1 sm:text-base">{displayUser.display_name}</p>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:block sm:rounded-lg sm:border sm:border-white/10 sm:bg-white/7 sm:p-4 light:sm:border-slate-200 light:sm:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">شماره تلفن</p>
                <p className="font-mono text-sm font-black text-slate-100 light:text-slate-900 ltr sm:mt-1 sm:text-base">{displayUser.phone_number}</p>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:block sm:rounded-lg sm:border sm:border-white/10 sm:bg-white/7 sm:p-4 light:sm:border-slate-200 light:sm:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">وضعیت حساب</p>
                <p className="sm:mt-1">
                  <StatusBadge tone={displayUser.is_active ? "emerald" : "amber"}>
                    {displayUser.is_active ? "فعال" : "غیرفعال"}
                  </StatusBadge>
                </p>
              </div>
              <div className="flex min-h-12 items-center justify-between gap-3 px-3 py-2 sm:block sm:rounded-lg sm:border sm:border-white/10 sm:bg-white/7 sm:p-4 light:sm:border-slate-200 light:sm:bg-slate-50">
                <p className="text-xs text-slate-400 light:text-slate-500">دسترسی ادمین</p>
                <p className="sm:mt-1">
                  <StatusBadge tone={displayUser.is_staff ? "violet" : "slate"}>
                    {displayUser.is_staff ? "ادمین" : "کاربر عادی"}
                  </StatusBadge>
                </p>
              </div>
            </div>

            <div className="sm:pt-2">
              <Button className="w-full sm:w-auto" onClick={handleLogout} type="button" variant="secondary">
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
