import {
  BadgeCheck,
  BookOpen,
  Building2,
  Calculator,
  ChevronDown,
  FileText,
  HelpCircle,
  Layers3,
  MessageCircle,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import { resetOnboarding } from "../features/ui/uiSlice";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";
import { classNames } from "../shared/utils/classNames";

const helpSections = [
  {
    title: "شروع کار",
    icon: Sparkles,
    body: "با ورود تلفنی توسعه شروع کنید، سپس وارد صفحه شرکت‌ها شوید. کاربران واردشده از صفحه اصلی مستقیم به فضای کاری می‌روند."
  },
  {
    title: "ساخت شرکت",
    icon: Building2,
    body: "برای شروع فقط نام شرکت لازم است. بعد از ساخت شرکت، متریل شما را وارد داشبورد همان شرکت می‌کند."
  },
  {
    title: "پیام‌های شرکت",
    icon: MessageCircle,
    body: "داشبورد شرکت مثل یک گفت‌وگوی کاری شروع می‌شود. از فضای پیام‌ها برای هماهنگی پروژه‌ها استفاده کنید."
  },
  {
    title: "پیوست کردن صورت‌بها",
    icon: FileText,
    body: "از دکمه «افزودن» کنار کادر پیام، «صورت‌بها» را بزنید. می‌توانید سند موجود را انتخاب کنید یا سند جدید بسازید؛ بعد از ثبت، صورت‌بها به پیش‌نویس پیام پیوست می‌شود."
  },
  {
    title: "لیست صورت‌بهاها",
    icon: FileText,
    body: "تب صورت‌بهاها اسناد ذخیره‌شده را نمایش می‌دهد. سند قبلی را باز کنید یا سند جدید بسازید."
  },
  {
    title: "انتخاب فهرست‌بها",
    icon: BookOpen,
    body: "سال ۱۴۰۴ در صورت وجود به صورت پیش‌فرض انتخاب می‌شود. اگر برای سال انتخابی مجموعه قیمت فعال نباشد، مرور فهرست‌بها فعال می‌ماند اما ساخت سند مالی متوقف می‌شود."
  },
  {
    title: "محاسبه آیتم",
    icon: Calculator,
    body: "مقدار را با ارقام فارسی یا لاتین وارد کنید. مبالغ پس از محاسبه نمایش داده می‌شوند."
  },
  {
    title: "الزامات",
    icon: BadgeCheck,
    body: "الزامات به شکل متن خوانا نمایش داده می‌شوند و برای شناخت آیتم قبل از محاسبه هستند."
  },
  {
    title: "تبصره‌ها",
    icon: Layers3,
    body: "تبصره‌ها شماره‌دار و کامل نمایش داده می‌شوند. تبصره‌های مرتبط را انتخاب کنید."
  },
  {
    title: "ضرایب",
    icon: Calculator,
    body: "اگر برای پروژه مجموعه ضرایب ساخته شده باشد، می‌توانید قبل از محاسبه آیتم آن را انتخاب کنید و ضرایب اعمال‌شده را در نتیجه ببینید."
  },
  {
    title: "پیش‌نمایش و خروجی",
    icon: FileText,
    body: "پیش‌نمایش سند را مشاهده و در صورت آماده بودن فایل PDF را دانلود کنید."
  },
  {
    title: "راهنمای مرحله‌ای",
    icon: HelpCircle,
    body: "اگر راهنمای شروع را بسته‌اید، از دکمه شروع دوباره راهنما در همین صفحه استفاده کنید. راهنما صفحه را کم‌نور می‌کند و روی بخش هدف تمرکز می‌گذارد."
  },
  {
    title: "محدودیت‌های نسخه آزمایشی",
    icon: HelpCircle,
    body: "قیمت‌های ستاره‌دار با وارد کردن قیمت واحد دستی قابل محاسبه هستند. خروجی PDF از طریق مرورگر پشتیبانی می‌شود."
  }
];

export function HelpPage() {
  const dispatch = useAppDispatch();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pb-6 pt-3 sm:gap-6 sm:px-6 sm:pb-10 sm:pt-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-4 sm:p-7">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between sm:gap-4">
          <div className="space-y-2 sm:space-y-3">
            <div className="hidden sm:block">
              <StatusBadge tone="emerald">
                <Sparkles className="h-3.5 w-3.5" />
                راهنمای متریل
              </StatusBadge>
            </div>
            <div>
              <h1 className="text-xl font-black leading-tight text-ui-text-primary sm:text-3xl">
                راهنمای سریع فضای کار
              </h1>
              <p className="mt-2 hidden max-w-2xl text-sm leading-7 text-ui-text-secondary sm:block">
                نکات کلیدی برای کار با متریل.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
            <Button
              className="w-full px-2 text-xs sm:w-auto sm:px-4 sm:text-sm"
              onClick={() => dispatch(resetOnboarding())}
              variant="secondary"
            >
              <RefreshCw className="h-4 w-4" />
              <span className="sm:hidden">شروع راهنما</span>
              <span className="hidden sm:inline">شروع دوباره راهنما</span>
            </Button>
            <Link
              className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-ui-border-subtle bg-ui-surface-subtle px-2 text-xs font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft sm:w-auto sm:px-4 sm:text-sm"
              to="/companies"
            >
              <span className="sm:hidden">شرکت‌ها</span>
              <span className="hidden sm:inline">بازگشت به شرکت‌ها</span>
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="space-y-2 md:hidden">
        {helpSections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === index;

          return (
            <GlassCard className="overflow-hidden p-0" key={section.title}>
              <button
                aria-expanded={isExpanded}
                className="flex min-h-14 w-full items-center gap-3 px-3 py-2 text-right"
                onClick={() => setExpandedSection(isExpanded ? null : index)}
                type="button"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-ui-primary/30 bg-ui-primary-soft text-ui-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1 text-sm font-black text-ui-text-primary">
                  {section.title}
                </span>
                <ChevronDown
                  className={classNames(
                    "h-4 w-4 shrink-0 text-ui-text-muted transition-transform",
                    isExpanded && "rotate-180"
                  )}
                />
              </button>
              {isExpanded ? (
                <p className="border-t border-ui-border-subtle px-4 py-3 text-sm leading-7 text-ui-text-secondary">
                  {section.body}
                </p>
              ) : null}
            </GlassCard>
          );
        })}
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <GlassCard className="p-5" interactive key={section.title}>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-ui-primary/30 bg-ui-primary-soft text-ui-primary">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-ui-text-primary">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-ui-text-secondary">
                    {section.body}
                  </p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
