import { Fingerprint, KeyRound, ShieldAlert } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";
import { GlassCard } from "../../shared/components/GlassCard";
import {
  AdminPasskeyApiError,
  enrollmentReauthenticate,
  fetchRegistrationOptions,
  fetchSessionAuthOptions,
  listPasskeys,
  verifyRegistration,
  verifySessionAuth
} from "./adminPasskeyClient";
import { useAdminSecurity } from "./adminSecurityContext";
import type { SafePasskey } from "./adminSecurityTypes";
import {
  classifyWebAuthnDomError,
  createPasskeyCredential,
  getPasskeyAssertion,
  isWebAuthnSupported,
  WEBAUTHN_UNSUPPORTED_MESSAGE,
  webAuthnUiMessage
} from "./adminWebAuthn";
import { formatPlatformAdminError } from "./platformAdminErrors";

const DEFAULT_LABELS = ["لپ‌تاپ شخصی", "Windows Hello", "گوشی اصلی", "کلید امنیتی پشتیبان"];

export function AdminPasskeyEnrollmentPage({ mode }: { mode: "initial" | "root_second" | "reset" }) {
  const { security, refetchSecurity } = useAdminSecurity();
  const [password, setPassword] = useState("");
  const [label, setLabel] = useState(DEFAULT_LABELS[0]!);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<SafePasskey[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const submitting = useRef(false);

  const isRootSecond = mode === "root_second";
  const needsPassword = mode === "initial" || mode === "reset";

  useEffect(() => {
    headingRef.current?.focus();
  }, [mode]);

  useEffect(() => {
    if (!isRootSecond) return;
    void listPasskeys()
      .then(setExisting)
      .catch(() => setExisting([]));
  }, [isRootSecond]);

  async function handleRegister(event?: FormEvent) {
    event?.preventDefault();
    if (submitting.current || busy) return;
    if (!isWebAuthnSupported()) {
      setError(WEBAUTHN_UNSUPPORTED_MESSAGE);
      return;
    }

    submitting.current = true;
    setBusy(true);
    setError(null);
    setStatusMessage("در حال آماده‌سازی…");

    try {
      if (needsPassword) {
        if (!password.trim()) {
          setError("رمز ورود حساب لازم است.");
          setBusy(false);
          submitting.current = false;
          return;
        }
        try {
          await enrollmentReauthenticate(password);
        } catch (err) {
          setPassword("");
          setError(formatPlatformAdminError(err, "تایید امنیتی ناموفق بود."));
          setStatusMessage(null);
          passwordRef.current?.focus();
          return;
        }
        setPassword("");
      }

      setStatusMessage("در انتظار Passkey…");
      const options = await fetchRegistrationOptions();
      const credential = await createPasskeyCredential(options);
      await verifyRegistration({ credential, label: label.trim() || "Passkey" });
      setStatusMessage("Passkey ثبت شد.");
      await refetchSecurity();
    } catch (err) {
      if (err instanceof AdminPasskeyApiError) {
        setError(formatPlatformAdminError({ data: err.data, status: err.status }));
      } else {
        setError(webAuthnUiMessage(classifyWebAuthnDomError(err)));
      }
      setStatusMessage(null);
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  const title =
    mode === "root_second"
      ? "ثبت Passkey پشتیبان"
      : mode === "reset"
        ? "فعال‌سازی مجدد ورود امن مدیریت"
        : "فعال‌سازی ورود امن مدیریت";

  const description =
    mode === "root_second"
      ? "برای محافظت از حساب اصلی مدیریت، حداقل دو Passkey متفاوت ثبت کنید."
      : "برای ورود به پنل مدیریت، یک Passkey برای حساب خود ثبت کنید.";

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-4 py-8">
      <GlassCard className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ui-border-subtle bg-ui-surface-subtle text-ui-primary">
            {mode === "root_second" ? (
              <KeyRound aria-hidden className="h-6 w-6" />
            ) : (
              <Fingerprint aria-hidden className="h-6 w-6" />
            )}
          </div>
          <div>
            <h1
              className="text-xl font-black text-ui-text-primary outline-none"
              id={titleId}
              ref={headingRef}
              tabIndex={-1}
            >
              {title}
            </h1>
            <p className="mt-2 text-sm leading-7 text-ui-text-secondary">{description}</p>
            <p className="mt-2 text-xs leading-6 text-ui-text-muted">
              می‌توانید از Windows Hello، اثر انگشت، قفل دستگاه، تلفن همراه یا کلید امنیتی سازگار
              استفاده کنید.
            </p>
          </div>
        </div>

        {isRootSecond ? (
          <div className="mt-5 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-4 text-sm">
            <p>
              Passkey فعال:{" "}
              <strong className="font-black">{security?.passkey_count ?? 0}</strong> از{" "}
              <strong className="font-black">{security?.required_passkey_count ?? 2}</strong>
            </p>
            <p className="mt-2 text-xs text-ui-text-muted">
              توصیه می‌شود Passkey دوم روی دستگاه یا کلید سخت‌افزاری دیگری باشد.
            </p>
            {existing.length ? (
              <ul className="mt-3 space-y-1 text-xs text-ui-text-secondary">
                {existing.map((item) => (
                  <li key={item.id}>{item.label}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}

        <form className="mt-5 space-y-4" onSubmit={(event) => void handleRegister(event)}>
          {needsPassword ? (
            <Field label="رمز ورود حساب" required>
              <input
                autoComplete="current-password"
                className="min-h-11 w-full rounded-lg border border-ui-border-default px-3 py-2 text-sm"
                onChange={(event) => setPassword(event.target.value)}
                ref={passwordRef}
                type="password"
                value={password}
              />
            </Field>
          ) : null}

          <Field label="نام نمایشی Passkey" optional>
            <select
              className="min-h-11 w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 text-sm"
              onChange={(event) => setLabel(event.target.value)}
              value={label}
            >
              {DEFAULT_LABELS.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </Field>

          {statusMessage ? (
            <p aria-live="polite" className="text-sm text-ui-text-muted">
              {statusMessage}
            </p>
          ) : null}

          {error ? (
            <p aria-live="assertive" className="text-sm font-bold text-ui-danger" role="alert">
              {error}
            </p>
          ) : null}

          <Button className="min-h-11 w-full sm:w-auto" disabled={busy} type="submit">
            {busy ? "در حال ثبت…" : isRootSecond ? "افزودن Passkey" : "ثبت Passkey"}
          </Button>
        </form>
      </GlassCard>
    </div>
  );
}

export function AdminPasskeyVerificationPage() {
  const { refetchSecurity, refetchMe, clearAdminCaches } = useAdminSecurity();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const submitting = useRef(false);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  async function handleVerify() {
    if (submitting.current || busy) return;
    if (!isWebAuthnSupported()) {
      setError(WEBAUTHN_UNSUPPORTED_MESSAGE);
      return;
    }
    submitting.current = true;
    setBusy(true);
    setError(null);
    try {
      const options = await fetchSessionAuthOptions();
      const assertion = await getPasskeyAssertion(options);
      await verifySessionAuth(assertion);
      clearAdminCaches();
      await refetchSecurity();
      await refetchMe();
    } catch (err) {
      if (err instanceof AdminPasskeyApiError) {
        setError(formatPlatformAdminError({ data: err.data, status: err.status }));
      } else {
        setError(webAuthnUiMessage(classifyWebAuthnDomError(err)));
      }
    } finally {
      setBusy(false);
      submitting.current = false;
    }
  }

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-xl flex-col justify-center px-4 py-8">
      <GlassCard className="p-6 sm:p-8">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-ui-border-subtle bg-ui-surface-subtle text-ui-primary">
            <Fingerprint aria-hidden className="h-6 w-6" />
          </div>
          <div>
            <h1
              className="text-xl font-black text-ui-text-primary outline-none"
              ref={headingRef}
              tabIndex={-1}
            >
              ورود به پنل مدیریت
            </h1>
            <p className="mt-2 text-sm leading-7 text-ui-text-secondary">
              برای ادامه، هویت خود را با Passkey تایید کنید.
            </p>
          </div>
        </div>

        {error ? (
          <p aria-live="assertive" className="mt-4 text-sm font-bold text-ui-danger" role="alert">
            {error}
          </p>
        ) : null}

        <Button className="mt-6 min-h-11" disabled={busy} onClick={() => void handleVerify()}>
          {busy ? "در حال تایید…" : "تایید و ورود"}
        </Button>
      </GlassCard>
    </div>
  );
}

export function AdminSecurityBlockedPage({
  kind
}: {
  kind: "suspended" | "revoked" | "unsupported" | "root_recovery";
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] w-full max-w-lg flex-col justify-center px-4 py-8">
      <GlassCard className="p-6 text-center">
        <ShieldAlert className="mx-auto h-8 w-8 text-ui-warning" />
        <h1 className="mt-3 text-lg font-black text-ui-text-primary">
          {kind === "unsupported"
            ? "محیط پشتیبانی‌نشده"
            : kind === "root_recovery"
              ? "بازیابی حساب اصلی"
              : "دسترسی مدیریت در دسترس نیست"}
        </h1>
        <p className="mt-2 text-sm leading-7 text-ui-text-secondary">
          {kind === "unsupported"
            ? WEBAUTHN_UNSUPPORTED_MESSAGE
            : kind === "root_recovery"
              ? "بازیابی حساب اصلی مدیریت باید از طریق دستور امن سرور انجام شود."
              : kind === "suspended"
                ? "عضویت مدیریتی شما تعلیق شده است."
                : "عضویت مدیریتی شما لغو شده است."}
        </p>
      </GlassCard>
    </div>
  );
}
