import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAppDispatch } from "../../../app/hooks";
import { Button } from "../../../shared/components/Button";
import { Field } from "../../../shared/components/Field";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { classNames } from "../../../shared/utils/classNames";
import { addToast } from "../../ui/uiSlice";
import { Can } from "../Can";
import { AdminPageFrame } from "../AdminPageFrame";
import {
  useAssignAdminSupportTicketMutation,
  useChangeAdminSupportTicketPriorityMutation,
  useCloseAdminSupportTicketMutation,
  useGetAdminSupportTicketQuery,
  useNoteAdminSupportTicketMutation,
  useReopenAdminSupportTicketMutation,
  useReplyAdminSupportTicketMutation,
  useResolveAdminSupportTicketMutation
} from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";
import { hasCapability } from "../platformAdminCapabilities";
import { usePlatformAdmin } from "../usePlatformAdmin";
import { useStepUp } from "../stepUpContext";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

export function AdminTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const id = Number(ticketId);
  const dispatch = useAppDispatch();
  const { runWithStepUp } = useStepUp();
  const { capabilities } = usePlatformAdmin();
  const canSeeInternal = hasCapability(capabilities, "admin.tickets.internal_note");

  const { data: ticket, error, isLoading, refetch } = useGetAdminSupportTicketQuery(id, { skip: !id });
  const [reply] = useReplyAdminSupportTicketMutation();
  const [note] = useNoteAdminSupportTicketMutation();
  const [assign] = useAssignAdminSupportTicketMutation();
  const [changePriority] = useChangeAdminSupportTicketPriorityMutation();
  const [resolve] = useResolveAdminSupportTicketMutation();
  const [close] = useCloseAdminSupportTicketMutation();
  const [reopen] = useReopenAdminSupportTicketMutation();

  const [replyBody, setReplyBody] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [reason, setReason] = useState("");
  const [assignId, setAssignId] = useState("");
  const [priority, setPriority] = useState("normal");

  const messages = (ticket?.messages ?? []).filter(
    (m) => canSeeInternal || m.kind !== "internal_note"
  );

  async function runAction(action: () => Promise<unknown>, success: string) {
    try {
      await action();
      dispatch(addToast({ message: success, type: "success" }));
      setReason("");
      void refetch();
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <AdminPageFrame
      actions={
        <Link className="text-xs font-bold text-ui-primary hover:underline" to="/admin/support/tickets">
          بازگشت
        </Link>
      }
      title={ticket?.subject ?? "تیکت"}
    >
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}
      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {ticket ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <StatusBadge>{ticket.status ?? "—"}</StatusBadge>
            <StatusBadge tone="info">{ticket.priority ?? "—"}</StatusBadge>
            <span className="font-mono text-xs ltr text-ui-text-muted">{ticket.public_id}</span>
          </div>

          <div className="space-y-2">
            {messages.map((msg) => (
              <div
                className={classNames(
                  "rounded-lg border p-3 text-sm",
                  msg.kind === "internal_note"
                    ? "border-ui-warning/40 bg-ui-warning-soft/30"
                    : "border-ui-border-subtle bg-ui-surface-subtle"
                )}
                key={msg.id}
              >
                <p className="text-[10px] font-bold text-ui-text-muted">{msg.kind}</p>
                <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
            <Field label="پاسخ عمومی" required>
              <textarea className={inputCls} onChange={(e) => setReplyBody(e.target.value)} rows={3} value={replyBody} />
            </Field>
            <Button
              className="mt-2"
              disabled={!replyBody.trim()}
              onClick={() =>
                void runAction(() => reply({ ticketId: id, body: { body: replyBody.trim() } }).unwrap(), "پاسخ ارسال شد.")
              }
            >
              ارسال پاسخ
            </Button>
          </div>

          <Can capability="admin.tickets.internal_note">
            <div className="rounded-xl border border-ui-warning/40 bg-ui-warning-soft/20 p-4">
              <Field label="یادداشت داخلی" required>
                <textarea className={inputCls} onChange={(e) => setNoteBody(e.target.value)} rows={2} value={noteBody} />
              </Field>
              <Button
                className="mt-2"
                disabled={!noteBody.trim()}
                onClick={() =>
                  void runAction(() => note({ ticketId: id, body: { body: noteBody.trim() } }).unwrap(), "یادداشت ثبت شد.")
                }
                variant="secondary"
              >
                ثبت یادداشت
              </Button>
            </div>
          </Can>

          <Field label="دلیل عملیات" optional>
            <input className={inputCls} onChange={(e) => setReason(e.target.value)} value={reason} />
          </Field>

          <Can capability="admin.tickets.assign">
            <div className="flex flex-wrap items-end gap-2">
              <Field label="شناسه عضویت">
                <input className={`${inputCls} w-32 ltr`} dir="ltr" onChange={(e) => setAssignId(e.target.value)} value={assignId} />
              </Field>
              <Button
                onClick={() =>
                  void runAction(
                    () =>
                      assign({
                        ticketId: id,
                        body: { membership_id: assignId ? Number(assignId) : null, reason: reason || undefined }
                      }).unwrap(),
                    "ارجاع انجام شد."
                  )
                }
                variant="secondary"
              >
                ارجاع
              </Button>
            </div>
          </Can>

          <Can capability="admin.tickets.manage_priority">
            <div className="flex flex-wrap items-end gap-2">
              <select className={inputCls} onChange={(e) => setPriority(e.target.value)} value={priority}>
                {["low", "normal", "high", "urgent"].map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <Button
                onClick={() =>
                  void runAction(
                    () => changePriority({ ticketId: id, body: { priority, reason: reason || undefined } }).unwrap(),
                    "اولویت تغییر کرد."
                  )
                }
                variant="secondary"
              >
                تغییر اولویت
              </Button>
            </div>
          </Can>

          <Can capability="admin.tickets.manage_status">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() =>
                  void runAction(
                    () => runWithStepUp(() => resolve({ ticketId: id, body: { reason: reason || "resolved" } }).unwrap()),
                    "تیکت حل شد."
                  )
                }
                variant="secondary"
              >
                حل‌شده
              </Button>
              <Button
                onClick={() =>
                  void runAction(
                    () => runWithStepUp(() => close({ ticketId: id, body: { reason: reason || "closed" } }).unwrap()),
                    "تیکت بسته شد."
                  )
                }
                variant="secondary"
              >
                بستن
              </Button>
              <Button
                onClick={() =>
                  void runAction(
                    () => runWithStepUp(() => reopen({ ticketId: id, body: { reason: reason || "reopened" } }).unwrap()),
                    "تیکت بازگشایی شد."
                  )
                }
                variant="secondary"
              >
                بازگشایی
              </Button>
            </div>
          </Can>
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
