import { useState } from "react";
import { useSearchParams } from "react-router-dom";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { addToast } from "../../ui/uiSlice";
import { Can } from "../Can";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import {
  useGetAdminUserQuery,
  useGetAdminUserSubscriptionsQuery,
  useGetAdminUserWalletQuery,
  useListAdminUsersQuery,
  useReactivateAdminUserMutation,
  useRevokeAdminUserSessionsMutation,
  useSuspendAdminUserMutation
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

export function AdminUsersPage() {
  const dispatch = useAppDispatch();
  const { runWithPasskeyStepUp: runWithStepUp } = useAdminPasskeyStepUp();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const search = params.get("search") ?? "";
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [reason, setReason] = useState("");

  const { data, isLoading, error } = useListAdminUsersQuery({ page, search: search || undefined });
  const { data: detail } = useGetAdminUserQuery(selectedId!, { skip: !selectedId });
  const { data: wallet } = useGetAdminUserWalletQuery(selectedId!, {
    skip: !selectedId
  });
  const { data: subs } = useGetAdminUserSubscriptionsQuery(selectedId!, {
    skip: !selectedId
  });
  const [suspend] = useSuspendAdminUserMutation();
  const [reactivate] = useReactivateAdminUserMutation();
  const [revokeSessions] = useRevokeAdminUserSessionsMutation();

  async function runUserAction(action: () => Promise<unknown>, msg: string) {
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
    <AdminPageFrame status={`${data?.count ?? 0} کاربر`} title="کاربران">
      <input
        className={inputCls}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("search", e.target.value);
          else next.delete("search");
          next.delete("page");
          setParams(next);
        }}
        placeholder="جستجو نام یا شماره…"
        value={search}
      />

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <AdminTable headers={["نام", "شماره", "وضعیت", ""]}>
        {(data?.results ?? []).map((user) => (
          <tr className="border-b border-ui-border-subtle" key={user.id}>
            <td className="px-3 py-2.5 font-bold">{user.display_name}</td>
            <td className="px-3 py-2.5 font-mono text-xs ltr">{user.phone_number}</td>
            <td className="px-3 py-2.5">
              <StatusBadge tone={user.is_active ? "success" : "danger"}>
                {user.is_active ? "فعال" : "غیرفعال"}
              </StatusBadge>
            </td>
            <td className="px-3 py-2.5">
              <button
                className={classNames(
                  "text-xs font-bold",
                  selectedId === user.id ? "text-ui-primary" : "text-ui-text-secondary hover:text-ui-primary"
                )}
                onClick={() => setSelectedId(selectedId === user.id ? null : user.id)}
                type="button"
              >
                {selectedId === user.id ? "بستن" : "جزئیات"}
              </button>
            </td>
          </tr>
        ))}
      </AdminTable>

      {selectedId && detail ? (
        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
          <h2 className="text-sm font-black">{detail.display_name}</h2>
          <p className="font-mono text-xs ltr text-ui-text-muted">{detail.phone_number}</p>
          <Field className="mt-3" label="دلیل" required>
            <input className={inputCls} onChange={(e) => setReason(e.target.value)} value={reason} />
          </Field>
          <div className="mt-2 flex flex-wrap gap-2">
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runUserAction(
                  () => suspend({ userId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "کاربر تعلیق شد."
                )
              }
              variant="danger"
            >
              تعلیق
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runUserAction(
                  () => reactivate({ userId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "کاربر فعال شد."
                )
              }
            >
              فعال‌سازی
            </Button>
            <Button
              disabled={!reason.trim()}
              onClick={() =>
                void runUserAction(
                  () => revokeSessions({ userId: selectedId, body: { reason: reason.trim() } }).unwrap(),
                  "نشست‌ها لغو شد."
                )
              }
              variant="secondary"
            >
              لغو نشست‌ها
            </Button>
          </div>
          <Can capability="admin.wallets.view">
            <div className="mt-3 rounded-lg bg-ui-surface-subtle p-2">
              <p className="text-xs font-black">کیف پول</p>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[10px] ltr">
                {safeStr(wallet)}
              </pre>
            </div>
          </Can>
          <Can capability="admin.subscriptions.view">
            <div className="mt-2 rounded-lg bg-ui-surface-subtle p-2">
              <p className="text-xs font-black">اشتراک‌ها</p>
              <pre className="mt-1 max-h-32 overflow-auto whitespace-pre-wrap font-mono text-[10px] ltr">
                {safeStr(subs)}
              </pre>
            </div>
          </Can>
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
