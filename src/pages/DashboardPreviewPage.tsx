import {
  ArrowLeft,
  Building2,
  ClipboardList,
  FileText,
  MessageSquareText,
  Plus,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../app/hooks";
import { clearCreateCompanyHighlight } from "../features/auth/authSlice";
import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { containsLocalizedDigits, normalizeRowCode } from "../shared/utils/numberText";

const previewCards = [
  {
    title: "ورود توسعه",
    description: "ورود امن با نشست و بازیابی خودکار حساب.",
    icon: Building2,
    tone: "emerald"
  },
  {
    title: "صورت‌بها",
    description: "جریان ساخت صورت‌بها بعد از آماده شدن شرکت و پروژه فعال می‌شود.",
    icon: FileText,
    tone: "violet"
  },
  {
    title: "فهرست‌بها ۱۴۰۴",
    description: "فصل‌ها، گروه‌ها و آیتم‌ها از فهرست‌بهای واقعی.",
    icon: ClipboardList,
    tone: "amber"
  }
] as const;

const sampleRowCode = "۰۱۰۱۰۱";

export function DashboardPreviewPage() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const shouldHighlightCreateCompany = useAppSelector(
    (state) => state.auth.shouldHighlightCreateCompany
  );
  const displayName = user?.display_name || user?.phone_number || "کاربر توسعه";

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
          <div className="max-w-3xl space-y-5">
            <StatusBadge tone="emerald">
              <Sparkles className="h-3.5 w-3.5" />
              نشست توسعه فعال
            </StatusBadge>
            <div className="space-y-3">
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
                خوش آمدید، {displayName}
              </h1>
              <p className="text-sm leading-7 text-ui-text-secondary">
                نمای کلی امکانات فعلی سیستم.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                className={
                  shouldHighlightCreateCompany
                    ? "ring-2 ring-emerald-200/80 ring-offset-2 ring-offset-slate-950"
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
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-4 text-sm font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft"
                to="/status"
              >
                مشاهده مسیر سلامت
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </GlassCard>

        <EmptyState
          description="وارد یک شرکت شوید تا فضای پیام‌ها فعال شود."
          icon={<MessageSquareText className="h-7 w-7" />}
          title="فضای پیام‌های شرکت هنوز فعال نیست"
        />
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {previewCards.map((card) => {
          const Icon = card.icon;
          return (
            <GlassCard className="p-5" interactive key={card.title}>
              <StatusBadge tone={card.tone}>{card.title}</StatusBadge>
              <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-lg border border-ui-border-subtle bg-ui-surface-subtle text-ui-primary">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm leading-7 text-ui-text-secondary">
                {card.description}
              </p>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-5">
          <h2 className="text-lg font-black text-ui-text-primary">آماده‌سازی ورودی عددی</h2>
          <p className="mt-2 text-sm leading-7 text-ui-text-secondary">
            ابزارهای مشترک، ارقام فارسی و عربی را بدون حذف صفرهای اول به ارقام لاتین تبدیل می‌کنند.
          </p>
          <div className="mt-5 rounded-lg border border-ui-border-subtle bg-ui-surface/45 p-4">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-ui-text-muted">کد نمونه</p>
                <p className="mt-1 font-bold text-ui-text-primary">{sampleRowCode}</p>
              </div>
              <div>
                <p className="text-ui-text-muted">آماده ارسال امن</p>
                <p className="mt-1 font-bold text-ui-text-primary" dir="ltr">
                  {normalizeRowCode(sampleRowCode)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-ui-text-muted">
              تشخیص رقم بومی: {containsLocalizedDigits(sampleRowCode) ? "فعال" : "غیرفعال"}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-lg font-black text-ui-text-primary">وضعیت فعلی</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
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
