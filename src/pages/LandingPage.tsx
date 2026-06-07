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
    description: "مرور فصل‌ها، گروه‌ها و آیتم‌ها بر اساس داده رسمی واردشده در backend."
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: "محاسبه آیتم‌ها",
    description: "مقدار را وارد کنید و نتیجه را از محاسبه backend دریافت کنید."
  },
  {
    icon: <FileText className="h-5 w-5" />,
    title: "افزودن ردیف به صورت‌بها",
    description: "آیتم محاسبه‌شده به سند جاری اضافه می‌شود و جمع‌ها از backend به‌روز می‌شوند."
  },
  {
    icon: <BarChart3 className="h-5 w-5" />,
    title: "ضرایب پروژه",
    description: "ضرایب پروژه را تعریف کنید و اثر آن‌ها را در محاسبه آیتم ببینید."
  },
  {
    icon: <CheckCircle2 className="h-5 w-5" />,
    title: "پیش‌نمایش صورت‌بها",
    description: "پیش‌نمایش HTML برای بررسی خروجی آماده است؛ PDF در نسخه آزمایشی محدود است."
  }
];

const workflow = [
  "شرکت را بسازید",
  "صورت‌بها را شروع کنید",
  "فصل و آیتم را انتخاب کنید",
  "مقدار را وارد کنید",
  "ردیف به صورت‌بها اضافه می‌شود"
];

