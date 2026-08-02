import { Shield } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { addToast } from "../../ui/uiSlice";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import { CapabilityPicker } from "../CapabilityPicker";
import {
  useCreatePlatformAdminMutation,
  useGetCapabilityCatalogQuery,
  useListPlatformAdminsQuery,
  useLookupAdminCandidateByPhoneMutation,
  useTransferPlatformSuperuserMutation
} from "../platformAdminApi";
import type { AdminCandidate } from "../platformAdminTypes";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useStepUp } from "../stepUpContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

export function AdminAdminsPage() {
  const dispatch = useAppDispatch();
  const { runWithStepUp } = useStepUp();
  const [page, setPage] = useState(1);
  const { data, isLoading, error } = useListPlatformAdminsQuery({ page });
  const { data: catalog } = useGetCapabilityCatalogQuery();
  const [lookup, { isLoading: lookingUp }] = useLookupAdminCandidateByPhoneMutation();
  const [createAdmin, { isLoading: creating }] = useCreatePlatformAdminMutation();
  const [transfer, { isLoading: transferring }] = useTransferPlatformSuperuserMutation();

  const [phone, setPhone] = useState("");
  const [candidate, setCandidate] = useState<AdminCandidate | null>(null);
  const [caps, setCaps] = useState<string[]>([]);
  const [reason, setReason] = useState("");
  const [transferPhone, setTransferPhone] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [keepPrevious, setKeepPrevious] = useState(true);

  async function handleLookup() {
    setCandidate(null);
    try {
      const result = await lookup({ phone_number: phone.trim() }).unwrap();
      setCandidate(result);
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleCreate() {
    if (!candidate || !reason.trim()) return;
    try {
      await runWithStepUp(() =>
        createAdmin({ phone_number: phone.trim(), capabilities: caps, reason: reason.trim() }).unwrap()
      );
      dispatch(addToast({ message: "مدیر جدید ایجاد شد.", type: "success" }));
      setPhone("");
      setCandidate(null);
      setCaps([]);
      setReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleTransfer() {
    if (!transferPhone.trim() || !transferReason.trim()) return;
    try {
      await runWithStepUp(() =>
        transfer({
          phone_number: transferPhone.trim(),
          reason: transferReason.trim(),
          keep_previous_as_admin: keepPrevious
        }).unwrap()
      );
      dispatch(addToast({ message: "انتقال مدیر ریشه انجام شد.", type: "success" }));
      setTransferPhone("");
      setTransferReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <AdminPageFrame status="فقط مدیر ریشه" title="مدیران پلتفرم">
      {error ? (
        <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p>
      ) : null}

      <section className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
        <h2 className="text-sm font-black">افزودن مدیر</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_auto]">
          <Field label="شماره موبایل (دقیق)" required>
            <input
              autoComplete="off"
              className={`${inputCls} ltr text-left`}
              dir="ltr"
              onChange={(e) => setPhone(e.target.value)}
              value={phone}
            />
          </Field>
          <Button disabled={!phone.trim() || lookingUp} onClick={() => void handleLookup()}>
            جستجو
          </Button>
        </div>
        {candidate ? (
          <div className="mt-3 rounded-lg bg-ui-surface-subtle p-3 text-xs">
            <p>
              <span className="font-bold">{candidate.display_name}</span> ·{" "}
              <span className="font-mono ltr">{candidate.phone_number}</span>
            </p>
            <p className="mt-1 text-ui-text-muted">
              فعال: {candidate.is_active ? "بله" : "خیر"} · تعلیق:{" "}
              {candidate.is_suspended ? "بله" : "خیر"}
            </p>
          </div>
        ) : null}
        {catalog && candidate ? (
          <div className="mt-3">
            <CapabilityPicker
              baseline={catalog.baseline}
              onChange={setCaps}
              optional={catalog.optional}
              selected={caps}
            />
          </div>
        ) : null}
        {candidate ? (
          <Field className="mt-3" label="دلیل" required>
            <textarea className={inputCls} onChange={(e) => setReason(e.target.value)} rows={2} value={reason} />
          </Field>
        ) : null}
        {candidate ? (
          <Button className="mt-3" disabled={creating || !reason.trim()} onClick={() => void handleCreate()}>
            ایجاد مدیر
          </Button>
        ) : null}
      </section>

      <section className="rounded-xl border border-ui-danger/30 bg-ui-surface p-4 shadow-ui-sm">
        <h2 className="text-sm font-black text-ui-danger">انتقال مدیر ریشه</h2>
        <p className="mt-1 text-xs text-ui-text-muted">عملیات حساس — نیازمند تأیید رمز.</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <Field label="شماره موبایل مقصد" required>
            <input
              autoComplete="off"
              className={`${inputCls} ltr text-left`}
              dir="ltr"
              onChange={(e) => setTransferPhone(e.target.value)}
              value={transferPhone}
            />
          </Field>
          <Field label="دلیل" required>
            <input className={inputCls} onChange={(e) => setTransferReason(e.target.value)} value={transferReason} />
          </Field>
        </div>
        <label className="mt-2 flex items-center gap-2 text-xs">
          <input checked={keepPrevious} onChange={(e) => setKeepPrevious(e.target.checked)} type="checkbox" />
          مدیر قبلی به‌عنوان مدیر عادی باقی بماند
        </label>
        <Button
          className="mt-3"
          disabled={transferring || !transferPhone.trim() || !transferReason.trim()}
          onClick={() => void handleTransfer()}
          variant="danger"
        >
          انتقال ریشه
        </Button>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-black">فهرست مدیران</h2>
        {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}
        <AdminTable headers={["نام", "شماره", "وضعیت", ""]}>
          {(data?.results ?? []).map((admin) => (
            <tr className="border-b border-ui-border-subtle last:border-0" key={admin.id}>
              <td className="px-3 py-2.5 font-bold">{admin.display_name}</td>
              <td className="px-3 py-2.5 font-mono text-xs ltr">{admin.phone_number}</td>
              <td className="px-3 py-2.5">
                <StatusBadge tone={admin.is_active ? "success" : "danger"}>
                  {admin.is_active ? "فعال" : "غیرفعال"}
                </StatusBadge>
              </td>
              <td className="px-3 py-2.5">
                <Link className="text-xs font-bold text-ui-primary hover:underline" to={`/admin/admins/${admin.id}`}>
                  جزئیات
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
        {!isLoading && (data?.results.length ?? 0) === 0 ? (
          <div className="flex justify-center py-8">
            <Shield className="h-8 w-8 text-ui-text-muted" />
          </div>
        ) : null}
        <PaginationBar count={data?.count ?? 0} onPageChange={setPage} page={page} />
      </section>
    </AdminPageFrame>
  );
}
