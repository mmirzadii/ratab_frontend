import { Headset } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { Button } from "../../shared/components/Button";
import { Field } from "../../shared/components/Field";
import { EmptyState } from "../../shared/components/EmptyState";
import { PageHeader } from "../../shared/components/PageHeader";
import { StatusBadge } from "../../shared/components/StatusBadge";
import { addToast } from "../ui/uiSlice";
import {
  useCreateMySupportTicketMutation,
  useListMySupportTicketsQuery
} from "./supportApi";
import { formatPlatformAdminError } from "../platformAdmin/platformAdminErrors";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

const CATEGORIES = [
  "account",
  "billing",
  "payment",
  "subscription",
  "pricebook",
  "financial_document",
  "company",
  "technical",
  "other"
] as const;

export function SupportTicketsPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { data, isLoading, error } = useListMySupportTicketsQuery();
  const [create, { isLoading: creating }] = useCreateMySupportTicketMutation();
  const [showForm, setShowForm] = useState(false);
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>("other");
  const [body, setBody] = useState("");

  async function handleCreate() {
    if (!subject.trim() || !body.trim()) return;
    try {
      const ticket = await create({ subject: subject.trim(), category, priority: "normal", body: body.trim() }).unwrap();
      dispatch(addToast({ message: "تیکت ایجاد شد.", type: "success" }));
      setShowForm(false);
      setSubject("");
      setBody("");
      navigate(`/support/tickets/${ticket.id}`);
    } catch (err) {
      dispatch(addToast({ message: formatPlatformAdminError(err), type: "error" }));
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4 px-3 py-4" dir="rtl">
      <PageHeader
        actions={
          <Button onClick={() => setShowForm((v) => !v)} variant="secondary">
            {showForm ? "انصراف" : "تیکت جدید"}
          </Button>
        }
        title="پشتیبانی"
      />

      {showForm ? (
        <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
          <Field label="موضوع" required>
            <input className={inputCls} onChange={(e) => setSubject(e.target.value)} value={subject} />
          </Field>
          <Field className="mt-2" label="دسته" required>
            <select className={inputCls} onChange={(e) => setCategory(e.target.value as typeof category)} value={category}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
          <Field className="mt-2" label="متن" required>
            <textarea className={inputCls} onChange={(e) => setBody(e.target.value)} rows={4} value={body} />
          </Field>
          <Button className="mt-3" disabled={creating} onClick={() => void handleCreate()}>
            ارسال
          </Button>
        </div>
      ) : null}

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      {!isLoading && (data?.results.length ?? 0) === 0 ? (
        <EmptyState description="اولین تیکت خود را ثبت کنید." icon={<Headset className="h-6 w-6" />} title="تیکتی ندارید" />
      ) : (
        <ul className="space-y-2">
          {(data?.results ?? []).map((ticket) => (
            <li key={ticket.id}>
              <Link
                className="block rounded-xl border border-ui-border-subtle bg-ui-surface p-3 shadow-ui-sm hover:border-ui-primary/30"
                to={`/support/tickets/${ticket.id}`}
              >
                <p className="font-bold">{ticket.subject}</p>
                <div className="mt-2 flex gap-2">
                  <StatusBadge>{ticket.status ?? "—"}</StatusBadge>
                  <span className="font-mono text-[10px] ltr text-ui-text-muted">{ticket.public_id}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