export function LandingPage() {
  const token = useAppSelector((state) => state.auth.token);
  const appCtaPath = token ? "/companies" : "/login";
  const appCtaLabel = token ? "ورود به محیط کار" : "ورود به نسخه آزمایشی";

  return (
    <main className="min-h-screen overflow-hidden bg-ratab-night text-slate-100 light:bg-slate-100 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(135deg,#05050a_0%,#0f172a_48%,#05050a_100%)] light:bg-[linear-gradient(135deg,#f8fafc_0%,#ecfeff_58%,#f8fafc_100%)]" />
      <div className="pointer-events-none fixed inset-0 opacity-25 [background-image:linear-gradient(rgba(148,163,184,0.14)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="pointer-events-none fixed inset-x-0 top-0 h-72 bg-gradient-to-b from-emerald-400/10 to-transparent" />

      <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/45 backdrop-blur-xl light:border-slate-200/80 light:bg-white/70">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <Link className="flex items-center gap-3" to="/">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-300 text-xl font-black text-slate-950 shadow-emerald-soft">
              ر
            </span>
            <span>
              <span className="block text-lg font-black text-white light:text-slate-950">رتب</span>
              <span className="block text-xs font-bold text-slate-400 light:text-slate-500">Ratab</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-300 light:text-slate-600 md:flex">
            <a className="transition hover:text-emerald-300 light:hover:text-emerald-700" href="#features">
              امکانات
            </a>
            <a className="transition hover:text-emerald-300 light:hover:text-emerald-700" href="#workflow">
              روند کار
            </a>
            <a className="transition hover:text-emerald-300 light:hover:text-emerald-700" href="#demo">
              نسخه آزمایشی
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-emerald-300/35 hover:bg-emerald-400/15 light:border-slate-200 light:bg-white light:text-slate-800"
              to={appCtaPath}
            >
              {appCtaLabel}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto grid min-h-[calc(100vh-80px)] max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
        <div className="space-y-7 text-center lg:text-right">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-slate-950/70 px-4 py-2 text-xs font-black text-emerald-200 backdrop-blur light:bg-white/70 light:text-emerald-800">
            <Sparkles className="h-4 w-4" />
            نسخه آزمایشی برای آزمون جریان صورت‌بها
          </div>

          <div className="space-y-5">
            <h1 className="text-4xl font-black leading-tight text-white sm:text-5xl lg:text-6xl light:text-slate-950">
              صورت‌بها را سریع‌تر، دقیق‌تر و قابل پیگیری‌تر بسازید
            </h1>
            <p className="mx-auto max-w-2xl text-base leading-8 text-slate-300 sm:text-lg light:text-slate-600 lg:mx-0">
              رتب به پیمانکار، مشاور، دفتر فنی و کاربران پروژه‌های عمرانی کمک می‌کند صورت‌بها را بر اساس
              فهرست‌بها با محاسبه قابل بررسی، ردیف‌های قابل پیگیری و خروجی آماده بازبینی بسازند.
            </p>
          </div>

          <div className="flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
            <Link
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-400 to-teal-300 px-6 text-sm font-black text-slate-950 shadow-emerald-soft transition hover:from-emerald-300 hover:to-teal-200"
              to={appCtaPath}
            >
              {appCtaLabel}
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <a
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/8 px-6 text-sm font-black text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-800"
              href="#features"
            >
              مشاهده امکانات
            </a>
          </div>

          {token ? (
            <p className="text-sm leading-7 text-emerald-100 light:text-emerald-800">
              نشست شما فعال است. می‌توانید از همین صفحه وارد محیط شرکت‌ها شوید.
            </p>
          ) : null}
        </div>

        <div className="relative">
          <div className="absolute -inset-1 rounded-3xl border border-emerald-300/20 bg-emerald-400/10 blur-xl" />
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65 p-5 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/75">
            <div className="flex items-center justify-between border-b border-white/10 pb-4 light:border-slate-200">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-400/70" />
                <span className="h-3 w-3 rounded-full bg-amber-300/70" />
                <span className="h-3 w-3 rounded-full bg-emerald-300/70" />
              </div>
              <span className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-1 text-[11px] font-bold text-slate-400 light:border-slate-200 light:bg-slate-50 light:text-slate-500">
                ABN1404 / صورت‌بهای جاری
              </span>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                ["جمع کل", "۴,۸۵۰,۰۰۰"],
                ["ردیف‌ها", "۱۲"],
                ["ضریب فعال", "۱.۱۵۰"]
              ].map(([label, value], index) => (
                <div
                  className={classNames(
                    "rounded-2xl border border-white/10 bg-white/7 p-4 text-center light:border-slate-200 light:bg-slate-50",
                    index === 1 && "bg-violet-400/10",
                    index === 2 && "bg-amber-400/10"
                  )}
                  key={label}
                >
                  <p className="text-xs font-bold text-slate-400 light:text-slate-500">{label}</p>
                  <p className="mt-2 text-lg font-black text-white light:text-slate-950">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 overflow-hidden rounded-2xl border border-white/10 light:border-slate-200">
              <div className="grid grid-cols-[110px_1fr_120px] bg-slate-950/65 px-4 py-3 text-xs font-black text-slate-400 light:bg-slate-50 light:text-slate-500">
                <span>کد آیتم</span>
                <span>شرح عملیات</span>
                <span className="text-left">بهای کل</span>
              </div>
              {[
                ["۰۳۰۱۰۱", "عملیات خاکی در زمین‌های نرم", "۱,۷۷۴,۰۰۰"],
                ["۰۶۰۲۰۱*", "قالب‌بندی با قیمت ستاره‌دار", "نیازمند قیمت"],
                ["۲۲۰۱۱۰", "سنگ پلاک تراورتن در سطوح افقی", "۵,۸۳۷,۰۰۰"]
              ].map(([code, title, amount], index) => (
                <div
                  className={classNames(
                    "grid grid-cols-[110px_1fr_120px] border-t border-white/10 px-4 py-4 text-sm light:border-slate-200",
                    index === 1 && "bg-amber-400/10"
                  )}
                  key={code}
                >
                  <span className="font-mono font-black text-emerald-200 light:text-emerald-700">{code}</span>
                  <span className="text-slate-200 light:text-slate-700">{title}</span>
                  <span className="text-left font-black text-white light:text-slate-950">{amount}</span>
                </div>
              ))}
            </div>

            <div className="mt-5 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100 light:text-emerald-800">
              پیش‌نمایش HTML و خروجی metadata برای نسخه آزمایشی آماده است؛ PDF واقعی تا تایید موتور رندر فعال نمی‌شود.
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 border-y border-white/10 bg-slate-950/35 py-20 light:border-slate-200 light:bg-white/45" id="features">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl space-y-3">
            <h2 className="text-3xl font-black text-white light:text-slate-950">امکانات نسخه آزمایشی رتب</h2>
            <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
              این نسخه برای تست جریان واقعی صورت‌بها آماده شده و هنوز ادعای آمادگی تولید ندارد.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            {features.map((feature) => (
              <article
                className="rounded-2xl border border-white/10 bg-white/7 p-5 backdrop-blur transition hover:border-emerald-300/35 hover:bg-emerald-400/10 light:border-slate-200 light:bg-white"
                key={feature.title}
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-300/20 bg-emerald-400/10 text-emerald-200 light:text-emerald-800">
                  {feature.icon}
                </div>
                <h3 className="mt-5 text-base font-black text-white light:text-slate-950">{feature.title}</h3>
                <p className="mt-3 text-sm leading-7 text-slate-400 light:text-slate-600">{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8" id="workflow">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div className="space-y-4">
            <span className="inline-flex rounded-full border border-violet-300/25 bg-violet-400/10 px-3 py-1.5 text-xs font-black text-violet-100 light:text-violet-800">
              روند کار
            </span>
            <h2 className="text-3xl font-black text-white light:text-slate-950">از شرکت تا صورت‌بهای قابل بازبینی</h2>
            <p className="text-sm leading-7 text-slate-300 light:text-slate-600">
              جریان آزمایشی از همان مسیر داخل اپ شروع می‌شود و داده‌های شرکت و پروژه پشت احراز هویت باقی می‌مانند.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-5">
            {workflow.map((step, index) => (
              <div
                className="rounded-2xl border border-white/10 bg-white/7 p-4 light:border-slate-200 light:bg-white"
                key={step}
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-sm font-black text-slate-950">
                  {index + 1}
                </span>
                <p className="mt-4 text-sm font-black leading-7 text-white light:text-slate-950">{step}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8" id="demo">
        <div className="rounded-3xl border border-white/10 bg-slate-950/65 p-6 text-center backdrop-blur-xl light:border-slate-200 light:bg-white/75 sm:p-10">
          <Building2 className="mx-auto h-9 w-9 text-emerald-200 light:text-emerald-700" />
          <h2 className="mt-5 text-3xl font-black text-white light:text-slate-950">آماده تست نسخه آزمایشی هستید؟</h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-300 light:text-slate-600">
            برای شروع، وارد نسخه آزمایشی شوید، شرکت بسازید و جریان صورت‌بها را با سرویس توسعه بررسی کنید.
          </p>
          <Link
            className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gradient-to-l from-emerald-400 to-teal-300 px-6 text-sm font-black text-slate-950 shadow-emerald-soft transition hover:from-emerald-300 hover:to-teal-200"
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
