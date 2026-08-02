import { AdminMetric, AdminPageFrame } from "../AdminPageFrame";
import {
  useGetAdminOperationsHealthQuery,
  useGetAdminOperationsPricebooksQuery,
  useGetAdminOperationsQuotasQuery
} from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";

function safeStr(value: unknown): string {
  if (value == null) return "—";
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function KvCard({ title, data, error }: { title: string; data: unknown; error: unknown }) {
  return (
    <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
      <h2 className="text-sm font-black">{title}</h2>
      {error ? (
        <p className="mt-2 text-xs font-bold text-ui-danger">{formatPlatformAdminError(error)}</p>
      ) : (
        <pre className="mt-2 max-h-64 overflow-auto whitespace-pre-wrap font-mono text-[10px] ltr text-ui-text-secondary">
          {safeStr(data)}
        </pre>
      )}
    </div>
  );
}

export function AdminOperationsPage() {
  const health = useGetAdminOperationsHealthQuery();
  const pricebooks = useGetAdminOperationsPricebooksQuery();
  const quotas = useGetAdminOperationsQuotasQuery();

  const healthObj = health.data && typeof health.data === "object" ? (health.data as Record<string, unknown>) : null;

  return (
    <AdminPageFrame title="عملیات">
      {healthObj ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {Object.entries(healthObj)
            .filter(([, v]) => typeof v === "string" || typeof v === "number" || typeof v === "boolean")
            .slice(0, 4)
            .map(([key, value]) => (
              <AdminMetric key={key} label={key} value={String(value)} />
            ))}
        </div>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-3">
        <KvCard data={health.data} error={health.error} title="سلامت" />
        <KvCard data={pricebooks.data} error={pricebooks.error} title="Pricebooks" />
        <KvCard data={quotas.data} error={quotas.error} title="Quotas" />
      </div>
    </AdminPageFrame>
  );
}
