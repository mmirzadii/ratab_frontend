import { useState } from "react";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { addToast } from "../../ui/uiSlice";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import {
  useArchiveAdminSubscriptionPlanMutation,
  useCreateAdminSubscriptionPlanMutation,
  useListAdminSubscriptionPlansQuery,
  useUpdateAdminSubscriptionPlanMutation
} from "../platformAdminApi";
import type { SubscriptionPlanAdminRequest } from "../platformAdminTypes";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useStepUp } from "../stepUpContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

const SNAPSHOT_WARN =
  "تغییرات فقط روی خریدهای آینده اثر دارد. کد پس از استفاده غیرقابل تغییر است. بایگانی حذف سخت نیست.";

const emptyForm: SubscriptionPlanAdminRequest = {
  code: "",
  title_fa: "",
  description_fa: "",
  duration_days: 30,
  daily_message_limit: null,
  max_attachment_bytes_per_message: null,
  price_amount: "0",
  currency: "IRR",
  display_order: 0,
  is_active: true
};

export function AdminPlansPage() {
  const dispatch = useAppDispatch();
  const { runWithStepUp } = useStepUp();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveReason, setArchiveReason] = useState("");
  const { data, isLoading, error } = useListAdminSubscriptionPlansQuery({ page });
  const [create] = useCreateAdminSubscriptionPlanMutation();
  const [update] = useUpdateAdminSubscriptionPlanMutation();
  const [archive] = useArchiveAdminSubscriptionPlanMutation();

  function setField<K extends keyof SubscriptionPlanAdminRequest>(key: K, value: SubscriptionPlanAdminRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      if (editId) {
        await update({ planId: editId, body: form }).unwrap();
        dispatch(addToast({ message: "پلن به‌روز شد.", type: "success" }));
      } else {
        await create(form).unwrap();
        dispatch(addToast({ message: "پلن ایجاد شد.", type: "success" }));
      }
      setEditId(null);
      setForm(emptyForm);
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleArchive(id: number) {
    if (!archiveReason.trim()) return;
    try {
      await runWithStepUp(() => archive({ planId: id, body: { reason: archiveReason.trim() } }).unwrap());
      dispatch(addToast({ message: "پلن بایگانی شد.", type: "success" }));
      setArchiveReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <AdminPageFrame title="پلن‌های اشتراک">
      <p className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft/20 p-3 text-xs text-ui-text-secondary">
        {SNAPSHOT_WARN}
      </p>

      <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
        <h2 className="text-sm font-black">{editId ? "ویرایش پلن" : "پلن جدید"}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="code">
            <input
              className={`${inputCls} ltr font-mono`}
              dir="ltr"
              disabled={editId != null}
              onChange={(e) => setField("code", e.target.value)}
              value={form.code}
            />
          </Field>
          <Field label="title_fa">
            <input className={inputCls} onChange={(e) => setField("title_fa", e.target.value)} value={form.title_fa} />
          </Field>
          <Field label="duration_days">
            <input
              className={`${inputCls} ltr`}
              dir="ltr"
              onChange={(e) => setField("duration_days", Number(e.target.value))}
              type="number"
              value={form.duration_days}
            />
          </Field>
          <Field label="price_amount">
            <input
              className={`${inputCls} ltr font-mono`}
              dir="ltr"
              onChange={(e) => setField("price_amount", e.target.value)}
              value={form.price_amount ?? ""}
            />
          </Field>
          <Field label="currency">
            <input className={`${inputCls} ltr font-mono`} dir="ltr" onChange={(e) => setField("currency", e.target.value)} value={form.currency ?? "IRR"} />
          </Field>
          <Field label="display_order">
            <input
              className={`${inputCls} ltr`}
              dir="ltr"
              onChange={(e) => setField("display_order", Number(e.target.value))}
              type="number"
              value={form.display_order ?? 0}
            />
          </Field>
          <label className="flex items-center gap-2 text-xs">
            <input checked={form.is_active ?? true} onChange={(e) => setField("is_active", e.target.checked)} type="checkbox" />
            فعال
          </label>
        </div>
        <div className="mt-3 flex gap-2">
          <Button onClick={() => void handleSave()}>{editId ? "ذخیره" : "ایجاد"}</Button>
          {editId ? (
            <Button onClick={() => { setEditId(null); setForm(emptyForm); }} variant="secondary">
              انصراف
            </Button>
          ) : null}
        </div>
      </div>

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <AdminTable headers={["کد", "عنوان", "مدت", "قیمت", "وضعیت", ""]}>
        {(data?.results ?? []).map((plan) => (
          <tr className="border-b border-ui-border-subtle" key={plan.id}>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{plan.code}</td>
            <td className="px-3 py-2.5">{plan.title_fa}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{plan.duration_days} روز</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{plan.price_amount}</td>
            <td className="px-3 py-2.5">
              <StatusBadge tone={plan.archived_at ? "neutral" : plan.is_active ? "success" : "warning"}>
                {plan.archived_at ? "بایگانی" : plan.is_active ? "فعال" : "غیرفعال"}
              </StatusBadge>
            </td>
            <td className="px-3 py-2.5">
              {!plan.archived_at ? (
                <button
                  className="text-xs font-bold text-ui-primary"
                  onClick={() => {
                    setEditId(plan.id);
                    setForm({
                      code: plan.code,
                      title_fa: plan.title_fa,
                      description_fa: plan.description_fa ?? "",
                      duration_days: plan.duration_days,
                      daily_message_limit: plan.daily_message_limit ?? null,
                      max_attachment_bytes_per_message: plan.max_attachment_bytes_per_message ?? null,
                      price_amount: plan.price_amount ?? "0",
                      currency: plan.currency ?? "IRR",
                      display_order: plan.display_order ?? 0,
                      is_active: plan.is_active ?? true
                    });
                  }}
                  type="button"
                >
                  ویرایش
                </button>
              ) : null}
            </td>
          </tr>
        ))}
      </AdminTable>

      <Field className="mt-3" label="دلیل بایگانی" required>
        <input className={inputCls} onChange={(e) => setArchiveReason(e.target.value)} value={archiveReason} />
      </Field>
      {editId ? (
        <Button className="mt-2" disabled={!archiveReason.trim()} onClick={() => void handleArchive(editId)} variant="danger">
          بایگانی پلن انتخاب‌شده
        </Button>
      ) : null}

      <PaginationBar count={data?.count ?? 0} onPageChange={setPage} page={page} />
    </AdminPageFrame>
  );
}
