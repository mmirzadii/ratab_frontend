import { useSearchParams } from "react-router-dom";

import { AdminPageFrame, AdminTable, PaginationBar } from "../AdminPageFrame";
import { useListAdminAuditEventsQuery } from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";

const inputCls =
  "w-full rounded-lg border border-ui-border-default bg-ui-surface px-3 py-2 text-sm";

function fmtDate(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("fa-IR", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

function safeDiff(value: unknown): string {
  if (value == null) return "—";
  if (typeof value === "string") return value.length > 200 ? `${value.slice(0, 200)}…` : value;
  try {
    const s = JSON.stringify(value);
    return s.length > 200 ? `${s.slice(0, 200)}…` : s;
  } catch {
    return "—";
  }
}

type AuditRow = {
  id?: number;
  action?: string;
  actor_id?: number | null;
  target_type?: string;
  target_id?: string;
  outcome?: string;
  reason?: string;
  created_at?: string;
  before_diff?: unknown;
  after_diff?: unknown;
};

export function AdminAuditPage() {
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page") ?? 1));
  const action = params.get("action") ?? "";
  const { data, isLoading, error } = useListAdminAuditEventsQuery({ page, action: action || undefined });

  return (
    <AdminPageFrame status={`${data?.count ?? 0} رویداد`} title="ممیزی">
      <input
        className={inputCls}
        onChange={(e) => {
          const next = new URLSearchParams(params);
          if (e.target.value) next.set("action", e.target.value);
          else next.delete("action");
          next.delete("page");
          setParams(next);
        }}
        placeholder="فیلتر action…"
        value={action}
      />

      {error ? <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p> : null}
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}

      <AdminTable headers={["عمل", "actor", "هدف", "نتیجه", "دلیل", "زمان"]}>
        {(data?.results ?? []).map((raw, idx) => {
          const row = raw as AuditRow;
          return (
            <tr className="border-b border-ui-border-subtle align-top" key={row.id ?? idx}>
              <td className="px-3 py-2.5 font-mono text-[10px] ltr">{row.action ?? "—"}</td>
              <td className="px-3 py-2.5 font-mono text-xs ltr">{row.actor_id ?? "—"}</td>
              <td className="px-3 py-2.5 text-xs">
                {row.target_type ?? "—"}
                {row.target_id ? ` #${row.target_id}` : ""}
              </td>
              <td className="px-3 py-2.5 text-xs">{row.outcome ?? "—"}</td>
              <td className="max-w-[120px] truncate px-3 py-2.5 text-xs" title={row.reason}>
                {row.reason ?? "—"}
              </td>
              <td className="px-3 py-2.5 text-xs">{fmtDate(row.created_at)}</td>
            </tr>
          );
        })}
      </AdminTable>

      {(data?.results ?? []).some((r) => (r as AuditRow).before_diff || (r as AuditRow).after_diff) ? (
        <p className="text-[10px] text-ui-text-muted">
          diff نمونه:{" "}
          {safeDiff((data?.results[0] as AuditRow)?.before_diff)} →{" "}
          {safeDiff((data?.results[0] as AuditRow)?.after_diff)}
        </p>
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
