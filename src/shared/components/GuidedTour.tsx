import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  dismissOnboarding,
  nextTourStep,
  previousTourStep,
  setActiveTourStep
} from "../../features/ui/uiSlice";
import { classNames } from "../utils/classNames";
import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

type TourStep = {
  title: string;
  body: string;
  focusClassName: string;
};

const defaultTourSteps: TourStep[] = [
  {
    title: "فضای کاری متریل",
    body: "مسیر اصلی از شرکت‌ها شروع می‌شود. داده‌ها از سرویس واقعی خوانده می‌شوند و بخش‌های آینده با متن راهنما مشخص شده‌اند.",
    focusClassName: "right-16 top-20 h-24 w-[min(38rem,calc(100vw-6rem))] sm:right-24"
  },
  {
    title: "حالت روشن و تاریک",
    body: "از دکمه پایین نوار راست می‌توانید ظاهر برنامه را تغییر دهید. انتخاب شما روی همین دستگاه ذخیره می‌شود.",
    focusClassName: "bottom-4 right-2 h-16 w-16 sm:right-4 sm:h-20 sm:w-20"
  },
  {
    title: "راهنما",
    body: "توضیحات طولانی صفحه‌ها به راهنما منتقل شده‌اند تا محیط کار خلوت بماند.",
    focusClassName: "right-2 top-28 h-14 w-14 sm:right-4 sm:h-16 sm:w-16"
  }
];

const companyListTourSteps: TourStep[] = [
  {
    title: "فهرست شرکت‌ها",
    body: "اینجا شرکت‌های قابل دسترس شما نمایش داده می‌شوند. صفحه فشرده است تا انتخاب شرکت سریع انجام شود.",
    focusClassName: "right-16 top-20 h-28 w-[min(42rem,calc(100vw-6rem))] sm:right-24"
  },
  {
    title: "افزودن شرکت",
    body: "دکمه افزودن شرکت مسیر ساخت شرکت و ورود مستقیم به داشبورد همان شرکت را باز می‌کند.",
    focusClassName: "left-4 top-28 h-20 w-52 sm:left-8"
  },
  {
    title: "راهنما",
    body: "برای توضیح مسیرها و مرز نسخه آزمایشی، از دکمه راهنما استفاده کنید.",
    focusClassName: "right-2 top-28 h-14 w-14 sm:right-4 sm:h-16 sm:w-16"
  }
];

const companyDashboardTourSteps: TourStep[] = [
  {
    title: "پیام‌های شرکت",
    body: "داشبورد شرکت مانند گفت‌وگو شروع می‌شود تا صورت‌بها مثل یک پیوست از همان‌جا ساخته شود.",
    focusClassName: "right-16 top-52 h-72 w-[min(52rem,calc(100vw-6rem))] sm:right-24"
  },
  {
    title: "پیوست صورت‌بها",
    body: "دکمه + کنار کادر پیام، پیوست صورت‌بها یا مسیر ساخت صورت‌بها را باز می‌کند.",
    focusClassName: "bottom-24 right-20 h-20 w-20 sm:right-28"
  },
  {
    title: "ناوبری شرکت",
    body: "تب‌های داخلی شرکت از ناوبری اصلی جدا هستند تا مسیر پیام‌ها و کارهای شرکت روشن بماند.",
    focusClassName: "right-16 top-56 h-24 w-[min(28rem,calc(100vw-6rem))] sm:right-24 lg:w-72 lg:h-96"
  }
];

const costReportTourSteps: TourStep[] = [
  {
    title: "ساخت صورت‌بها",
    body: "ابتدا پروژه و اطلاعات گزارش را وارد کنید. سال ۱۴۰۴ در صورت وجود به‌صورت پیش‌فرض انتخاب می‌شود.",
    focusClassName: "right-16 top-24 h-80 w-[min(48rem,calc(100vw-6rem))] sm:right-24"
  },
  {
    title: "مرور فهرست‌بها",
    body: "بعد از ساخت سند، فهرست فصل‌ها و آیتم‌ها فعال می‌شود و نیازی به شناسه فنی در مسیر عادی نیست.",
    focusClassName: "right-16 top-32 h-96 w-[min(52rem,calc(100vw-6rem))] sm:right-24"
  },
  {
    title: "ارسال ردیف",
    body: "در مودال آیتم، بعد از محاسبه می‌توانید ردیف را به صورت‌بهای جاری ارسال کنید.",
    focusClassName: "left-4 top-28 h-96 w-[min(36rem,calc(100vw-5rem))] sm:left-8"
  }
];

function getTourSteps(pathname: string) {
  if (/^\/companies\/\d+\/cost-reports\/new/.test(pathname)) {
    return costReportTourSteps;
  }

  if (/^\/companies\/\d+/.test(pathname)) {
    return companyDashboardTourSteps;
  }

  if (pathname.startsWith("/companies")) {
    return companyListTourSteps;
  }

  return defaultTourSteps;
}

export function GuidedTour() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const { activeTourStep, hasDismissedOnboarding } = useAppSelector((state) => state.ui);
  const tourSteps = getTourSteps(location.pathname);

  useEffect(() => {
    if (activeTourStep > tourSteps.length - 1) {
      dispatch(setActiveTourStep(0));
    }
  }, [activeTourStep, dispatch, tourSteps.length]);

  if (hasDismissedOnboarding) {
    return null;
  }

  const step = tourSteps[activeTourStep] ?? tourSteps[0];
  const isLastStep = activeTourStep === tourSteps.length - 1;

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-[35] bg-slate-950/58 backdrop-blur-[1px] light:bg-slate-900/25" />
      <div
        className={classNames(
          "pointer-events-none fixed z-40 rounded-2xl border-2 border-emerald-300/85 bg-transparent shadow-[0_0_0_9999px_rgba(2,6,23,0.34),0_0_40px_rgba(16,185,129,0.32)]",
          step.focusClassName
        )}
      />
      <GlassCard className="fixed bottom-4 left-4 z-50 w-[min(420px,calc(100vw-2rem))] p-4 sm:bottom-5 sm:left-5 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-emerald-300">راهنمای شروع</p>
            <h2 className="text-lg font-black text-white light:text-slate-950">{step.title}</h2>
          </div>
          <button
            aria-label="بستن راهنما"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-white/8 hover:text-white light:hover:bg-slate-100 light:hover:text-slate-900"
            onClick={() => dispatch(dismissOnboarding())}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-3 text-sm leading-7 text-slate-300 light:text-slate-600">{step.body}</p>

        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1.5">
            {tourSteps.map((item, index) => (
              <button
                aria-label={item.title}
                className={`h-2.5 rounded-full transition ${
                  index === activeTourStep ? "w-7 bg-emerald-300" : "w-2.5 bg-slate-600 light:bg-slate-300"
                }`}
                key={item.title}
                onClick={() => dispatch(setActiveTourStep(index))}
                type="button"
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              className="h-9 px-3"
              disabled={activeTourStep === 0}
              onClick={() => dispatch(previousTourStep())}
              variant="ghost"
            >
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              className="h-9"
              onClick={() => (isLastStep ? dispatch(dismissOnboarding()) : dispatch(nextTourStep()))}
            >
              {isLastStep ? <CheckCircle2 className="h-4 w-4" /> : <ArrowLeft className="h-4 w-4" />}
              {isLastStep ? "متوجه شدم" : "بعدی"}
            </Button>
          </div>
        </div>
      </GlassCard>
    </>
  );
}
