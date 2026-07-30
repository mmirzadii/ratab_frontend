import { type FormEvent, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, KeyRound, LockKeyhole, Phone, UserRound } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import {
  useSignupCompleteMutation,
  useSignupStartMutation,
  useSignupVerifyMutation
} from "../features/auth/authApi";
import { sessionAuthenticated } from "../features/auth/authSlice";
import {
  SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE,
  SIGNUP_PASSWORD_WEAK_WARNING,
  classifySignupCompleteError,
  isSignupPasswordWeak,
  meetsSignupPasswordMinLength
} from "../features/auth/signupPassword";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { getApiErrorMessage } from "../shared/utils/apiError";
import { normalizeNumberInput, normalizePersianDigits } from "../shared/utils/numberText";

type SignupStep = "phone" | "verify" | "password";

function digitsOnly(value: string): string {
  return normalizePersianDigits(value).replace(/\D/g, "");
}

export function SignupPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const status = useAppSelector((state) => state.auth.status);

  const [step, setStep] = useState<SignupStep>("phone");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [signupTicket, setSignupTicket] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [passwordFieldError, setPasswordFieldError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<string | null>(null);
  const [passwordSubmitAttempted, setPasswordSubmitAttempted] = useState(false);

  const [signupStart, { isLoading: starting }] = useSignupStartMutation();
  const [signupVerify, { isLoading: verifying }] = useSignupVerifyMutation();
  const [signupComplete, { isLoading: completing }] = useSignupCompleteMutation();

  const normalizedPhone = useMemo(() => normalizeNumberInput(phoneNumber), [phoneNumber]);
  const codeDigits = useMemo(() => digitsOnly(verificationCode), [verificationCode]);
  const isBusy = starting || verifying || completing;
  const passwordTooShort = !meetsSignupPasswordMinLength(password);
  const showMinLengthError =
    passwordTooShort && (passwordSubmitAttempted || password.length > 0);
  const showWeakWarning = !passwordTooShort && isSignupPasswordWeak(password);

  if (status === "unknown") {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-ui-canvas text-ui-text-primary">
        <GlassCard className="max-w-sm p-6 text-center">
          <p className="text-lg font-black">در حال بررسی نشست</p>
        </GlassCard>
      </main>
    );
  }

  if (status === "authenticated") {
    return <Navigate replace to="/companies" />;
  }

  function resetSignupToPhone(message: string | null = null) {
    setStep("phone");
    setChallengeId("");
    setVerificationCode("");
    setSignupTicket("");
    setPassword("");
    setPasswordConfirmation("");
    setPasswordFieldError(null);
    setPasswordConfirmError(null);
    setPasswordSubmitAttempted(false);
    setFormError(message);
  }

  async function handlePhoneStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (normalizedPhone.length < 8 || normalizedPhone.length > 20) {
      setFormError("شماره تلفن باید بین ۸ تا ۲۰ رقم باشد.");
      return;
    }

    try {
      const result = await signupStart({ phone_number: normalizedPhone }).unwrap();
      setChallengeId(result.challenge_id);
      setPhoneNumber(result.phone_number || normalizedPhone);
      setStep("verify");
    } catch (error) {
      setFormError(getApiErrorMessage(error, "شروع ثبت‌نام ناموفق بود. دوباره تلاش کنید."));
    }
  }

  async function handleVerifyStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);

    if (!codeDigits) {
      setFormError("کد تأیید عددی را وارد کنید.");
      return;
    }

    try {
      const result = await signupVerify({
        phone_number: normalizedPhone,
        challenge_id: challengeId,
        verification_code: codeDigits
      }).unwrap();
      setSignupTicket(result.signup_ticket);
      setPassword("");
      setPasswordConfirmation("");
      setPasswordFieldError(null);
      setPasswordConfirmError(null);
      setPasswordSubmitAttempted(false);
      setStep("password");
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "status" in error
          ? Number((error as { status?: unknown }).status)
          : null;
      if (statusCode === 400) {
        resetSignupToPhone("کد یا چالش منقضی/نامعتبر است. ثبت‌نام را از ابتدا شروع کنید.");
        return;
      }
      setFormError(getApiErrorMessage(error, "تأیید کد ناموفق بود."));
    }
  }

  async function handleCompleteStep(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setPasswordFieldError(null);
    setPasswordConfirmError(null);
    setPasswordSubmitAttempted(true);

    if (!meetsSignupPasswordMinLength(password)) {
      setPasswordFieldError(SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE);
      return;
    }

    if (!passwordConfirmation) {
      setPasswordConfirmError("تکرار رمز عبور را وارد کنید.");
      return;
    }

    if (password !== passwordConfirmation) {
      setPasswordConfirmError("رمز عبور و تکرار آن یکسان نیست.");
      return;
    }

    try {
      const result = await signupComplete({
        signup_ticket: signupTicket,
        password,
        password_confirmation: passwordConfirmation,
        display_name: displayName.trim() || undefined
      }).unwrap();
      dispatch(sessionAuthenticated({ user: result.user, highlightCreateCompany: true }));
      navigate("/companies", { replace: true });
    } catch (error) {
      const classified = classifySignupCompleteError(
        error,
        getApiErrorMessage(error, "تکمیل ثبت‌نام ناموفق بود.")
      );
      if (classified.kind === "password") {
        setPasswordFieldError(classified.message);
        return;
      }
      if (classified.kind === "password_confirmation") {
        setPasswordConfirmError(classified.message);
        return;
      }
      if (classified.kind === "ticket") {
        resetSignupToPhone(classified.message);
        return;
      }
      setFormError(classified.message);
    }
  }

  return (
    <main className="relative min-h-dvh overflow-x-hidden overflow-y-auto bg-ui-canvas text-ui-text-primary">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,color-mix(in_srgb,var(--ui-primary)_18%,transparent),transparent_34%),radial-gradient(circle_at_82%_20%,color-mix(in_srgb,var(--brand-500)_14%,transparent),transparent_30%)]" />

      <div className="relative z-10 flex min-h-dvh items-center justify-center px-3 py-4 sm:px-4 sm:py-8">
        <div className="w-full max-w-md">
          <GlassCard className="w-full p-4 sm:p-8">
            <div className="mb-5 flex items-center justify-between gap-4 sm:mb-8">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-lg font-black text-white shadow-brand-soft sm:h-12 sm:w-12 sm:text-xl">
                  م
                </div>
                <div>
                  <p className="text-lg font-black text-white sm:text-xl">ثبت‌نام</p>
                  <p className="text-xs text-ui-text-muted">
                    {step === "phone" && "شماره تلفن"}
                    {step === "verify" && "کد تأیید"}
                    {step === "password" && "رمز عبور"}
                  </p>
                </div>
              </div>
              <ThemeToggle />
            </div>

            {step === "phone" ? (
              <form className="space-y-4 sm:space-y-5" onSubmit={handlePhoneStep}>
                <div>
                  <label className="text-base font-bold text-ui-text-secondary" htmlFor="signup-phone">
                    شماره تلفن
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 py-2 focus-within:border-ui-primary/30">
                    <Phone className="h-5 w-5 shrink-0 text-ui-primary" />
                    <input
                      autoComplete="tel"
                      className="h-10 min-w-0 flex-1 bg-transparent text-left text-base font-bold tracking-wide text-white outline-none placeholder:text-ui-text-muted"
                      dir="ltr"
                      id="signup-phone"
                      inputMode="tel"
                      maxLength={20}
                      onChange={(event) => setPhoneNumber(event.target.value)}
                      placeholder="09120000000"
                      value={phoneNumber}
                    />
                  </div>
                </div>

                {formError ? <p className="text-sm font-bold text-amber-200">{formError}</p> : null}

                <Button className="w-full text-base" disabled={isBusy} type="submit">
                  {starting ? "در حال ارسال" : "ادامه"}
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </form>
            ) : null}

            {step === "verify" ? (
              <form className="space-y-4 sm:space-y-5" onSubmit={handleVerifyStep}>
                <p className="rounded-lg border border-amber-300/20 bg-amber-400/10 p-3 text-sm leading-7 text-amber-100">
                  کد تأیید را وارد کنید. در محیط توسعهٔ محلی ممکن است هر کد عددی غیرخالی پذیرفته شود؛
                  این حالت فقط برای توسعه است و به‌معنای ارسال واقعی پیامک نیست.
                </p>

                <div>
                  <label className="text-base font-bold text-ui-text-secondary" htmlFor="signup-code">
                    کد تأیید
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 py-2 focus-within:border-ui-primary/30">
                    <KeyRound className="h-5 w-5 shrink-0 text-ui-primary" />
                    <input
                      autoComplete="one-time-code"
                      className="h-10 min-w-0 flex-1 bg-transparent text-left text-base font-bold tracking-wide text-white outline-none placeholder:text-ui-text-muted"
                      dir="ltr"
                      id="signup-code"
                      inputMode="numeric"
                      onChange={(event) => setVerificationCode(event.target.value)}
                      placeholder="12345"
                      value={verificationCode}
                    />
                  </div>
                </div>

                {formError ? <p className="text-sm font-bold text-amber-200">{formError}</p> : null}

                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button className="flex-1 text-base" disabled={isBusy || !codeDigits} type="submit">
                    <CheckCircle2 className="h-5 w-5" />
                    {verifying ? "در حال تأیید" : "تأیید کد"}
                  </Button>
                  <Button
                    className="flex-1 text-base"
                    disabled={isBusy}
                    onClick={() => {
                      setStep("phone");
                      setFormError(null);
                    }}
                    type="button"
                    variant="secondary"
                  >
                    ویرایش شماره
                  </Button>
                </div>
              </form>
            ) : null}

            {step === "password" ? (
              <form className="space-y-4 sm:space-y-5" onSubmit={handleCompleteStep}>
                <div>
                  <label className="text-base font-bold text-ui-text-secondary" htmlFor="signup-display-name">
                    نام نمایشی (اختیاری)
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 py-2 focus-within:border-ui-primary/30">
                    <UserRound className="h-5 w-5 shrink-0 text-ui-primary" />
                    <input
                      autoComplete="nickname"
                      className="h-10 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-ui-text-muted"
                      id="signup-display-name"
                      maxLength={160}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="مثلاً: علی محمدی"
                      value={displayName}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-base font-bold text-ui-text-secondary" htmlFor="signup-password">
                    رمز عبور
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 py-2 focus-within:border-ui-primary/30">
                    <LockKeyhole className="h-5 w-5 shrink-0 text-ui-primary" />
                    <input
                      autoComplete="new-password"
                      className="h-10 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-ui-text-muted"
                      dir="ltr"
                      id="signup-password"
                      onChange={(event) => {
                        setPassword(event.target.value);
                        setPasswordFieldError(null);
                        setFormError(null);
                      }}
                      type="password"
                      value={password}
                    />
                  </div>
                  {passwordFieldError || showMinLengthError ? (
                    <p className="mt-2 text-sm font-bold text-rose-300" role="alert">
                      {passwordFieldError || SIGNUP_PASSWORD_MIN_LENGTH_MESSAGE}
                    </p>
                  ) : showWeakWarning ? (
                    <p className="mt-2 text-sm font-bold text-amber-300" role="status">
                      {SIGNUP_PASSWORD_WEAK_WARNING}
                    </p>
                  ) : null}
                </div>

                <div>
                  <label className="text-base font-bold text-ui-text-secondary" htmlFor="signup-password-confirm">
                    تکرار رمز عبور
                  </label>
                  <div className="mt-2 flex min-w-0 items-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface/45 px-3 py-2 focus-within:border-ui-primary/30">
                    <LockKeyhole className="h-5 w-5 shrink-0 text-ui-primary" />
                    <input
                      autoComplete="new-password"
                      className="h-10 min-w-0 flex-1 bg-transparent text-base text-white outline-none placeholder:text-ui-text-muted"
                      dir="ltr"
                      id="signup-password-confirm"
                      onChange={(event) => {
                        setPasswordConfirmation(event.target.value);
                        setPasswordConfirmError(null);
                        setFormError(null);
                      }}
                      type="password"
                      value={passwordConfirmation}
                    />
                  </div>
                  {passwordConfirmError ? (
                    <p className="mt-2 text-sm font-bold text-rose-300" role="alert">
                      {passwordConfirmError}
                    </p>
                  ) : null}
                </div>

                {formError ? <p className="text-sm font-bold text-amber-200">{formError}</p> : null}

                <Button
                  className="w-full text-base"
                  disabled={isBusy || passwordTooShort}
                  type="submit"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  {completing ? "در حال ایجاد حساب" : "تکمیل ثبت‌نام"}
                </Button>
              </form>
            ) : null}

            <p className="mt-5 text-center text-sm text-ui-text-muted">
              حساب دارید؟{" "}
              <Link className="font-bold text-ui-primary hover:text-ui-primary" to="/login">
                ورود
              </Link>
            </p>
          </GlassCard>
        </div>
      </div>
    </main>
  );
}
