import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { addToast } from "../ui/uiSlice";
import {
  useCloseMySupportTicketMutation,
  useGetMySupportTicketQuery,
  useReopenMySupportTicketMutation,
  useReplyMySupportTicketMutation
} from "./supportApi";
import { formatPlatformAdminError } from "../platformAdmin/platformAdminErrors";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

export function SupportTicketDetailPage() {
  const { ticketId } = useParams<{ ticketId: string }>();
  const id = Number(ticketId);
  const dispatch = useAppDispatch();
  const { data: ticket, error, isLoading, refetch } = useGetMySupportTicketQuery(id, { skip: !id });
  const [reply] = useReplyMySupportTicketMutation();
  const [close] = useCloseMySupportTicketMutation();
  const [reopen] = useReopenMySupportTicketMutation();
  const [body, setBody] = useState("");

  const messages = (ticket?.messages ?? []).filter((m) => m.kind !== "internal_note");

  async function handleReply() {
    if (!body.trim()) return;
    try {
      await reply({ ticketId: id, body: { body: body.trim() } }).unwrap();
      dispatch(addToast({ message: "پیام ارسال شد.", type: "success" }));
      setBody("");
      void refetch();
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleClose() {
    try {
      await close({ ticketId: id }).unwrap();
      dispatch(addToast({ message: "تیکت بسته شد.", type: "success" }));
      void refetch();
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  async function handleReopen() {
    try {
      await reopen({ ticketId: id }).unwrap();
      dispatch(addToast({ message: "تیکت بازگشایی شد.", type: "success" }));
      void refetch();
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 py-4" dir="rtl">
      <PageHeader
        actions={
          <Link className="text-xs font-bold text-ui-primary hover:underline" to="/support/tickets">
            بازگشت
          </Link>
        }
        title={ticket?.subject ?? "تیکت"}
      />

      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}
      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}

      {ticket ? (
        <>
          <StatusBadge>{ticket.status ?? "—"}</StatusBadge>

          <div className="space-y-2">
            {messages.map((msg) => (
              <div className="rounded-lg border border-ui-border-subtle bg-ui-surface-subtle p-3 text-sm" key={msg.id}>
                <p className="text-[10px] font-bold text-ui-text-muted">{msg.kind}</p>
                <p className="mt-1 whitespace-pre-wrap">{msg.body}</p>
              </div>
            ))}
          </div>

          {ticket.status !== "closed" ? (
            <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
              <Field label="پاسخ شما" required>
                <textarea className={inputCls} onChange={(e) => setBody(e.target.value)} rows={3} value={body} />
              </Field>
              <Button className="mt-2" disabled={!body.trim()} onClick={() => void handleReply()}>
                ارسال
              </Button>
            </div>
          ) : null}

          <div className="flex gap-2">
            {ticket.status !== "closed" ? (
              <Button onClick={() => void handleClose()} variant="secondary">
                بستن تیکت
              </Button>
            ) : (
              <Button onClick={() => void handleReopen()} variant="secondary">
                بازگشایی
              </Button>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
