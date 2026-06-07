import { AlertTriangle, CheckCircle2, FileCode2, RefreshCcw, Server, WifiOff } from "lucide-react";

import { apiBaseUrl } from "../../shared/api/baseApi";
import { GlassCard } from "../../shared/components/GlassCard";
import { useGetHealthQuery } from "./healthApi";

function getErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "status" in error) {
    return `درخواست سلامت با وضعیت ${String(error.status)} پاسخ داد.`;
  }

  return "ارتباط با سرویس سلامت برقرار نشد.";
}

export function HealthStatusPage() {
  const { data, error, isFetching, isLoading, refetch } = useGetHealthQuery();
  const isReady = Boolean(data) && !error;

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 pb-10 pt-6 sm:px-6 lg:px-8">
      <section className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <GlassCard className="relative overflow-hidden p-6 sm:p-8">
          <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-l from-transparent via-emerald-300/70 to-transparent" />
          <div className="flex flex-col gap-7">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1.5 text-xs font-bold text-emerald-200">
                  <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_16px_rgba(16,185,129,0.85)]" />
                  محیط توسعه رتب
                </div>
                <div className="space-y-2">
                  <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl light:text-slate-950">
                    وضعیت اتصال فرانت‌اند به بک‌اند
                  </h1>
                  <p className="max-w-2xl text-sm leading-7 text-slate-300 light:text-slate-600">
                    این صفحه فقط پایه فنی فاز ۱ را بررسی می‌کند: مسیر‌دهی React، استور Redux،
                    RTK Query، تایپ‌های OpenAPI و فراخوانی سلامت بک‌اند از تنظیمات محیط.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => void refetch()}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/8 px-4 text-sm font-bold text-slate-100 transition hover:border-emerald-300/40 hover:bg-emerald-400/10 hover:text-emerald-100 light:border-slate-200 light:bg-white light:text-slate-700"
              >
                <RefreshCcw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
                بررسی دوباره
              </button>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-lg border border-white/8 bg-slate-950/45 p-4 light:border-slate-200 light:bg-white/80">
                <p className="text-xs text-slate-400 light:text-slate-500">آدرس API</p>
                <p className="mt-2 break-all text-left text-sm font-bold text-slate-100 light:text-slate-800" dir="ltr">
                  {apiBaseUrl || "relative origin"}
                </p>
              </div>
              <div className="rounded-lg border border-white/8 bg-slate-950/45 p-4 light:border-slate-200 light:bg-white/80">
                <p className="text-xs text-slate-400 light:text-slate-500">مسیر سلامت</p>
                <p className="mt-2 text-left text-sm font-bold text-slate-100 light:text-slate-800" dir="ltr">
                  GET /api/health/
                </p>
              </div>
              <div className="rounded-lg border border-white/8 bg-slate-950/45 p-4 light:border-slate-200 light:bg-white/80">
                <p className="text-xs text-slate-400 light:text-slate-500">وضعیت فعلی</p>
                <p className="mt-2 text-sm font-bold text-slate-100 light:text-slate-800">
                  {isLoading || isFetching ? "در حال بررسی" : isReady ? "متصل" : "نیازمند بررسی"}
                </p>
              </div>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="p-6">
          <div className="flex h-full flex-col justify-between gap-6">
            <div className="space-y-4">
              <div
                className={`flex h-14 w-14 items-center justify-center rounded-lg ${
                  isReady
                    ? "bg-emerald-400 text-slate-950 shadow-emerald-soft"
                    : error
                      ? "bg-amber-400 text-slate-950"
                      : "bg-violet-400 text-slate-950 shadow-violet-soft"
                }`}
              >
                {isReady ? (
                  <CheckCircle2 className="h-7 w-7" />
                ) : error ? (
                  <WifiOff className="h-7 w-7" />
                ) : (
                  <Server className="h-7 w-7" />
                )}
              </div>
              <div>
                <h2 className="text-xl font-black text-white light:text-slate-950">سلامت سرویس</h2>
                <p className="mt-2 text-sm leading-7 text-slate-300 light:text-slate-600">
                  پاسخ این کارت مستقیم از RTK Query می‌آید و از تایپ `HealthResponse` تولیدشده
                  از OpenAPI استفاده می‌کند.
                </p>
              </div>
            </div>

            {error ? (
              <div className="rounded-lg border border-amber-400/25 bg-amber-400/10 p-4 text-sm leading-7 text-amber-100 light:text-amber-900">
                <div className="mb-2 flex items-center gap-2 font-bold">
                  <AlertTriangle className="h-4 w-4" />
                  اتصال تایید نشد
                </div>
                {getErrorMessage(error)}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4 text-sm leading-7 text-emerald-100 light:text-emerald-900">
                {isReady ? "بک‌اند پاسخ سلامت را برگرداند." : "در انتظار پاسخ بک‌اند هستیم."}
              </div>
            )}
          </div>
        </GlassCard>
      </section>

      <GlassCard className="p-0">
        <div className="flex items-center justify-between gap-3 border-b border-white/8 px-5 py-4 light:border-slate-200">
          <h2 className="text-base font-black text-white light:text-slate-950">قرارداد API فاز ۱</h2>
          <FileCode2 className="h-5 w-5 text-emerald-300" />
        </div>
        <div className="grid gap-3 p-5 md:grid-cols-2">
          <div className="rounded-lg border border-white/8 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-sm font-bold text-slate-100 light:text-slate-900">فایل schema استفاده‌شده</p>
            <p className="mt-2 text-left text-xs text-slate-300 light:text-slate-600" dir="ltr">
              backend_docs/v0.0/openapi_v0_0.yaml
            </p>
          </div>
          <div className="rounded-lg border border-white/8 bg-white/5 p-4 light:border-slate-200 light:bg-white">
            <p className="text-sm font-bold text-slate-100 light:text-slate-900">فایل تایپ تولیدشده</p>
            <p className="mt-2 text-left text-xs text-slate-300 light:text-slate-600" dir="ltr">
              src/shared/api/generated/schema.ts
            </p>
          </div>
        </div>
      </GlassCard>

      <GlassCard className="p-0">
        <div className="border-b border-white/8 px-5 py-4 light:border-slate-200">
          <h2 className="text-base font-black text-white light:text-slate-950">پاسخ سلامت</h2>
        </div>
        {data ? (
          <dl className="divide-y divide-white/8 light:divide-slate-200">
            <div className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[180px_1fr]">
              <dt className="font-bold text-slate-300 light:text-slate-600" dir="ltr">
                status
              </dt>
              <dd className="break-words text-slate-100 light:text-slate-900">{data.status}</dd>
            </div>
            <div className="grid gap-2 px-5 py-4 text-sm sm:grid-cols-[180px_1fr]">
              <dt className="font-bold text-slate-300 light:text-slate-600" dir="ltr">
                service
              </dt>
              <dd className="break-words text-slate-100 light:text-slate-900">{data.service}</dd>
            </div>
          </dl>
        ) : (
          <div className="px-5 py-8 text-sm text-slate-400 light:text-slate-600">
            هنوز پاسخی برای نمایش دریافت نشده است.
          </div>
        )}
      </GlassCard>
    </div>
  );
}
