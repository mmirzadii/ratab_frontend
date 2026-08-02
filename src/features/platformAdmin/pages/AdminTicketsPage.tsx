import { Headset } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";

import { StatusBadge } from "../../../shared/components/StatusBadge";
import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import { useListAdminSupportTicketsQuery } from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

const STATUSES = ["", "open", "waiting_for_staff", "waiting_for_user", "resolved", "closed"] as const;
const PRIORITIES = ["", "low", "normal", "high", "urgent"] as const;

function statusTone(status?: string) {
  if (status === "open" || status === "waiting_for_staff") return "warning" as const;
  if (status === "resolved") return "success" as const;
  if (status === "closed") return "neutral" as const;
  return "info" as const;
}

export function AdminTicketsPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const status = params.get("status") ?? "";
  const priority = params.get("priority") ?? "";
  const search = params.get("search") ?? "";

  const { data, isLoading, error } = useListAdminSupportTicketsQuery({
    page,
    status: status || undefined,
    priority: priority || undefined,
    search: search || undefined
  });

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    setParams(next);
  }

  return (
    <AdminPageFrame status={`${data?.count ?? 0} تیکت`} title="پشتیبانی">
      <div className="grid gap-2 sm:grid-cols-4">
        <select className={inputCls} onChange={(e) => setFilter("status", e.target.value)} value={status}>
          <option value="">همه وضعیت‌ها</option>
          {STATUSES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <select className={inputCls} onChange={(e) => setFilter("priority", e.target.value)} value={priority}>
          <option value="">همه اولویت‌ها</option>
          {PRIORITIES.filter(Boolean).map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <input
          className={`${inputCls} sm:col-span-2`}
          onChange={(e) => setFilter("search", e.target.value)}
          placeholder="جستجو…"
          value={search}
        />
      </div>

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <div className="hidden md:block">
        <AdminTable headers={["موضوع", "وضعیت", "اولویت", ""]}>
          {(data?.results ?? []).map((ticket) => (
            <tr className="border-b border-ui-border-subtle" key={ticket.id}>
              <td className="max-w-xs truncate px-3 py-2.5 font-bold">{ticket.subject}</td>
              <td className="px-3 py-2.5">
                <StatusBadge tone={statusTone(ticket.status)}>{ticket.status ?? "—"}</StatusBadge>
              </td>
              <td className="px-3 py-2.5 font-mono text-xs ltr">{ticket.priority ?? "—"}</td>
              <td className="px-3 py-2.5">
                <Link
                  className="text-xs font-bold text-ui-primary hover:underline"
                  to={`/admin/support/tickets/${ticket.id}`}
                >
                  مشاهده
                </Link>
              </td>
            </tr>
          ))}
        </AdminTable>
      </div>

      <div className="space-y-2 md:hidden">
        {(data?.results ?? []).map((ticket) => (
          <Link
            className="block rounded-xl border border-ui-border-subtle bg-ui-surface p-3 shadow-ui-sm"
            key={ticket.id}
            to={`/admin/support/tickets/${ticket.id}`}
          >
            <p className="font-bold">{ticket.subject}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge tone={statusTone(ticket.status)}>{ticket.status ?? "—"}</StatusBadge>
              <span className="font-mono text-[10px] ltr">{ticket.priority}</span>
            </div>
          </Link>
        ))}
      </div>

      {!isLoading && (data?.results.length ?? 0) === 0 ? (
        <div className="flex justify-center py-8">
          <Headset className="h-8 w-8 text-ui-text-muted" />
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
