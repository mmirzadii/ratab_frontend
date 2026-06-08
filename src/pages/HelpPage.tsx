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
    body: "از ورود تلفنی توسعه شروع کنید، سپس وارد صفحه شرکت‌ها شوید. کاربران واردشده از صفحه اصلی مستقیم به فضای شرکت‌ها می‌روند."
  },
  {
    title: "ساخت شرکت",
    icon: Building2,
    body: "نام شرکت کافی است. بعد از ساخت شرکت، متریل شما را وارد داشبورد همان شرکت می‌کند."
  },
  {
    title: "فضای پیام‌های شرکت",
    icon: MessageCircle,
    body: "داشبورد شرکت مثل گفت‌وگو طراحی شده است. پیام‌ها فعلاً محلی هستند و تا وقتی زیرساخت پیام‌ها اضافه نشود بعد از refresh ماندگار نیستند."
  },
  {
    title: "افزودن صورت‌بها",
    icon: FileText,
    body: "از دکمه + کنار پیام‌ها، گزینه افزودن صورت‌بها از فهرست‌بها را بزنید. ابتدا وارد سازنده می‌شوید و بعد از ثبت، صورت‌بها مثل پیوست آماده ارسال برمی‌گردد."
  },
  {
    title: "لیست صورت‌بهاها",
    icon: FileText,
    body: "در صفحه شرکت، بخش صورت‌بهاها اسناد ذخیره‌شده روی بک‌اند را نشان می‌دهد. برای ساخت سند تازه از دکمه صورت‌بهای جدید استفاده کنید و برای ادامه کار، سند قبلی را باز کنید."
  },
  {
    title: "انتخاب فهرست‌بها",
    icon: BookOpen,
    body: "سال ۱۴۰۴ در صورت وجود به‌صورت پیش‌فرض انتخاب می‌شود. اگر برای سال انتخابی مجموعه قیمت فعال نباشد، مرور فعال می‌ماند اما ساخت سند مالی متوقف می‌شود."
  },
  {
    title: "محاسبه آیتم",
    icon: Calculator,
    body: "مقدار با ارقام فارسی یا لاتین قابل ورود است، اما قبل از ارسال به سرور نرمال می‌شود. مبلغ‌ها فقط از پاسخ محاسبه بک‌اند نمایش داده می‌شوند."
  },
  {
    title: "الزامات",
    icon: BadgeCheck,
    body: "الزامات به‌صورت متن خوانا و بدون شناسه داخلی نمایش داده می‌شوند و برای فهم آیتم قبل از محاسبه هستند."
  },
  {
    title: "تبصره‌ها",
    icon: Layers3,
    body: "تبصره‌ها کامل و شماره‌دار نمایش داده می‌شوند. در v0.0 انتخاب آن‌ها در فرانت‌اند نگه داشته می‌شود چون محاسبه سرور هنوز انتخاب تبصره‌ها را دریافت نمی‌کند."
  },
  {
    title: "ضرایب",
    icon: Calculator,
    body: "اگر برای پروژه مجموعه ضرایب ساخته باشید، می‌توانید آن را قبل از محاسبه آیتم انتخاب کنید و ضرایب اعمال‌شده را در نتیجه ببینید."
  },
  {
    title: "پیش‌نمایش HTML",
    icon: FileText,
    body: "پیش‌نمایش HTML از بک‌اند دریافت می‌شود و داخل قاب امن نمایش داده می‌شود. در فرانت‌اند، پیش‌نمایش با فونت خواناتر نمایش داده می‌شود؛ محتوای رسمی همچنان از بک‌اند می‌آید."
  },
  {
    title: "دانلود PDF",
    icon: FileText,
    body: "اگر بک‌اند فایل PDF آماده کند، دکمه دانلود فایل واقعی را دریافت می‌کند. در نسخه فعلی بک‌اند معمولاً خروجی PDF را ناموفق ثبت می‌کند و فرانت‌اند فایل جعلی نمی‌سازد."
  },
  {
    title: "محدودیت‌های نسخه آزمایشی",
    icon: HelpCircle,
    body: "پیام‌های شرکت هنوز backend persistence ندارند، قیمت‌های ستاره‌دار محاسبه نمی‌شوند و PDF واقعی تولید نمی‌شود."
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
                توضیحات طولانی صفحه‌های کاری اینجاست تا داشبورد، پیام‌ها و سازنده صورت‌بها خلوت بمانند.
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
                  <h2 className="text-lg font-black text-white light:text-slate-950">{section.title}</h2>
                  <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">{section.body}</p>
                </div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
