import type { ReactNode } from "react";

import { PageHeader } from "../../shared/components/PageHeader";

export function AdminPageFrame({
  title,
  status,
  actions,
  children
}: {
  title: string;
  status?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="space-y-4" dir="rtl">
      <PageHeader actions={actions} status={status} title={title} />
      {children}
    </div>
  );
}

export function AdminMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-ui-border-subtle bg-ui-surface px-3 py-2.5 shadow-ui-sm">
      <p className="text-[11px] text-ui-text-muted">{label}</p>
      <p className="mt-0.5 text-lg font-black text-ui-text-primary">{value}</p>
    </div>
  );
}

export function AdminTable({
  headers,
  children
}: {
  headers: string[];
  children: ReactNode;
}) {
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-ui-border-subtle bg-ui-surface shadow-ui-sm md:block">
        <table className="w-full min-w-[640px] text-right text-sm">
          <thead className="border-b border-ui-border-subtle bg-ui-surface-subtle text-xs text-ui-text-muted">
            <tr>
              {headers.map((header) => (
                <th className="px-3 py-2.5 font-bold" key={header} scope="col">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
      <div className="space-y-2 md:hidden">{children}</div>
    </>
  );
}

export function PaginationBar({
  page,
  count,
  pageSize = 50,
  onPageChange
}: {
  page: number;
  count: number;
  pageSize?: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(count / pageSize));
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between gap-3 text-xs font-bold text-ui-text-secondary">
      <button
        className="rounded-lg border border-ui-border-default px-3 py-1.5 disabled:opacity-40"
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        قبلی
      </button>
      <span>
        صفحه {page} از {totalPages}
      </span>
      <button
        className="rounded-lg border border-ui-border-default px-3 py-1.5 disabled:opacity-40"
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        بعدی
      </button>
    </div>
  );
}
