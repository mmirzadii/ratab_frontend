import {
  Building2,
  CircleHelp,
  Home,
  Menu,
  Moon,
  PanelsTopLeft,
  Sun,
  Wifi
} from "lucide-react";
import { Outlet } from "react-router-dom";

import { useAppDispatch, useAppSelector } from "../../app/hooks";
import { toggleTheme } from "../../features/ui/uiSlice";

const navItems = [
  { label: "سلامت", icon: Wifi, active: true },
  { label: "داشبورد", icon: Home, active: false },
  { label: "شرکت‌ها", icon: Building2, active: false },
  { label: "راهنما", icon: CircleHelp, active: false }
];

export function AppShell() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const isDark = theme === "dark";

  return (
    <div className="min-h-screen bg-ratab-night text-slate-100 transition-colors light:bg-slate-100 light:text-slate-950">
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.20),transparent_34%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.18),transparent_30%),linear-gradient(135deg,#05050a_0%,#0f172a_58%,#05050a_100%)] light:bg-[radial-gradient(circle_at_15%_15%,rgba(20,184,166,0.18),transparent_32%),radial-gradient(circle_at_82%_20%,rgba(139,92,246,0.14),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#ecfeff_55%,#f8fafc_100%)]" />

      <aside className="fixed right-0 top-0 z-30 flex h-screen w-20 flex-col items-center border-l border-white/10 bg-slate-950/45 px-3 py-5 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/70">
        <button
          type="button"
          className="mb-8 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 shadow-emerald-soft transition hover:scale-105"
          aria-label="منوی اصلی"
        >
          <Menu className="h-6 w-6" />
        </button>

        <nav className="flex flex-1 flex-col items-center gap-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                type="button"
                className={`group relative flex h-12 w-12 items-center justify-center rounded-lg border transition ${
                  item.active
                    ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
                    : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
                }`}
                aria-label={item.label}
              >
                <Icon className="h-5 w-5" />
                <span className="pointer-events-none absolute right-14 top-2.5 z-40 rounded-lg border border-white/10 bg-slate-950 px-3 py-1.5 text-xs font-bold text-white opacity-0 shadow-lg transition group-hover:opacity-100">
                  {item.label}
                </span>
              </button>
            );
          })}
        </nav>

        <button
          type="button"
          onClick={() => dispatch(toggleTheme())}
          className="flex h-12 w-12 items-center justify-center rounded-lg border border-white/10 bg-white/8 text-slate-100 transition hover:border-violet-300/35 hover:bg-violet-400/15 light:border-slate-200 light:bg-white light:text-slate-700"
          aria-label="تغییر حالت روشن و تاریک"
        >
          {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </button>
      </aside>

      <div className="relative z-10 pr-20">
        <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/28 backdrop-blur-xl light:border-slate-200 light:bg-white/70">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-to-tr from-emerald-400 to-teal-300 text-xl font-black text-slate-950 shadow-emerald-soft">
                ر
              </div>
              <div>
                <p className="text-lg font-black leading-6 text-white light:text-slate-950">رتب</p>
                <p className="text-xs text-slate-400 light:text-slate-500">
                  پایه فرانت‌اند نسخه v0.0
                </p>
              </div>
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-white/10 bg-white/7 px-3 py-2 text-xs text-slate-300 light:border-slate-200 light:bg-white light:text-slate-600 sm:flex">
              <PanelsTopLeft className="h-4 w-4 text-emerald-300" />
              React + Vite + RTK Query
            </div>
          </div>
        </header>

        <main>
          <Outlet />
        </main>
      </div>
    </div>
  );
}
