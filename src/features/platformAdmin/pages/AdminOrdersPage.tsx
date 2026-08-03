import { useState } from "react";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { addToast } from "../../ui/uiSlice";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import {
  useCancelAdminPaymentOrderMutation,
  useGetAdminPaymentOrderQuery,
  useListAdminPaymentOrdersQuery,
  useRetryAdminPaymentOrderVerificationMutation
} from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { useAdminPasskeyStepUp } from "../adminSecurityContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

function safeStr(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export function AdminOrdersPage() {
  const dispatch = useAppDispatch();
  const { runWithPasskeyStepUp: runWithStepUp } = useAdminPasskeyStepUp();
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const { data, isLoading, error } = useListAdminPaymentOrdersQuery({ page });
  const { data: detail } = useGetAdminPaymentOrderQuery(selectedId!, { skip: !selectedId });
  const [cancel] = useCancelAdminPaymentOrderMutation();
  const [retry] = useRetryAdminPaymentOrderVerificationMutation();

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
    <AdminPageFrame status={`${data?.count ?? 0} سفارش`} title="سفارش‌های پرداخت">
      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <AdminTable headers={["شناسه", "وضعیت", "بسته", "مبلغ", ""]}>
        {(data?.results ?? []).map((order) => (
          <tr className="border-b border-ui-border-subtle" key={order.id}>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{order.id}</td>
            <td className="px-3 py-2.5">
              <StatusBadge>{String(order.status ?? "—")}</StatusBadge>
            </td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{order.package_code_snapshot}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">
              {order.price_amount_snapshot} {order.currency_snapshot}
            </td>
            <td className="px-3 py-2.5">
              <button
                className={classNames(
                  "text-xs font-bold",
                  selectedId === order.id ? "text-ui-primary" : "text-ui-text-secondary hover:text-ui-primary"
                )}
                onClick={() => setSelectedId(selectedId === order.id ? null : order.id)}
                type="button"
              >
                جزئیات
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      {selectedId && detail ? (
        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
          <h2 className="text-sm font-black">سفارش #{selectedId}</h2>
          <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded-lg bg-ui-surface-subtle p-2 font-mono text-[10px] ltr">
            {safeStr(detail)}
          </pre>
          <Field className="mt-3" label="دلیل" required>
            <input className={inputCls} onChange={(e) => setReason(e.target.value)} value={reason} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runAction(
                  () => cancel({ orderId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "سفارش لغو شد."
                )
              }
              variant="danger"
            >
              لغو
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runAction(
                  () => retry({ orderId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "تأیید مجدد در صف قرار گرفت."
                )
              }
              variant="secondary"
            >
              تلاش مجدد تأیید
            </Button>
          </div>
        </div>
      ) : null}

      <PaginationBar count={data?.count ?? 0} onPageChange={setPage} page={page} />
    </AdminPageFrame>
  );
}
