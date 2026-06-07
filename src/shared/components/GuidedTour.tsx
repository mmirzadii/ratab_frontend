import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import {
  dismissOnboarding,
  nextTourStep,
  previousTourStep,
  setActiveTourStep
} from "../../features/ui/uiSlice";
import { Button } from "./Button";
import { GlassCard } from "./GlassCard";

const tourSteps = [
  {
    title: "نمای کلی رتب",
    body: "این صفحه فقط پیش‌نمایش طراحی فاز ۲ است و هنوز داشبورد عملیاتی شرکت یا صورت‌بها نیست."
  },
  {
    title: "حالت روشن و تاریک",
    body: "از دکمه پایین نوار راست می‌توانید ظاهر برنامه را تغییر دهید. انتخاب شما روی همین دستگاه ذخیره می‌شود."
  },
  {
    title: "مسیر فازهای بعدی",
    body: "ورود، شرکت‌ها، فهرست‌بها و اسناد مالی در فازهای بعدی به همین ساختار اضافه می‌شوند."
  }
];

export function GuidedTour() {
  const dispatch = useAppDispatch();
  const { activeTourStep, hasDismissedOnboarding } = useAppSelector((state) => state.ui);

  if (hasDismissedOnboarding) {
    return null;
  }

  const step = tourSteps[activeTourStep] ?? tourSteps[0];
  const isLastStep = activeTourStep === tourSteps.length - 1;

  return (
    <GlassCard className="fixed bottom-5 left-5 z-40 w-[min(420px,calc(100vw-7rem))] p-5">
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
  );
}
