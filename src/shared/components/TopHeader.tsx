import { PanelsTopLeft, Sparkles } from "lucide-react";
import { useLocation } from "react-router-dom";

import { StatusBadge } from "./StatusBadge";

function getHeaderCopy(pathname: string) {
  if (pathname === "/status") {
    return {
      title: "وضعیت سرویس",
      description: "بررسی اتصال فرانت‌اند به بک‌اند توسعه"
    };
  }

  return {
    title: "پیش‌نمایش فضای کار رتب",
    description: "فاز ۲: پایه طراحی، RTL، حالت روشن/تاریک و راهنمای اولیه"
  };
}

export function TopHeader() {
  const { pathname } = useLocation();
  const copy = getHeaderCopy(pathname);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-xl font-black text-slate-950 shadow-emerald-soft">
            ر
          </div>
          <div>
            <p className="text-lg font-black leading-6 text-white light:text-slate-950">{copy.title}</p>
            <p className="text-xs text-slate-400 light:text-slate-500">{copy.description}</p>
          </div>
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <StatusBadge tone="emerald">
            <Sparkles className="h-3.5 w-3.5" />
            RTL آماده
          </StatusBadge>
          <StatusBadge>
            <PanelsTopLeft className="h-3.5 w-3.5 text-emerald-300" />
            React + RTK Query
          </StatusBadge>
        </div>
      </div>
    </header>
  );
}
