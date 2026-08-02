import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { addToast } from "../../ui/uiSlice";
import { AdminPageFrame } from "../AdminPageFrame";
import { CapabilityPicker } from "../CapabilityPicker";
import {
  useGetCapabilityCatalogQuery,
  useGetPlatformAdminHistoryQuery,
  useGetPlatformAdminQuery,
  useReactivatePlatformAdminMutation,
  useRevokePlatformAdminMutation,
  useUpdatePlatformAdminMutation
} from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useStepUp } from "../stepUpContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

function fmtDate(iso?: string | null) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function safeStr(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminAdminDetailPage() {
  const { membershipId } = useParams<{ membershipId: string }>();
  const id = Number(membershipId);
  const dispatch = useAppDispatch();
  const { runWithStepUp } = useStepUp();
  const { data: admin, error, isLoading } = useGetPlatformAdminQuery(id, { skip: !id });
  const { data: catalog } = useGetCapabilityCatalogQuery();
  const { data: historyRaw } = useGetPlatformAdminHistoryQuery(id, { skip: !id });
  const [updateAdmin] = useUpdatePlatformAdminMutation();
  const [revokeAdmin] = useRevokePlatformAdminMutation();
  const [reactivateAdmin] = useReactivatePlatformAdminMutation();

  const [caps, setCaps] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [actionReason, setActionReason] = useState("");

  useEffect(() => {
    if (admin) setCaps([...admin.granted_capabilities]);
  }, [admin]);

  const history = Array.isArray(historyRaw)
    ? historyRaw
    : historyRaw && typeof historyRaw === "object" && "results" in historyRaw
      ? ((historyRaw as { results: unknown[] }).results ?? [])
      : [];

  async function handleSave() {
    if (!reason.trim()) return;
    try {
      await runWithStepUp(() =>
        updateAdmin({ membershipId: id, body: { capabilities: caps, reason: reason.trim() } }).unwrap()
      );
      dispatch(addToast({ message: "دسترسی‌ها به‌روز شد.", type: "success" }));
      setReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleRevoke() {
    if (!actionReason.trim()) return;
    try {
      await runWithStepUp(() =>
        revokeAdmin({ membershipId: id, body: { reason: actionReason.trim() } }).unwrap()
      );
      dispatch(addToast({ message: "عضویت لغو شد.", type: "success" }));
      setActionReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleReactivate() {
    if (!actionReason.trim()) return;
    try {
      await runWithStepUp(() =>
        reactivateAdmin({ membershipId: id, body: { reason: actionReason.trim() } }).unwrap()
      );
      dispatch(addToast({ message: "مدیر فعال شد.", type: "success" }));
      setActionReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <AdminPageFrame
      actions={
        <Link className="text-xs font-bold text-ui-primary hover:underline" to="/admin/admins">
          بازگشت
        </Link>
      }
      title={admin?.display_name ?? "جزئیات مدیر"}
    >
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}
      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {admin ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
            <p className="font-mono text-xs ltr">{admin.phone_number}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge tone={admin.is_active ? "success" : "danger"}>
                {admin.is_active ? "فعال" : "غیرفعال"}
              </StatusBadge>
              {admin.expires_at ? (
                <StatusBadge tone="warning">انقضا: {fmtDate(admin.expires_at)}</StatusBadge>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-ui-text-muted">ایجاد: {fmtDate(admin.created_at)}</p>
          </div>

          {catalog ? (
            <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
              <h2 className="text-sm font-black">دسترسی‌ها</h2>
              <CapabilityPicker
                baseline={admin.baseline_capabilities.length ? admin.baseline_capabilities : catalog.baseline}
                onChange={setCaps}
                optional={catalog.optional}
                selected={caps}
              />
              <Field className="mt-3" label="دلیل تغییر" required>
                <input className={inputCls} onChange={(e) => setReason(e.target.value)} value={reason} />
              </Field>
              <Button className="mt-2" disabled={!reason.trim()} onClick={() => void handleSave()}>
                ذخیره
              </Button>
            </div>
          ) : null}

          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
            <h2 className="text-sm font-black">عملیات</h2>
            <Field className="mt-2" label="دلیل" required>
              <input className={inputCls} onChange={(e) => setActionReason(e.target.value)} value={actionReason} />
            </Field>
            <div className="mt-2 flex flex-wrap gap-2">
              {admin.is_active ? (
                <Button disabled={!actionReason.trim()} onClick={() => void handleRevoke()} variant="danger">
                  لغو عضویت
                </Button>
              ) : (
                <Button disabled={!actionReason.trim()} onClick={() => void handleReactivate()}>
                  فعال‌سازی مجدد
                </Button>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
            <h2 className="text-sm font-black">تاریخچه</h2>
            {history.length === 0 ? (
              <p className="mt-2 text-xs text-ui-text-muted">رویدادی ثبت نشده.</p>
            ) : (
              <ul className="mt-2 max-h-64 space-y-2 overflow-y-auto">
                {history.map((entry, idx) => (
                  <li className="rounded-lg bg-ui-surface-subtle p-2 text-xs" key={idx}>
                    <pre className="whitespace-pre-wrap font-mono ltr text-[10px]">{safeStr(entry)}</pre>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
