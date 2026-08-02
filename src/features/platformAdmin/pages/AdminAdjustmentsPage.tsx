import { useState } from "react";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { addToast } from "../../ui/uiSlice";
import { Can } from "../Can";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import {
  useApplyAdminAdjustmentMutation,
  useApproveAdminAdjustmentMutation,
  useCreateAdminAdjustmentMutation,
  useListAdminAdjustmentsQuery,
  useRejectAdminAdjustmentMutation
} from "../platformAdminApi";
import type { AdjustmentCreateBody } from "../platformAdminTypes";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useStepUp } from "../stepUpContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

const KINDS = ["grant", "debit", "refund", "reversal"] as const;

export function AdminAdjustmentsPage() {
  const dispatch = useAppDispatch();
  const { runWithStepUp } = useStepUp();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [form, setForm] = useState<AdjustmentCreateBody>({
    target_user_id: 0,
    kind: "grant",
    amount: "0",
    reason: "",
    idempotency_key: crypto.randomUUID(),
    reference: ""
  });

  const { data, isLoading, error } = useListAdminAdjustmentsQuery({ page });
  const [create] = useCreateAdminAdjustmentMutation();
  const [approve] = useApproveAdminAdjustmentMutation();
  const [reject] = useRejectAdminAdjustmentMutation();
  const [apply] = useApplyAdminAdjustmentMutation();

  async function handleCreate() {
    if (!form.target_user_id || !form.reason.trim()) return;
    try {
      await runWithStepUp(() => create(form).unwrap());
      dispatch(addToast({ message: "درخواست ثبت شد.", type: "success" }));
      setForm((prev) => ({ ...prev, reason: "", idempotency_key: crypto.randomUUID() }));
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function runAdjAction(action: () => Promise<unknown>, msg: string) {
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
    <AdminPageFrame title="اصلاح‌های مالی">
      <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
        <h2 className="text-sm font-black">درخواست جدید</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="target_user_id" required>
            <input
              className={`${inputCls} ltr`}
              dir="ltr"
              onChange={(e) => setForm((p) => ({ ...p, target_user_id: Number(e.target.value) }))}
              type="number"
              value={form.target_user_id || ""}
            />
          </Field>
          <Field label="kind" required>
            <select
              className={inputCls}
              onChange={(e) => setForm((p) => ({ ...p, kind: e.target.value as AdjustmentCreateBody["kind"] }))}
              value={form.kind}
            >
              {KINDS.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </select>
          </Field>
          <Field label="amount" required>
            <input
              className={`${inputCls} ltr font-mono`}
              dir="ltr"
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              value={form.amount}
            />
          </Field>
          <Field label="reason" required>
            <input className={inputCls} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} value={form.reason} />
          </Field>
          <Field label="reference" optional>
            <input className={inputCls} onChange={(e) => setForm((p) => ({ ...p, reference: e.target.value }))} value={form.reference ?? ""} />
          </Field>
        </div>
        <Button className="mt-3" onClick={() => void handleCreate()}>
          ثبت درخواست
        </Button>
      </div>

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <AdminTable headers={["شناسه", "کاربر", "نوع", "مبلغ", "وضعیت", ""]}>
        {(data?.results ?? []).map((adj) => (
          <tr className="border-b border-ui-border-subtle" key={adj.id}>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{adj.id}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{adj.target_user_id}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{adj.kind}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{adj.amount}</td>
            <td className="px-3 py-2.5">
              <StatusBadge>{String(adj.status ?? "—")}</StatusBadge>
            </td>
            <td className="px-3 py-2.5">
              <button className="text-xs font-bold text-ui-primary" onClick={() => setSelectedId(adj.id)} type="button">
                عملیات
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      {selectedId ? (
        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
          <Field label="دلیل" required>
            <input className={inputCls} onChange={(e) => setReason(e.target.value)} value={reason} />
          </Field>
          <Can capability="admin.wallets.adjust.approve">
            <div className="mt-2 flex flex-wrap gap-2">
              <Button
                disabled={!reason.trim()}
                onClick={() =>
                  void runAdjAction(
                    () => approve({ adjustmentId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                    "تأیید شد."
                  )
                }
              >
                تأیید
              </Button>
              <Button
                disabled={!reason.trim()}
                onClick={() =>
                  void runAdjAction(
                    () => reject({ adjustmentId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                    "رد شد."
                  )
                }
                variant="danger"
              >
                رد
              </Button>
              <Button
                disabled={!reason.trim()}
                onClick={() =>
                  void runAdjAction(
                    () => apply({ adjustmentId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                    "اعمال شد."
                  )
                }
                variant="secondary"
              >
                اعمال
              </Button>
            </div>
          </Can>
        </div>
      ) : null}

      <PaginationBar count={data?.count ?? 0} onPageChange={setPage} page={page} />
    </AdminPageFrame>
  );
}
