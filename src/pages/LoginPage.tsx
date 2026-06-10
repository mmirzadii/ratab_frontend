import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Phone, UserRound } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { setDevLoginSession } from "../features/auth/authSlice";
import { useDevLoginMutation } from "../features/auth/authApi";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { normalizeNumberInput } from "../shared/utils/numberText";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    const status = String(error.status);

    if (status === "404") {
      return "ورود در بک‌اند فعال نیست. لطفاً با مدیر سیستم تماس بگیرید.";
    }

    if (status === "400") {
      return "شماره تلفن پذیرفته نشد. شماره را بدون فاصله وارد کنید.";
    }

    return "خطا در ورود. دوباره تلاش کنید.";
  }

  return "ارتباط با سرور برقرار نشد. اتصال اینترنت را بررسی کنید.";
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
  const from = (location.state as { from?: Location } | null)?.from?.pathname ?? "/companies";

  if (token) {
    return <Navigate replace to="/companies" />;
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
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-8">
        <GlassCard className="w-full max-w-md p-6 sm:p-8">
          <div className="mb-8 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-xl font-black text-slate-950 shadow-emerald-soft">
                م
              </div>
              <p className="text-xl font-black text-white light:text-slate-950">متریل</p>
            </div>
            <ThemeToggle />
          </div>

          {!hasConfirmedPhone ? (
            <form className="space-y-5" onSubmit={handlePhoneStep}>
              <div>
                <label className="text-base font-bold text-slate-200 light:text-slate-700" htmlFor="phone-number">
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

              <Button className="w-full text-base" disabled={!canContinue} type="submit">
                ادامه
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </form>
          ) : (
            <form className="space-y-5" onSubmit={handleDevLogin}>
              <div>
                <label className="text-base font-bold text-slate-200 light:text-slate-700" htmlFor="display-name">
                  نام نمایشی (اختیاری)
                </label>
                <div className="mt-2 flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/45 px-3 py-2 light:border-slate-200 light:bg-white">
                  <UserRound className="h-5 w-5 text-violet-300" />
                  <input
                    autoComplete="name"
                    className="h-10 flex-1 bg-transparent text-base text-white outline-none placeholder:text-slate-500 light:text-slate-950"
                    id="display-name"
                    maxLength={160}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="مثلاً: علی محمدی"
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
                <Button className="flex-1 text-base" disabled={isLoading} type="submit">
                  <CheckCircle2 className="h-5 w-5" />
                  {isLoading ? "در حال ورود" : "ورود"}
                </Button>
                <Button
                  className="flex-1 text-base"
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
      </div>
    </main>
  );
}
