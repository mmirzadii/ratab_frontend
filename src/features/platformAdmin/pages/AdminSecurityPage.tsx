import { useCallback, useEffect, useState } from "react";

import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { AdminPageFrame } from "../AdminPageFrame";
import {
  AdminPasskeyApiError,
  deletePasskey,
  fetchRegistrationOptions,
  listPasskeys,
  renamePasskey,
  verifyRegistration
} from "../adminPasskeyClient";
import { useAdminPasskeyStepUp, useAdminSecurity } from "../adminSecurityContext";
import type { SafePasskey } from "../adminSecurityTypes";
import {
  classifyWebAuthnDomError,
  createPasskeyCredential,
  webAuthnUiMessage
} from "../adminWebAuthn";
import { formatPlatformAdminError } from "../platformAdminErrors";

export function AdminSecurityPage() {
  const { security, refetchSecurity } = useAdminSecurity();
  const { runWithPasskeyStepUp } = useAdminPasskeyStepUp();
  const [passkeys, setPasskeys] = useState<SafePasskey[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteReason, setDeleteReason] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  const isRoot = Boolean(security?.is_root_superuser);
  const minimum = security?.required_passkey_count ?? (isRoot ? 2 : 1);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setPasskeys(await listPasskeys());
      await refetchSecurity();
    } catch (err) {
      setError(formatPlatformAdminError(err));
    } finally {
      setLoading(false);
    }
  }, [refetchSecurity]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleAdd() {
    setError(null);
    setNotice(null);
    try {
      await runWithPasskeyStepUp(async () => {
        const options = await fetchRegistrationOptions();
        const credential = await createPasskeyCredential(options);
        await verifyRegistration({ credential, label: "Passkey جدید" });
      });
      setNotice("Passkey جدید ثبت شد.");
      await refresh();
    } catch (err) {
      if (err instanceof Error && err.message === "PASSKEY_STEP_UP_CANCELLED") return;
      if (err instanceof AdminPasskeyApiError) {
        setError(formatPlatformAdminError({ data: err.data, status: err.status }));
      } else {
        setError(webAuthnUiMessage(classifyWebAuthnDomError(err)));
      }
    }
  }

  async function handleRename(id: number) {
    if (!renameValue.trim()) return;
    setBusyId(id);
    setError(null);
    try {
      await renamePasskey(id, renameValue.trim());
      setRenameId(null);
      setRenameValue("");
      await refresh();
    } catch (err) {
      setError(formatPlatformAdminError(err));
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(item: SafePasskey) {
    if (passkeys.length <= minimum) {
      setError(
        isRoot
          ? "حساب اصلی مدیریت باید حداقل دو Passkey فعال داشته باشد."
          : "برای حفظ دسترسی مدیریت، حداقل یک Passkey فعال لازم است."
      );
      return;
    }
    if (!deleteReason.trim()) {
      setError("ثبت دلیل برای حذف Passkey الزامی است.");
      return;
    }
    setBusyId(item.id);
    setError(null);
    try {
      await runWithPasskeyStepUp(() => deletePasskey(item.id, deleteReason.trim()));
      setDeleteId(null);
      setDeleteReason("");
      setNotice("Passkey حذف شد.");
      await refresh();
    } catch (err) {
      if (err instanceof Error && err.message === "PASSKEY_STEP_UP_CANCELLED") return;
      setError(formatPlatformAdminError(err));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <AdminPageFrame title="امنیت حساب مدیریت">
      <p className="mb-4 text-sm leading-7 text-ui-text-secondary">
        {isRoot
          ? "حساب اصلی مدیریت باید حداقل دو Passkey فعال داشته باشد."
          : "برای حفظ دسترسی مدیریت، حداقل یک Passkey فعال لازم است."}
      </p>

      {error ? (
        <p aria-live="assertive" className="mb-3 text-sm font-bold text-ui-danger" role="alert">
          {error}
        </p>
      ) : null}
      {notice ? (
        <p aria-live="polite" className="mb-3 text-sm font-bold text-ui-success">
          {notice}
        </p>
      ) : null}

      <div className="mb-4">
        <Button className="min-h-11" onClick={() => void handleAdd()} type="button">
          افزودن Passkey
        </Button>
      </div>

      {loading ? (
        <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p>
      ) : (
        <ul className="space-y-3">
          {passkeys.map((item) => (
            <li
              className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm"
              key={item.id}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-black text-ui-text-primary">{item.label}</p>
                  <p className="mt-1 text-xs text-ui-text-muted">
                    ایجاد: {item.created_at ? new Date(item.created_at).toLocaleString("fa-IR") : "—"}
                    {" · "}
                    آخرین استفاده:{" "}
                    {item.last_used_at
                      ? new Date(item.last_used_at).toLocaleString("fa-IR")
                      : "—"}
                  </p>
                  {item.authenticator_attachment ? (
                    <p className="mt-1 text-xs text-ui-text-muted">
                      نوع: {item.authenticator_attachment}
                    </p>
                  ) : null}
                  <p className="mt-1 text-xs font-bold text-ui-success">فعال</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    disabled={busyId === item.id}
                    onClick={() => {
                      setRenameId(item.id);
                      setRenameValue(item.label);
                      setDeleteId(null);
                    }}
                    size="sm"
                    type="button"
                    variant="secondary"
                  >
                    تغییر نام
                  </Button>
                  <Button
                    disabled={busyId === item.id || passkeys.length <= minimum}
                    onClick={() => {
                      setDeleteId(item.id);
                      setDeleteReason("");
                      setRenameId(null);
                    }}
                    size="sm"
                    type="button"
                    variant="danger"
                  >
                    حذف
                  </Button>
                </div>
              </div>
              {renameId === item.id ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <Field className="flex-1" label="نام جدید">
                    <input
                      className="min-h-11 w-full rounded-lg border border-ui-border-default px-3 text-sm"
                      onChange={(event) => setRenameValue(event.target.value)}
                      value={renameValue}
                    />
                  </Field>
                  <Button
                    disabled={busyId === item.id}
                    onClick={() => void handleRename(item.id)}
                    type="button"
                  >
                    ذخیره
                  </Button>
                </div>
              ) : null}
              {deleteId === item.id ? (
                <div className="mt-3 space-y-2 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3">
                  <p className="text-xs text-ui-text-secondary">
                    حذف Passkey «{item.label}» — این عملیات برگشت‌پذیر نیست.
                  </p>
                  <Field label="دلیل" required>
                    <input
                      className="min-h-11 w-full rounded-lg border border-ui-border-default px-3 text-sm"
                      onChange={(event) => setDeleteReason(event.target.value)}
                      value={deleteReason}
                    />
                  </Field>
                  <div className="flex gap-2">
                    <Button
                      disabled={busyId === item.id}
                      onClick={() => void handleDelete(item)}
                      type="button"
                      variant="danger"
                    >
                      تایید حذف
                    </Button>
                    <Button
                      onClick={() => setDeleteId(null)}
                      type="button"
                      variant="secondary"
                    >
                      انصراف
                    </Button>
                  </div>
                </div>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </AdminPageFrame>
  );
}
