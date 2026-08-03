import { useState } from "react";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { addToast } from "../../ui/uiSlice";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import {
  useArchiveAdminTokenPackageMutation,
  useCreateAdminTokenPackageMutation,
  useListAdminTokenPackagesQuery,
  useUpdateAdminTokenPackageMutation
} from "../platformAdminApi";
import type { TokenPackageAdminRequest } from "../platformAdminTypes";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useAdminPasskeyStepUp } from "../adminSecurityContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

const SNAPSHOT_WARN =
  "تغییرات فقط روی خریدهای آینده اثر دارد. کد پس از استفاده غیرقابل تغییر است. بایگانی حذف سخت نیست.";

const emptyForm: TokenPackageAdminRequest = {
  code: "",
  title_fa: "",
  description_fa: "",
  token_amount: "0",
  price_amount: "0",
  currency: "IRR",
  display_order: 0,
  is_active: true
};

export function AdminPackagesPage() {
  const dispatch = useAppDispatch();
  const { runWithPasskeyStepUp: runWithStepUp } = useAdminPasskeyStepUp();
  const [page, setPage] = useState(1);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveReason, setArchiveReason] = useState("");
  const { data, isLoading, error } = useListAdminTokenPackagesQuery({ page });
  const [create] = useCreateAdminTokenPackageMutation();
  const [update] = useUpdateAdminTokenPackageMutation();
  const [archive] = useArchiveAdminTokenPackageMutation();

  function setField<K extends keyof TokenPackageAdminRequest>(key: K, value: TokenPackageAdminRequest[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    try {
      if (editId) {
        await update({ packageId: editId, body: form }).unwrap();
        dispatch(addToast({ message: "بسته به‌روز شد.", type: "success" }));
      } else {
        await create(form).unwrap();
        dispatch(addToast({ message: "بسته ایجاد شد.", type: "success" }));
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
      await runWithStepUp(() => archive({ packageId: id, body: { reason: archiveReason.trim() } }).unwrap());
      dispatch(addToast({ message: "بسته بایگانی شد.", type: "success" }));
      setArchiveReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <AdminPageFrame title="بسته‌های توکن">
      <p className="rounded-lg border border-ui-warning/30 bg-ui-warning-soft/20 p-3 text-xs text-ui-text-secondary">
        {SNAPSHOT_WARN}
      </p>

      <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
        <h2 className="text-sm font-black">{editId ? "ویرایش بسته" : "بسته جدید"}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {(["code", "title_fa", "description_fa"] as const).map((key) => (
            <Field key={key} label={key}>
              <input
                className={classNames(inputCls, key === "code" && "ltr font-mono")}
                dir={key === "code" ? "ltr" : undefined}
                disabled={editId != null && key === "code"}
                onChange={(e) => setField(key, e.target.value)}
                value={form[key] ?? ""}
              />
            </Field>
          ))}
          {(["token_amount", "price_amount", "currency", "display_order"] as const).map((key) => (
            <Field key={key} label={key}>
              <input
                className={`${inputCls} ltr font-mono`}
                dir="ltr"
                onChange={(e) =>
                  setField(key, key === "display_order" ? Number(e.target.value) : e.target.value)
                }
                type={key === "display_order" ? "number" : "text"}
                value={String(form[key] ?? "")}
              />
            </Field>
          ))}
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

      <AdminTable headers={["کد", "عنوان", "توکن", "قیمت", "وضعیت", ""]}>
        {(data?.results ?? []).map((pkg) => (
          <tr className="border-b border-ui-border-subtle" key={pkg.id}>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{pkg.code}</td>
            <td className="px-3 py-2.5">{pkg.title_fa}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{pkg.token_amount}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{pkg.price_amount}</td>
            <td className="px-3 py-2.5">
              <StatusBadge tone={pkg.archived_at ? "neutral" : pkg.is_active ? "success" : "warning"}>
                {pkg.archived_at ? "بایگانی" : pkg.is_active ? "فعال" : "غیرفعال"}
              </StatusBadge>
            </td>
            <td className="px-3 py-2.5">
              {!pkg.archived_at ? (
                <button
                  className="text-xs font-bold text-ui-primary"
                  onClick={() => {
                    setEditId(pkg.id);
                    setForm({
                      code: pkg.code,
                      title_fa: pkg.title_fa,
                      description_fa: pkg.description_fa ?? "",
                      token_amount: pkg.token_amount,
                      price_amount: pkg.price_amount,
                      currency: pkg.currency ?? "IRR",
                      display_order: pkg.display_order ?? 0,
                      is_active: pkg.is_active ?? true
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
          بایگانی بسته انتخاب‌شده
        </Button>
      ) : null}

      <PaginationBar count={data?.count ?? 0} onPageChange={setPage} page={page} />
    </AdminPageFrame>
  );
}
