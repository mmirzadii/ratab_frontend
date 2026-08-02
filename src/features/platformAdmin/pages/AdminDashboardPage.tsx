import { AdminMetric, AdminPageFrame } from "../AdminPageFrame";
import { useGetPlatformAdminDashboardQuery } from "../platformAdminApi";
import { formatPlatformAdminError } from "../platformAdminErrors";

export function AdminDashboardPage() {
  const { data, isLoading, error } = useGetPlatformAdminDashboardQuery();

  return (
    <AdminPageFrame status="خلاصه عملیاتی" title="داشبورد مدیریت">
      {isLoading ? <p className="text-sm text-ui-text-muted">در حال بارگذاری…</p> : null}
      {error ? (
        <p className="text-sm font-bold text-ui-danger">{formatPlatformAdminError(error)}</p>
      ) : null}
      {data ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <AdminMetric label="کاربران" value={data.users} />
            <AdminMetric label="شرکت‌ها" value={data.companies} />
            <AdminMetric label="اشتراک فعال" value={data.active_subscriptions} />
            <AdminMetric label="تیکت باز" value={data.open_tickets} />
          </div>

          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
            <h2 className="text-sm font-black">سفارش‌ها بر اساس وضعیت</h2>
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {Object.entries(data.orders_by_status ?? {}).map(([status, count]) => (
                <li
                  className="flex justify-between rounded-lg bg-ui-surface-subtle px-3 py-2 text-xs"
                  key={status}
                >
                  <span className="font-mono ltr">{status}</span>
                  <span className="font-black">{count}</span>
                </li>
              ))}
              {Object.keys(data.orders_by_status ?? {}).length === 0 ? (
                <li className="text-xs text-ui-text-muted">سفارشی ثبت نشده است.</li>
              ) : null}
            </ul>
          </div>

          <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
            <h2 className="text-sm font-black">مبالغ fulfilled به‌تفکیک ارز</h2>
            <ul className="mt-2 space-y-2">
              {(data.fulfilled_by_currency ?? []).map((row) => (
                <li
                  className="grid grid-cols-2 gap-2 rounded-lg bg-ui-surface-subtle px-3 py-2 text-xs sm:grid-cols-4"
                  key={row.currency}
                >
                  <span className="font-mono ltr">{row.currency}</span>
                  <span>مبلغ: {row.amount}</span>
                  <span>توکن: {row.tokens}</span>
                  <span>تعداد: {row.count}</span>
                </li>
              ))}
              {(data.fulfilled_by_currency ?? []).length === 0 ? (
                <li className="text-xs text-ui-text-muted">مبلغ fulfilled وجود ندارد.</li>
              ) : null}
            </ul>
          </div>

          <AdminMetric label="اصلاح‌های مالی" value={data.adjustments} />
        </div>
      ) : null}
    </AdminPageFrame>
  );
}
