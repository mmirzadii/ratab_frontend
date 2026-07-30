import {
  ArrowLeft,
  BarChart3,
  Building2,
  Calculator,
  CheckCircle2,
  FileText,
  Layers3,
  Sparkles
} from "lucide-react";
import { Link } from "react-router-dom";

import { useAppSelector } from "../app/hooks";
import { ThemeToggle } from "../shared/components/ThemeToggle";
import { classNames } from "../shared/utils/classNames";

const features = [
  {
    icon: <Layers3 className="h-5 w-5" />,
    title: "فهرست‌بهای ابنیه ۱۴۰۴",
    description: "فصل‌ها، گروه‌ها و آیتم‌ها از داده واقعی سرویس خوانده می‌شوند."
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: "محاسبه قابل پیگیری",
    description: "مقدار را وارد کنید و مبالغ محاسبه‌شده را مشاهده کنید."
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "افزودن ردیف به صورت‌بها",
    description: "آیتم محاسبه‌شده به سند جاری اضافه می‌شود."
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "ضرایب پروژه",
    description: "مجموعه ضرایب پروژه در محاسبه آیتم قابل انتخاب و مشاهده است."
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "پیش‌نمایش صورت‌بها",
    description: "پیش‌نمایش HTML آماده است؛ خروجی PDF واقعی به موتور رندر آینده وابسته است."
  }
];

const workflow = [
  "شرکت را بسازید",
  "صورت‌بها را شروع کنید",
  "فصل و آیتم را انتخاب کنید",
  "مقدار را محاسبه کنید",
  "ردیف را ارسال کنید"
];

const previewRows = [
  ["۰۳۰۱۰۱", "عملیات خاکی در زمین‌های نرم", "۱,۷۷۴,۰۰۰"],
  ["۰۶۰۲۰۱*", "قالب‌بندی با قیمت ستاره‌دار", "نیازمند قیمت"],
  ["۲۲۰۱۱۰", "سنگ پلاک تراورتن در سطوح افقی", "۵,۸۳۷,۰۰۰"]
];

