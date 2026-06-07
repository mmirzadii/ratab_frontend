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

import { Button } from "../shared/components/Button";
import { EmptyState } from "../shared/components/EmptyState";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { containsLocalizedDigits, normalizeRowCode } from "../shared/utils/numberText";

const previewCards = [
  {
    title: "ورود و شرکت‌ها",
    description: "در فازهای بعدی ورود توسعه و ساخت شرکت روی همین پایه اضافه می‌شود.",
    icon: Building2,
    tone: "emerald"
  },
  {
    title: "صورت‌بها",
    description: "جریان ساخت صورت‌بها بعد از آماده شدن ورود و شرکت فعال می‌شود.",
    icon: FileText,
    tone: "violet"
  },
  {
    title: "فهرست‌بها ۱۴۰۴",
    description: "انتخاب سال و مرور فصل‌ها در فازهای بعدی به API واقعی وصل می‌شود.",
    icon: ClipboardList,
    tone: "amber"
  }
] as const;

const sampleRowCode = "۰۱۰۱۰۱";

export function DashboardPreviewPage() {
  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
          <div className="max-w-3xl space-y-5">
            <StatusBadge tone="emerald">
              <Sparkles className="h-3.5 w-3.5" />
              پیش‌نمایش فاز ۲
            </StatusBadge>
            <div className="space-y-3">
              <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                پایه بصری رتب برای جریان‌های بعدی آماده شد
              </h1>
              <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
                این صفحه داشبورد عملیاتی نیست؛ فقط سطح طراحی، ناوبری راست، حالت روشن/تاریک،
                کارت‌های شیشه‌ای و راهنمای شروع را برای فازهای بعدی نشان می‌دهد.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button disabled>
                <Plus className="h-4 w-4" />
                افزودن شرکت در فاز بعدی
              </Button>
              <Link
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800"
                to="/status"
              >
                مشاهده مسیر سلامت
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </GlassCard>

        <EmptyState
          description="بعد از پیاده‌سازی ورود و شرکت‌ها، این بخش به پیام‌های شرکت و دکمه افزودن صورت‌بها تبدیل می‌شود."
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
              <div className="mt-5 flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-emerald-200 light:border-slate-200 light:bg-slate-50 light:text-emerald-700">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-sm leading-7 text-slate-300 light:text-slate-600">
                {card.description}
              </p>
            </GlassCard>
          );
        })}
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
        <GlassCard className="p-5">
          <h2 className="text-lg font-black text-white light:text-slate-950">آماده‌سازی ورودی عددی</h2>
          <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
            ابزارهای مشترک، ارقام فارسی و عربی را بدون حذف صفرهای اول به ارقام لاتین تبدیل می‌کنند.
          </p>
          <div className="mt-5 rounded-lg border border-white/10 bg-slate-950/45 p-4 light:border-slate-200 light:bg-white">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-slate-400 light:text-slate-500">کد نمونه</p>
                <p className="mt-1 font-bold text-slate-100 light:text-slate-900">{sampleRowCode}</p>
              </div>
              <div>
                <p className="text-slate-400 light:text-slate-500">ارسال امن به API</p>
                <p className="mt-1 font-bold text-slate-100 light:text-slate-900" dir="ltr">
                  {normalizeRowCode(sampleRowCode)}
                </p>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-400 light:text-slate-500">
              تشخیص رقم بومی: {containsLocalizedDigits(sampleRowCode) ? "فعال" : "غیرفعال"}
            </p>
          </div>
        </GlassCard>

        <GlassCard className="p-5">
          <h2 className="text-lg font-black text-white light:text-slate-950">مرز فاز ۲</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <StatusBadge tone="emerald">طراحی پایه</StatusBadge>
            <StatusBadge tone="violet">راهنمای شروع</StatusBadge>
            <StatusBadge tone="amber">بدون داده ساختگی</StatusBadge>
            <StatusBadge>بدون API جدید</StatusBadge>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-300 light:text-slate-600">
            هیچ محاسبه مالی، شرکت، پروژه یا ورود واقعی در این صفحه انجام نمی‌شود. داده‌های عملیاتی فقط
            از فازهای بعدی و بر اساس قرارداد بک‌اند اضافه خواهند شد.
          </p>
        </GlassCard>
      </section>
    </div>
  );
}
