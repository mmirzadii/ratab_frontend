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
  RefreshCw
} from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import { resetOnboarding } from "../features/ui/uiSlice";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { PageHeader } from "../shared/components/PageHeader";
import { classNames } from "../shared/utils/classNames";

const helpSections = [
  {
    title: "شروع کار",
    icon: HelpCircle,
    body: "با ورود تلفنی وارد شوید، سپس به صفحه شرکت‌ها بروید."
  },
  {
    title: "ساخت شرکت",
    icon: Building2,
    body: "نام شرکت الزامی است. پس از ساخت، داشبورد همان شرکت باز می‌شود."
  },
  {
    title: "پیام‌های شرکت",
    icon: MessageCircle,
    body: "هماهنگی پروژه‌ها و پیوست صورت‌بها از پیام‌های شرکت انجام می‌شود."
  },
  {
    title: "پیوست کردن صورت‌بها",
    icon: FileText,
    body: "از «افزودن» کنار کادر پیام، صورت‌بها را پیوست کنید یا سند جدید بسازید."
  },
  {
    title: "لیست صورت‌بهاها",
    icon: FileText,
    body: "تب صورت‌بهاها اسناد ذخیره‌شده را نمایش می‌دهد."
  },
  {
    title: "انتخاب فهرست‌بها",
    icon: BookOpen,
    body: "سال ۱۴۰۴ در صورت وجود پیش‌فرض است. بدون مجموعه قیمت فعال، ساخت سند مالی متوقف می‌شود."
  },
  {
    title: "محاسبه آیتم",
    icon: Calculator,
    body: "مقدار را با ارقام فارسی یا لاتین وارد کنید. مبالغ پس از محاسبه نمایش داده می‌شوند."
  },
  {
    title: "الزامات",
    icon: BadgeCheck,
    body: "الزامات برای شناخت آیتم قبل از محاسبه نمایش داده می‌شوند."
  },
  {
    title: "تبصره‌ها",
    icon: Layers3,
    body: "تبصره‌ها شماره‌دار نمایش داده می‌شوند؛ موارد مرتبط را انتخاب کنید."
  },
  {
    title: "ضرایب",
    icon: Calculator,
    body: "در صورت وجود مجموعه ضرایب پروژه، قبل از محاسبه آیتم می‌توان آن را انتخاب کرد."
  },
  {
    title: "پیش‌نمایش و خروجی",
    icon: FileText,
    body: "پیش‌نمایش سند را مشاهده و در صورت آمادگی فایل PDF را دانلود کنید."
  },
  {
    title: "راهنمای مرحله‌ای",
    icon: HelpCircle,
    body: "برای نمایش دوباره راهنمای شروع از دکمه همین صفحه استفاده کنید."
  },
  {
    title: "محدودیت‌های نسخه آزمایشی",
    icon: HelpCircle,
    body: "قیمت‌های ستاره‌دار با قیمت واحد دستی محاسبه می‌شوند. خروجی PDF از طریق مرورگر پشتیبانی می‌شود."
  }
];

export function HelpPage() {
  const dispatch = useAppDispatch();
  const [expandedSection, setExpandedSection] = useState<number | null>(0);

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 pb-6 pt-3 sm:gap-4 sm:px-6 sm:pb-8 sm:pt-4 lg:px-8">
      <PageHeader
        actions={
          <>
            <Button onClick={() => dispatch(resetOnboarding())} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              <span className="sm:hidden">شروع راهنما</span>
              <span className="hidden sm:inline">شروع دوباره راهنما</span>
            </Button>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[11px] border border-ui-border-default bg-ui-surface px-4 text-sm font-bold text-ui-text-primary transition hover:bg-ui-surface-hover"
              to="/companies"
            >
              شرکت‌ها
            </Link>
          </>
        }
        title="راهنما"
      />

      <div className="space-y-2 md:hidden">
        {helpSections.map((section, index) => {
          const Icon = section.icon;
          const isExpanded = expandedSection === index;

          return (
            <GlassCard className="overflow-hidden p-0" key={section.title}>
              <button
                aria-expanded={isExpanded}
                className="flex min-h-12 w-full items-center gap-3 px-3 py-2 text-right"
                onClick={() => setExpandedSection(isExpanded ? null : index)}
                type="button"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-ui-primary/25 bg-ui-primary-soft text-ui-primary">
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
                <p className="border-t border-ui-border-subtle px-4 py-3 text-sm leading-6 text-ui-text-secondary">
                  {section.body}
                </p>
              ) : null}
            </GlassCard>
          );
        })}
      </div>

      <div className="hidden gap-3 md:grid md:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <GlassCard className="p-4" interactive key={section.title}>
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-ui-primary/25 bg-ui-primary-soft text-ui-primary">
                  <Icon className="h-4 w-4" />
                </div>
                <div>
                  <h2 className="text-base font-black text-ui-text-primary">{section.title}</h2>
                  <p className="mt-1.5 text-sm leading-6 text-ui-text-secondary">{section.body}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
