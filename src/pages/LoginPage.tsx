import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Info, Phone, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setDevLoginSession } from "../features/auth/authSlice";
import { useDevLoginMutation } from "../features/auth/authApi";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { normalizeNumberInput } from "../shared/utils/numberText";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = String(error.status);

    if (status === "404") {
      return "ورود توسعه در بک‌اند فعال نیست. لطفا تنظیمات ENABLE_DEV_LOGIN را بررسی کنید.";
    }

    if (status === "400") {
      return "شماره تلفن پذیرفته نشد. شماره را با ارقام لاتین یا فارسی و بدون فاصله وارد کنید.";
    }

    return `درخواست ورود با وضعیت ${status} پاسخ داد.`;
  }

  return "ارتباط با بک‌اند برای ورود برقرار نشد.";
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAppSelector((state) => state.auth.token);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [hasConfirmedPhone, setHasConfirmedPhone] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [devLogin, { error, isLoading }] = useDevLoginMutation();
  const normalizedPhone = useMemo(() => normalizeNumberInput(phoneNumber), [phoneNumber]);
  const canContinue = normalizedPhone.length >= 8 && normalizedPhone.length <= 20;
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/";

  if (token) {
    return <Navigate replace to="/" />;
  }

  async function handlePhoneStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!canContinue) {
      setFormError("شماره تلفن باید بین ۸ تا ۲۰ رقم باشد.");
      return;
    }

    setHasConfirmedPhone(true);
  }

  async function handleDevLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!canContinue) {
      setFormError("شماره تلفن باید بین ۸ تا ۲۰ رقم باشد.");
      setHasConfirmedPhone(false);
      return;
    }

    try {
      const result = await devLogin({
        phone_number: normalizedPhone,
        display_name: displayName.trim() || undefined
      }).unwrap();
      dispatch(setDevLoginSession(result));
      navigate(from, { replace: true });
    } catch {
      // RTK Query exposes the request error through `error`; no sensitive values are logged.
    }
  }

  return (
    <main className="min-h-screen bg-ratab-night text-slate-100 light:bg-slate-100 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.22),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.18),transparent_30%),linear-gradient(135deg,#05050a_0%,#0f172a_58%,#05050a_100%)] light:bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_32%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_55%,#f8fafc_100%)]" />
      <div className="relative z-10 mx-auto grid min-h-screen max-w-6xl items-center gap-6 px-4 py-8 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-xl font-black text-slate-950 shadow-emerald-soft">
                ر
              </div>
              <div>
                <p className="text-xl font-black text-white light:text-slate-950">ورود توسعه رتب</p>
                <p className="text-xs text-slate-400 light:text-slate-500">بدون OTP و فقط برای محیط dev</p>
              </div>
            </div>
            <ThemeToggle />
          </div>

          {!hasConfirmedPhone ? (
            <form className="space-y-5" onSubmit={handlePhoneStep}>
              <div>
                <label className="text-sm font-bold text-slate-200 light:text-slate-700" htmlFor="phone-number">
                  شماره تلفن
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 light:border-slate-200 light:bg-white">
                  <Phone className="h-5 w-5 text-emerald-300" />
                  <input
                    autoComplete="tel"
                    className="h-10 flex-1 bg-transparent text-left text-base font-bold tracking-wide text-white outline-none placeholder:text-slate-500 light:text-slate-950"
                    dir="ltr"
                    id="phone-number"
                    inputMode="tel"
                    maxLength={20}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                    placeholder="09120000000"
                    value={phoneNumber}
                  />
                </div>
              </div>

              {formError ? <p className="text-sm font-bold text-amber-200 light:text-amber-700">{formError}</p> : null}

              <Button className="w-full" disabled={!canContinue} type="submit">
                ادامه
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleDevLogin}>
              <StatusBadge tone="amber">
                <Info className="h-3.5 w-3.5" />
                بک‌اند فعلا رمز عبور را پشتیبانی نمی‌کند
              </StatusBadge>
              <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
                طبق قرارداد فعلی، ورود فقط با endpoint توسعه انجام می‌شود. رمز یا کد یکبارمصرف در
                فرانت‌اند شبیه‌سازی نمی‌شود.
              </p>

              <div>
                <label className="text-sm font-bold text-slate-200 light:text-slate-700" htmlFor="display-name">
                  نام نمایشی اختیاری
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 light:border-slate-200 light:bg-white">
                  <UserRound className="h-5 w-5 text-violet-300" />
                  <input
                    autoComplete="name"
                    className="h-10 flex-1 bg-transparent text-sm text-white outline-none placeholder:text-slate-500 light:text-slate-950"
                    id="display-name"
                    maxLength={160}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="مثلا: کاربر توسعه رتب"
                    value={displayName}
                  />
                </div>
              </div>

              {formError || error ? (
                <p className="text-sm font-bold text-amber-200 light:text-amber-700">
                  {formError ?? getErrorMessage(error)}
                </p>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row">
                <Button className="flex-1" disabled={isLoading} type="submit">
                  <CheckCircle2 className="h-4 w-4" />
                  {isLoading ? "در حال ورود" : "ورود توسعه"}
                </Button>
                <Button
                  className="flex-1"
                  disabled={isLoading}
                  onClick={() => setHasConfirmedPhone(false)}
                  variant="secondary"
                >
                  ویرایش شماره
                </Button>
              </div>
            </form>
          )}
        </GlassCard>

        <GlassCard className="p-6 sm:p-8">
          <StatusBadge tone="emerald">قرارداد امن فاز ۳</StatusBadge>
          <h1 className="mt-5 text-3xl font-black leading-tight text-white light:text-slate-950">
            ورود تلفنی فقط به اندازه پشتیبانی بک‌اند فعال است
          </h1>
          <div className="mt-5 space-y-4 text-sm leading-7 text-slate-300 light:text-slate-600">
            <p>توکن فقط در sessionStorage همین مرورگر ذخیره می‌شود و در لاگ نمایش داده نمی‌شود.</p>
            <p>بعد از ورود، مسیرهای اصلی پشت محافظ قرار می‌گیرند و اطلاعات کاربر از /api/auth/me/ بررسی می‌شود.</p>
            <p>ساخت شرکت در فاز بعدی فعال می‌شود؛ این فاز فقط CTA آن را بعد از اولین ورود برجسته می‌کند.</p>
          </div>
        </GlassCard>
      </div>
    </main>
  );
}
