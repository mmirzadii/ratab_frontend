import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { classNames } from "../../../shared/utils/classNames";
import { addToast } from "../../ui/uiSlice";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import {
  useListAdminCompaniesQuery,
  useRestoreAdminCompanyMutation,
  useSuspendAdminCompanyMutation,
  useTransferAdminCompanyOwnershipMutation
} from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useStepUp } from "../stepUpContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

export function AdminCompaniesPage() {
  const dispatch = useAppDispatch();
  const { runWithStepUp } = useStepUp();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const search = params.get("search") ?? "";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [targetMemberId, setTargetMemberId] = useState("");

  const { data, isLoading, error } = useListAdminCompaniesQuery({ page, search: search || undefined });
  const [suspend] = useSuspendAdminCompanyMutation();
  const [restore] = useRestoreAdminCompanyMutation();
  const [transfer] = useTransferAdminCompanyOwnershipMutation();

  async function runAction(action: () => Promise<unknown>, msg: string) {
    if (!selectedId || !reason.trim()) return;
    try {
      await runWithStepUp(action);
      dispatch(addToast({ message: msg, type: "success" }));
      setReason("");
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <AdminPageFrame status={`${data?.count ?? 0} شرکت`} title="شرکت‌ها">
      <input
        className={inputCls}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("search", e.target.value);
          else next.delete("search");
          next.delete("page");
          setParams(next);
        }}
        placeholder="جستجو…"
        value={search}
      />

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <AdminTable headers={["نام", "شناسه", ""]}>
        {(data?.results ?? []).map((company) => (
          <tr className="border-b border-ui-border-subtle" key={company.id}>
            <td className="px-3 py-2.5 font-bold">{company.name}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{company.id}</td>
            <td className="px-3 py-2.5">
              <button
                className={classNames(
                  "text-xs font-bold",
                  selectedId === company.id ? "text-ui-primary" : "text-ui-text-secondary hover:text-ui-primary"
                )}
                onClick={() => setSelectedId(selectedId === company.id ? null : company.id)}
                type="button"
              >
                {selectedId === company.id ? "بستن" : "مدیریت"}
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      {selectedId ? (
        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
          <h2 className="text-sm font-black">عملیات شرکت #{selectedId}</h2>
          <Field className="mt-2" label="دلیل" required>
            <input className={inputCls} onChange={(e) => setReason(e.target.value)} value={reason} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runAction(
                  () => suspend({ companyId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "شرکت تعلیق شد."
                )
              }
              variant="danger"
            >
              تعلیق
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runAction(
                  () => restore({ companyId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "شرکت بازیابی شد."
                )
              }
            >
              بازیابی
            </Button>
          </div>
          <div className="mt-4 border-t border-ui-border-subtle pt-3">
            <p className="text-xs font-black">انتقال مالکیت</p>
            <Field className="mt-2" label="شناسه عضویت مالک جدید" required>
              <input
                className={`${inputCls} ltr`}
                dir="ltr"
                onChange={(e) => setTargetMemberId(e.target.value)}
                value={targetMemberId}
              />
            </Field>
            <Button
              className="mt-2"
              disabled={!reason.trim() || !targetMemberId.trim()}
              onClick={() =>
                void runAction(
                  () =>
                    transfer({
                      companyId: selectedId,
                      body: {
                        reason: reason.trim(),
                        target_member_id: Number(targetMemberId)
                      }
                    }).unwrap(),
                  "مالکیت منتقل شد."
                )
              }
              variant="secondary"
            >
              انتقال مالکیت
            </Button>
          </div>
        </div>
      ) : null}

      <PaginationBar
        count={data?.count ?? 0}
        onPageChange={(p) => {
          const next = new URLSearchParams(params);
          if (p > 1) next.set("page", String(p));
          else next.delete("page");
          setParams(next);
        }}
        page={page}
      />
    </AdminPageFrame>
  );
}
