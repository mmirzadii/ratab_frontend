import { Link } from "react-router-dom";

import { Can } from "../Can";
import { AdminPageFrame } from "../AdminPageFrame";

export function AdminSubscriptionsPage() {
  return (
    <AdminPageFrame title="اشتراک‌ها">
      <div className="rounded-xl border border-ui-border-subtle bg-ui-surface p-4 shadow-ui-sm">
        <p className="text-sm text-ui-text-secondary">
          مدیریت اشتراک‌ها از طریق جزئیات کاربر انجام می‌شود: فعال‌سازی یا لغو اشتراک در صفحه کاربران.
        </p>
        <Can
          capability="admin.subscriptions.view"
          fallback={
            <p className="mt-3 text-xs font-bold text-ui-warning">
              برای مشاهده جزئیات اشتراک به دسترسی admin.subscriptions.view نیاز دارید.
            </p>
          }
        >
          <p className="mt-2 text-xs text-ui-text-muted">
            برای مشاهده وضعیت اشتراک، کاربر را در فهرست کاربران انتخاب کنید.
          </p>
          <Link className="mt-3 inline-block text-sm font-bold text-ui-primary hover:underline" to="/admin/users">
            رفتن به کاربران
          </Link>
        </Can>
      </div>
    </AdminPageFrame>
  );
}
