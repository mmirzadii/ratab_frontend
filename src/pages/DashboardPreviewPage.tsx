import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FileText,
  MessageSquareText,
  Plus
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearCreateCompanyHighlight } from "../features/auth/authSlice";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { PageHeader } from "../shared/components/PageHeader";
import { StatusBadge } from "../shared/components/StatusBadge";
import { containsLocalizedDigits, normalizeRowCode } from "../shared/utils/numberText";

const previewCards = [
  {
    title: "ورود توسعه",
    description: "ورود امن با نشست و بازیابی خودکار حساب.",
    icon: Building2,
    tone: "emerald" as const
  },
  {
    title: "صورت‌بها",
    description: "جریان ساخت صورت‌بها بعد از آماده شدن شرکت و پروژه فعال می‌شود.",
    icon: FileText,
    tone: "violet" as const
  },
  {
    title: "فهرست‌بها ۱۴۰۴",
    description: "فصل‌ها، گروه‌ها و آیتم‌ها از فهرست‌بهای واقعی.",
    icon: ClipboardList,
    tone: "amber" as const
  }
];

const sampleRowCode = "۰۱۰۱۰۱";

export function DashboardPreviewPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const shouldHighlightCreateCompany = useAppSelector(
    (state) => state.auth.shouldHighlightCreateCompany
  );
  const displayName = user?.display_name || user?.phone_number || "کاربر توسعه";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 pb-6 pt-3 sm:gap-5 sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
      <PageHeader
        actions={
          <>
            <Button
              className={
                shouldHighlightCreateCompany
                  ? "ring-2 ring-ui-primary/40 ring-offset-2 ring-offset-ui-canvas"
                  : ""
              }
              disabled
            >
              <Plus className="h-4 w-4" />
              افزودن شرکت در فاز ۴
            </Button>
            {shouldHighlightCreateCompany ? (
              <Button onClick={() => dispatch(clearCreateCompanyHighlight())} variant="secondary">
                متوجه شدم
              </Button>
            ) : null}
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] border border-ui-border-default bg-ui-surface px-4 text-sm font-bold text-ui-text-primary transition hover:bg-ui-surface-hover"
              to="/status"
            >
              وضعیت سرویس
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </>
        }
        status="نمای کلی سیستم"
        title={displayName}
      />

      <EmptyState
        description="ابتدا یک شرکت را باز کنید."
        icon={<MessageSquareText className="h-6 w-6" />}
        title="پیام‌های شرکت فعال نیست"
      />

      <section className="grid gap-3 md:grid-cols-3">
        {previewCards.map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard className="p-4" key={card.title}>
              <StatusBadge tone={card.tone}>{card.title}</StatusBadge>
              <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl border border-ui-border-subtle bg-ui-surface-subtle text-ui-primary">
                <Icon className="h-5 w-5" />
              </div>
              <p className="mt-3 text-sm leading-6 text-ui-text-secondary">{card.description}</p>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-3 lg:grid-cols-2">
        <GlassCard className="p-4">
          <h2 className="text-base font-black text-ui-text-primary">آماده‌سازی ورودی عددی</h2>
          <p className="mt-1.5 text-sm leading-6 text-ui-text-secondary">
            ارقام فارسی و عربی بدون حذف صفرهای اول به لاتین تبدیل می‌شوند.
          </p>
          <div className="mt-3 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-ui-text-muted">کد نمونه</p>
                <p className="mt-1 font-bold text-ui-text-primary">{sampleRowCode}</p>
              </div>
              <div>
                <p className="text-ui-text-muted">آماده ارسال</p>
                <p className="mt-1 font-bold text-ui-text-primary" dir="ltr">
                  {normalizeRowCode(sampleRowCode)}
                </p>
              </div>
            </div>
            <p className="mt-2 text-xs text-ui-text-muted">
              تشخیص رقم بومی: {containsLocalizedDigits(sampleRowCode) ? "فعال" : "غیرفعال"}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-4">
          <h2 className="text-base font-black text-ui-text-primary">وضعیت فعلی</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <StatusBadge tone="emerald">ورود توسعه</StatusBadge>
            <StatusBadge tone="violet">مسیر محافظت‌شده</StatusBadge>
            <StatusBadge tone="amber">بدون رمز ساختگی</StatusBadge>
            <StatusBadge>بدون داده شرکت</StatusBadge>
          </div>
        </GlassCard>
      </section>
    </div>
  );
}
