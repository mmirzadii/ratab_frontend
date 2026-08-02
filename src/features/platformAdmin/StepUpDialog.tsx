import { useEffect, useId, useRef, useState, type FormEvent } from "react";

import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";
import { formatPlatformAdminError } from "./platformAdminErrors";
import { usePlatformAdminStepUpMutation } from "./platformAdminApi";

type Props = {
  open: boolean;
  onClose: () => void;
  onVerified: () => void;
};

export function StepUpDialog({ open, onClose, onVerified }: Props) {
  const titleId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [stepUp, { isLoading }] = usePlatformAdminStepUpMutation();

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError(null);
      return;
    }
    const timer = window.setTimeout(() => inputRef.current?.focus(), 30);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      await stepUp({ password }).unwrap();
      setPassword("");
      onVerified();
    } catch (err) {
      setPassword("");
      setError(formatPlatformAdminError(err, "تأیید رمز عبور انجام نشد."));
    }
  }

  return (
    <div
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-black/45 p-4"
      role="dialog"
    >
      <form
        className="w-full max-w-md rounded-xl border border-ui-border-subtle bg-ui-surface p-5 shadow-ui-sm"
        onSubmit={(event) => void handleSubmit(event)}
      >
        <h2 className="text-lg font-black text-ui-text-primary" id={titleId}>
          تأیید هویت مجدد
        </h2>
        <p className="mt-1 text-sm text-ui-text-secondary">
          برای ادامهٔ عملیات حساس، رمز عبور فعلی خود را وارد کنید. رمز ذخیره نمی‌شود.
        </p>

        <div className="mt-4">
          <Field label="رمز عبور" required>
            <input
              autoComplete="current-password"
              className="h-11 w-full rounded-lg border border-ui-border-default bg-ui-canvas px-3 text-sm"
              onChange={(event) => setPassword(event.target.value)}
              ref={inputRef}
              type="password"
              value={password}
            />
          </Field>
        </div>

        {error ? <p className="mt-3 text-sm font-bold text-ui-danger">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button disabled={isLoading} onClick={onClose} type="button" variant="secondary">
            انصراف
          </Button>
          <Button disabled={isLoading || !password.trim()} type="submit">
            {isLoading ? "در حال تأیید…" : "تأیید و ادامه"}
          </Button>
        </div>
      </form>
    </div>
  );
}