export function LandingPage() {
  const status = useAppSelector((state) => state.auth.status);
  const isAuthenticated = status === "authenticated";
  const appCtaPath = isAuthenticated ? "/companies" : "/login";
  const appCtaLabel = isAuthenticated ? "ورود به فضای کار" : "ورود / ثبت‌نام";

  return (
    <main className="min-h-screen overflow-x-hidden bg-ui-canvas text-ui-text-primary">
      <div className="pointer-events-none fixed inset-0 bg-gradient-to-br from-ui-canvas via-brand-950/30 to-ui-canvas" />
      <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-ui-primary/10 to-transparent" />

      <header className="sticky top-0 z-30 border-b border-ui-border-subtle bg-ui-surface/45 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-3 sm:px-6 sm:py-4 lg:px-8">
          <Link className="flex min-w-0 items-center gap-2 sm:gap-3" to="/">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-brand-700 to-brand-500 text-base font-black text-white shadow-brand-soft sm:h-11 sm:w-11 sm:text-xl">
              م
            </span>
            <span className="hidden min-w-0 min-[360px]:block">
              <span className="block truncate text-lg font-black text-ui-text-primary">متریل</span>
              <span className="block text-xs font-bold text-ui-text-muted">Metril</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-ui-text-secondary md:flex">
            <a className="transition hover:text-ui-primary" href="#features">
              امکانات
            </a>
            <a className="transition hover:text-ui-primary" href="#workflow">
              روند کار
            </a>
            <a className="transition hover:text-ui-primary" href="#demo">
              نسخه آزمایشی
            </a>
          </nav>

          <div className="flex shrink-0 items-center gap-2">
            <ThemeToggle />
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-ui-border-default bg-ui-surface px-3 text-sm font-bold text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft sm:px-4"
              to={appCtaPath}
            >
              <span className="sm:hidden">ورود</span>
              <span className="hidden sm:inline">{appCtaLabel}</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-7 px-3 py-8 sm:min-h-[calc(100vh-68px)] sm:gap-10 sm:px-6 sm:py-10 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-5 text-center sm:space-y-7 lg:text-right">
          <div className="inline-flex max-w-full items-center gap-2 rounded-2xl border border-ui-primary/30 bg-ui-overlay px-3 py-2 text-right text-xs font-black leading-6 text-ui-primary backdrop-blur sm:rounded-full sm:px-4">
            <Sparkles className="h-4 w-4 shrink-0" />
            نسخه آزمایشی برای جریان واقعی صورت‌بها
          </div>

          <div className="space-y-3 sm:space-y-5">
            <h1 className="text-3xl font-black leading-tight text-white sm:text-5xl lg:text-6xl">
              متریل؛ صورت‌بها را دقیق‌تر، سریع‌تر و قابل پیگیری‌تر بسازید
            </h1>
            <p className="mx-auto max-w-2xl text-sm leading-7 text-ui-text-secondary sm:text-lg sm:leading-8 lg:mx-0">
              متریل به پیمانکار، مشاور و دفتر فنی کمک می‌کند از فهرست‌بهای رسمی به محاسبه، ردیف‌های
              قابل بازبینی و پیش‌نمایش صورت‌بها برسند، بدون اینکه قیمت‌های خالی به صفر تبدیل شوند.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:justify-center sm:gap-3 lg:justify-start">
            <Link
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-700 to-brand-500 px-3 py-2 text-center text-sm font-black text-white shadow-brand-soft transition hover:from-brand-600 hover:to-brand-400 sm:h-12 sm:px-6 sm:py-0"
              to={appCtaPath}
            >
              <span className="sm:hidden">شروع کار</span>
              <span className="hidden sm:inline">{appCtaLabel}</span>
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <a
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle px-3 py-2 text-center text-sm font-black text-ui-text-primary transition hover:border-ui-primary/35 hover:bg-ui-primary-soft sm:h-12 sm:px-6 sm:py-0"
              href="#features"
            >
              مشاهده امکانات
            </a>
          </div>
        </div>

        <div className="relative min-w-0">
          <div className="absolute -inset-1 rounded-3xl border border-ui-primary/30 bg-ui-primary-soft blur-xl" />
          <div className="relative overflow-hidden rounded-2xl border border-ui-border-subtle bg-ui-surface/65 p-3 shadow-ui backdrop-blur-xl sm:rounded-3xl sm:p-5">
            <div className="flex items-center justify-between border-b border-ui-border-subtle pb-3 sm:pb-4">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-300/70" />
                <span className="h-3 w-3 rounded-full bg-ui-success/70" />
              </div>
              <span className="rounded-lg border border-ui-border-subtle bg-ui-overlay px-3 py-1 text-[11px] font-bold text-ui-text-muted">
                فهرست‌بهای ابنیه ۱۴۰۴
              </span>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 sm:mt-5 sm:gap-3">
              {[
                ["جمع کل", "۴,۸۵۰,۰۰۰"],
                ["ردیف‌ها", "۱۲"],
                ["ضریب فعال", "۱.۱۵۰"]
              ].map(([label, value], index) => (
                <div
                  className={classNames(
                    "min-w-0 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-2 text-center sm:rounded-2xl sm:p-4",
                    index === 1 && "bg-ui-primary-soft",
                    index === 2 && "bg-amber-400/10"
                  )}
                  key={label}
                >
                  <p className="truncate text-[10px] font-bold text-ui-text-muted sm:text-xs">{label}</p>
                  <p className="mt-1 truncate text-sm font-black text-ui-text-primary sm:mt-2 sm:text-lg">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-3 space-y-2 sm:hidden">
              {previewRows.map(([code, title, amount], index) => (
                <div
                  className={classNames(
                    "rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3",
                    index === 1 && "bg-amber-400/10"
                  )}
                  key={code}
                >
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="font-mono font-black text-ui-primary">{code}</span>
                    <span className="shrink-0 font-black text-ui-text-primary">{amount}</span>
                  </div>
                  <p className="mt-1.5 line-clamp-2 text-xs leading-5 text-ui-text-secondary">{title}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 hidden overflow-x-auto rounded-2xl border border-ui-border-subtle sm:block">
              <div className="min-w-[520px]">
                <div className="grid grid-cols-[110px_1fr_120px] bg-ui-surface/65 px-4 py-3 text-xs font-black text-ui-text-muted">
                  <span>کد آیتم</span>
                  <span>شرح عملیات</span>
                  <span className="text-left">بهای کل</span>
                </div>
                {previewRows.map(([code, title, amount], index) => (
                  <div
                    className={classNames(
                      "grid grid-cols-[110px_1fr_120px] border-t border-ui-border-subtle px-4 py-4 text-sm ",
                      index === 1 && "bg-amber-400/10"
                    )}
                    key={code}
                  >
                    <span className="font-mono font-black text-ui-primary">{code}</span>
                    <span className="text-ui-text-secondary">{title}</span>
                    <span className="text-left font-black text-ui-text-primary">{amount}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 hidden rounded-2xl border border-ui-primary/30 bg-ui-primary-soft p-4 text-sm leading-7 text-ui-primary sm:block">
              نمای ساختاری محیط کار: مسیر واقعی بعد از ورود با شرکت، پروژه، فهرست‌بها و محاسبه انجام می‌شود.
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-ui-border-subtle bg-ui-surface py-10 sm:py-20" id="features">
        <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-2xl font-black text-ui-text-primary sm:text-3xl">امکانات نسخه آزمایشی متریل</h2>
            <p className="text-sm leading-7 text-ui-text-secondary">
              این نسخه برای تست جریان اصلی صورت‌بها آماده شده و ادعای آماده‌بودن تولید ندارد.
            </p>
          </div>
          <div className="mt-5 grid gap-2 sm:mt-10 sm:gap-4 md:grid-cols-2 xl:grid-cols-5">
            {features.map((feature) => (
              <article
                className="grid grid-cols-[2.5rem_1fr] gap-x-3 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3 backdrop-blur transition hover:border-ui-primary/30 hover:bg-ui-primary-soft sm:rounded-2xl sm:p-5 md:block"
                key={feature.title}
              >
                <div className="row-span-2 flex h-10 w-10 items-center justify-center rounded-lg border border-ui-primary/30 bg-ui-primary-soft text-ui-primary sm:h-11 sm:w-11 sm:rounded-xl">
                  {feature.icon}
                </div>
                <h3 className="text-sm font-black text-ui-text-primary sm:text-base md:mt-5">{feature.title}</h3>
                <p className="mt-1 text-xs leading-6 text-ui-text-muted sm:text-sm sm:leading-7 md:mt-3">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-3 py-10 sm:px-6 sm:py-20 lg:px-8" id="workflow">
        <div className="grid gap-6 sm:gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-ui-primary/30 bg-ui-primary-soft px-3 py-1.5 text-xs font-black text-ui-primary">
              روند کار
            </span>
            <h2 className="text-2xl font-black text-ui-text-primary sm:text-3xl">از شرکت تا صورت‌بهای قابل بازبینی</h2>
            <p className="text-sm leading-7 text-ui-text-secondary">
              جریان آزمایشی از همان مسیر داخل اپ شروع می‌شود و داده‌های شرکت و پروژه پشت احراز هویت باقی می‌مانند.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-5">
            {workflow.map((step, index) => (
              <div
                className={classNames(
                  "flex items-center gap-2 rounded-xl border border-ui-border-subtle bg-ui-surface-subtle p-3 sm:rounded-2xl sm:p-4 md:block",
                  index === workflow.length - 1 && "col-span-2 md:col-span-1"
                )}
                key={step}
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-tr from-brand-700 to-brand-500 text-xs font-black text-white sm:h-9 sm:w-9 sm:text-sm">
                  {index + 1}
                </span>
                <p className="text-xs font-black leading-5 text-ui-text-primary sm:text-sm sm:leading-7 md:mt-4">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-3 pb-10 sm:px-6 sm:pb-20 lg:px-8" id="demo">
        <div className="rounded-2xl border border-ui-border-subtle bg-ui-surface/65 p-4 text-center backdrop-blur-xl sm:rounded-3xl sm:p-10">
          <Building2 className="mx-auto h-9 w-9 text-ui-primary" />
          <h2 className="mt-4 text-2xl font-black text-ui-text-primary sm:text-3xl">ورود به فضای آزمایشی متریل</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm leading-7 text-ui-text-secondary">
            کاربران واردشده مستقیم به فضای شرکت‌ها هدایت می‌شوند. کاربران جدید از ورود تلفنی توسعه شروع می‌کنند.
          </p>
          <Link
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-brand-700 to-brand-500 px-6 text-sm font-black text-white shadow-brand-soft transition hover:from-brand-600 hover:to-brand-400"
            to={appCtaPath}
          >
            {appCtaLabel}
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
