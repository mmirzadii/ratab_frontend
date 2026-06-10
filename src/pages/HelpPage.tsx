import {
  BadgeCheck,
  BookOpen,
  Building2,
  Calculator,
  FileText,
  HelpCircle,
  Layers3,
  MessageCircle,
  RefreshCw,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAppDispatch } from "../app/hooks";
import { resetOnboarding } from "../features/ui/uiSlice";
import { Button } from "../shared/components/Button";
import { GlassCard } from "../shared/components/GlassCard";
import { StatusBadge } from "../shared/components/StatusBadge";

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
    body: "داشبورد شرکت مثل یک گفت‌وگوی کاری شروع می‌شود. پیام‌ها فعلا محلی هستند و پس از refresh باقی نمی‌مانند، اما صورت‌بهاها روی بک‌اند ذخیره می‌شوند."
  },
  {
    title: "پیوست کردن صورت‌بها",
    icon: FileText,
    body: "از دکمه + کنار کادر پیام، گزینه افزودن صورت‌بها از فهرست‌بها را بزنید. بعد از ثبت، صورت‌بها به صورت پیوست آماده ارسال به پیام‌ها برمی‌گردد."
  },
  {
    title: "لیست صورت‌بهاها",
    icon: FileText,
    body: "تب صورت‌بهاها اسناد ذخیره‌شده را از بک‌اند می‌خواند. برای ادامه کار، سند قبلی را باز کنید یا از دکمه صورت‌بهای جدید یک سند تازه بسازید."
  },
  {
    title: "انتخاب فهرست‌بها",
    icon: BookOpen,
    body: "سال ۱۴۰۴ در صورت وجود به صورت پیش‌فرض انتخاب می‌شود. اگر برای سال انتخابی مجموعه قیمت فعال نباشد، مرور فهرست‌بها فعال می‌ماند اما ساخت سند مالی متوقف می‌شود."
  },
  {
    title: "محاسبه آیتم",
    icon: Calculator,
    body: "مقدار می‌تواند با ارقام فارسی یا لاتین وارد شود و قبل از ارسال به بک‌اند نرمال می‌شود. مبلغ‌ها فقط از پاسخ بک‌اند نمایش داده می‌شوند."
  },
  {
    title: "الزامات",
    icon: BadgeCheck,
    body: "الزامات به شکل متن خوانا نمایش داده می‌شوند و برای شناخت آیتم قبل از محاسبه هستند."
  },
  {
    title: "تبصره‌ها",
    icon: Layers3,
    body: "تبصره‌ها شماره‌دار و کامل نمایش داده می‌شوند. انتخاب آن‌ها در v0.0 در فرانت‌اند نگه داشته می‌شود چون بک‌اند هنوز انتخاب تبصره را در محاسبه دریافت نمی‌کند."
  },
  {
    title: "ضرایب",
    icon: Calculator,
    body: "اگر برای پروژه مجموعه ضرایب ساخته شده باشد، می‌توانید قبل از محاسبه آیتم آن را انتخاب کنید و ضرایب اعمال‌شده را در نتیجه ببینید."
  },
  {
    title: "پیش‌نمایش و خروجی",
    icon: FileText,
    body: "پیش‌نمایش HTML از بک‌اند دریافت می‌شود. PDF واقعی فقط زمانی دانلود می‌شود که بک‌اند فایل آماده داشته باشد؛ فرانت‌اند فایل جعلی نمی‌سازد."
  },
  {
    title: "راهنمای مرحله‌ای",
    icon: HelpCircle,
    body: "اگر راهنمای شروع را بسته‌اید، از دکمه شروع دوباره راهنما در همین صفحه استفاده کنید. راهنما صفحه را کم‌نور می‌کند و روی بخش هدف تمرکز می‌گذارد."
  },
  {
    title: "محدودیت‌های نسخه آزمایشی",
    icon: HelpCircle,
    body: "پیام‌های شرکت هنوز ذخیره‌سازی بک‌اند ندارند. قیمت‌های ستاره‌دار با وارد کردن قیمت واحد دستی قابل محاسبه و افزودن به صورت‌بها هستند. خروجی PDF از طریق مرورگر پشتیبانی می‌شود."
  }
];

export function HelpPage() {
  const dispatch = useAppDispatch();

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <GlassCard className="relative overflow-hidden p-5 sm:p-7">
        <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-3">
            <StatusBadge tone="emerald">
              <Sparkles className="h-3.5 w-3.5" />
              راهنمای متریل
            </StatusBadge>
            <div>
              <h1 className="text-3xl font-black leading-tight text-white light:text-slate-950">
                راهنمای سریع فضای کار
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-300 light:text-slate-600">
                توضیحات طولانی از صفحه‌های کاری به اینجا منتقل شده تا داشبورد، پیام‌ها و سازنده صورت‌بها خلوت بمانند.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => dispatch(resetOnboarding())} variant="secondary">
              <RefreshCw className="h-4 w-4" />
              شروع دوباره راهنما
            </Button>
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-[#f5fbf8] light:text-slate-800"
              to="/companies"
            >
              بازگشت به شرکت‌ها
            </Link>
          </div>
        </div>
      </GlassCard>

      <div className="grid gap-4 md:grid-cols-2">
        {helpSections.map((section) => {
          const Icon = section.icon;
          return (
            <GlassCard className="p-5" interactive key={section.title}>
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 light:text-emerald-700">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-black text-white light:text-slate-950">
                    {section.title}
                  </h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
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
