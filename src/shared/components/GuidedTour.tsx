import { ArrowLeft, ArrowRight, CheckCircle2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import { useAppDispatch } from "../../app/hooks";
import { dismissOnboarding } from "../../features/ui/uiSlice";

const PADDING = 10;
const CARD_WIDTH = 360;
const CARD_HEIGHT_ESTIMATE = 180;

type TourStep = {
  target: string; // data-tour attribute value
  title: string;
  body: string;
};

type PageTour = {
  key: string;
  steps: TourStep[];
};

const companyListTour: PageTour = {
  key: "tour_seen_companies",
  steps: [
    {
      target: "company-list",
      title: "شرکت‌های شما",
      body: "شرکت‌های قابل دسترس اینجا هستند؛ روی هر کدام کلیک کنید تا وارد شوید."
    },
    {
      target: "add-company-btn",
      title: "افزودن شرکت",
      body: "با این دکمه می‌توانید شرکت جدید بسازید و مستقیم وارد داشبورد آن شوید."
    }
  ]
};

const companyDashboardTour: PageTour = {
  key: "tour_seen_company_dashboard",
  steps: [
    {
      target: "messages-area",
      title: "پیام‌های شرکت",
      body: "پیام‌های شرکت اینجاست؛ مثل یک گفت‌وگو پیش بروید و صورت‌بها را مثل پیوست ضمیمه کنید."
    },
    {
      target: "composer-add-action",
      title: "افزودن پیوست",
      body: "از «افزودن» فایل یا صورت‌بها را به پیش‌نویس پیام ضمیمه کنید."
    }
  ]
};

const wizardPricebookTour: PageTour = {
  key: "tour_seen_wizard",
  steps: [
    {
      target: "chapter-list",
      title: "فصل‌های فهرست‌بها",
      body: "فصل‌های فهرست‌بها را از اینجا انتخاب کنید تا آیتم‌های مرتبط نمایش داده شوند."
    },
    {
      target: "pricebook-item",
      title: "انتخاب آیتم",
      body: "روی هر آیتم کلیک کنید تا جزئیات، محاسبه مقدار و افزودن به صورت‌بها باز شود."
    }
  ]
};

const wizardFinalizeTour: PageTour = {
  key: "tour_seen_finalize",
  steps: [
    {
      target: "finalize-rows",
      title: "ردیف‌های صورت‌بها",
      body: "ردیف‌هایی که اضافه کردید اینجا فهرست شده‌اند؛ می‌توانید مقدار هر ردیف را ویرایش کنید."
    },
    {
      target: "preview-btn",
      title: "پیش‌نمایش صورت‌بها",
      body: "با این دکمه پیش‌نمایش صورت وضعیت رسمی را ببینید یا خروجی PDF بگیرید."
    }
  ]
};

function getTour(pathname: string): PageTour | null {
  if (/^\/companies\/\d+\/cost-reports\/new/.test(pathname)) {
    // Try finalize first (its elements will be in DOM when that section is active)
    return wizardFinalizeTour;
  }
  if (/^\/companies\/\d+/.test(pathname)) {
    return companyDashboardTour;
  }
  if (pathname.startsWith("/companies")) {
    return companyListTour;
  }
  return null;
}

function getWizardTour(pathname: string): PageTour[] {
  if (/^\/companies\/\d+\/cost-reports\/new/.test(pathname)) {
    return [wizardPricebookTour, wizardFinalizeTour];
  }
  return [];
}

function isTourSeen(key: string): boolean {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markTourSeen(key: string): void {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // Ignore storage errors
  }
}

function getElementRect(target: string): DOMRect | null {
  const el = document.querySelector(`[data-tour="${target}"]`);
  return el ? el.getBoundingClientRect() : null;
}

type CardPosition = {
  top: number;
  left: number;
  arrowSide: "top" | "bottom";
};

function computeCardPosition(rect: DOMRect): CardPosition {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 12;

  // Vertical: prefer below, flip to above if too close to bottom
  let top: number;
  let arrowSide: "top" | "bottom";

  if (rect.bottom + CARD_HEIGHT_ESTIMATE + margin > vh) {
    top = Math.max(margin, rect.top - CARD_HEIGHT_ESTIMATE - margin);
    arrowSide = "bottom";
  } else {
    top = rect.bottom + margin;
    arrowSide = "top";
  }

  // Horizontal: align to element start, clamp to viewport
  const rawLeft = rect.left;
  const left = Math.max(margin, Math.min(rawLeft, vw - CARD_WIDTH - margin));

  return { top, left, arrowSide };
}

export function GuidedTour() {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const [stepIndex, setStepIndex] = useState(0);
  const [activeTour, setActiveTour] = useState<PageTour | null>(null);
  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);
  const [cardPos, setCardPos] = useState<CardPosition | null>(null);
  // Determine and auto-start tour on route change
  useEffect(() => {
    setActiveTour(null);
    setStepIndex(0);

    const basicTour = getTour(location.pathname);
    const wizardTours = getWizardTour(location.pathname);

    // For wizard pages, find the first unseen tour whose first element exists in DOM
    if (wizardTours.length > 0) {
      const timeoutId = window.setTimeout(() => {
        for (const tour of wizardTours) {
          if (!isTourSeen(tour.key)) {
            setActiveTour(tour);
            return;
          }
        }
      }, 600);
      return () => window.clearTimeout(timeoutId);
    }

    if (basicTour && !isTourSeen(basicTour.key)) {
      const timeoutId = window.setTimeout(() => setActiveTour(basicTour), 600);
      return () => window.clearTimeout(timeoutId);
    }
  }, [location.pathname]);

  // Update highlight rect for current step
  const updateRect = useCallback(() => {
    if (!activeTour) return;
    const step = activeTour.steps[stepIndex];
    if (!step) return;
    const rect = getElementRect(step.target);
    setHighlightRect(rect);
    setCardPos(rect ? computeCardPosition(rect) : null);
  }, [activeTour, stepIndex]);

  useEffect(() => {
    updateRect();
    window.addEventListener("resize", updateRect, { passive: true });
    window.addEventListener("scroll", updateRect, { passive: true });
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
    };
  }, [updateRect]);

  function dismiss() {
    if (activeTour) markTourSeen(activeTour.key);
    dispatch(dismissOnboarding());
    setActiveTour(null);
  }

  function goNext() {
    if (!activeTour) return;
    if (stepIndex < activeTour.steps.length - 1) {
      setStepIndex((i) => i + 1);
    } else {
      dismiss();
    }
  }

  function goPrev() {
    if (stepIndex > 0) setStepIndex((i) => i - 1);
  }

  if (!activeTour) return null;

  const step = activeTour.steps[stepIndex];
  const isLastStep = stepIndex === activeTour.steps.length - 1;

  return (
    <>
      {/* Full-screen overlay — the box-shadow on the highlight creates the dimming */}
      <div className="pointer-events-none fixed inset-0 z-[45] bg-ui-overlay" />

      {/* Spotlight highlight around the target element */}
      {highlightRect ? (
        <div
          className="pointer-events-none fixed z-[46] rounded-xl border-2 border-ui-primary/90"
          style={{
            top: highlightRect.top - PADDING,
            left: highlightRect.left - PADDING,
            width: highlightRect.width + PADDING * 2,
            height: highlightRect.height + PADDING * 2,
            boxShadow:
              "0 0 0 9999px rgba(2,6,23,0.0), 0 0 28px color-mix(in srgb, var(--ui-primary) 45%, transparent)"
          }}
        />
      ) : null}

      {/* Tour card */}
      <div
        className="fixed z-[47] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-ui-primary/30 bg-ui-surface-elevated/90 p-5 shadow-ui backdrop-blur-xl"
        style={
          cardPos
            ? { top: cardPos.top, left: cardPos.left }
            : { bottom: "1.5rem", left: "1rem" }
        }
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-bold text-ui-primary">
              {stepIndex + 1} از {activeTour.steps.length}
            </p>
            <h3 className="text-base font-black text-white">{step.title}</h3>
          </div>
          <button
            aria-label="بستن راهنما"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-ui-text-muted transition hover:bg-ui-surface-subtle hover:text-ui-text-primary"
            onClick={dismiss}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <p className="mt-3 text-sm leading-7 text-ui-text-muted">{step.body}</p>

        {/* Navigation */}
        <div className="mt-5 flex items-center justify-between gap-3">
          {/* Dots */}
          <div className="flex gap-1.5">
            {activeTour.steps.map((_, index) => (
              <button
                aria-label={`مرحله ${index + 1}`}
                className={`h-2 rounded-full transition-all ${
                  index === stepIndex
                    ? "w-6 bg-ui-primary"
                    : "w-2 bg-ui-border-subtle hover:bg-ui-border-default"
                }`}
                key={index}
                onClick={() => setStepIndex(index)}
                type="button"
              />
            ))}
          </div>

          {/* Prev / Next buttons */}
          <div className="flex items-center gap-2">
            {stepIndex > 0 ? (
              <button
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-ui-surface-subtle text-ui-text-secondary transition hover:bg-ui-surface-hover hover:text-ui-text-primary"
                onClick={goPrev}
                type="button"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            ) : null}
            <button
              className="flex h-9 items-center gap-2 rounded-xl bg-ui-primary px-4 text-sm font-black text-ui-primary-foreground transition hover:bg-ui-primary-hover"
              onClick={goNext}
              type="button"
            >
              {isLastStep ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  متوجه شدم
                </>
              ) : (
                <>
                  بعدی
                  <ArrowLeft className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
