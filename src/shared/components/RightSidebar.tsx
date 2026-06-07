import { Building2, CircleHelp, Menu, Wifi } from "lucide-react";
import { NavLink } from "react-router-dom";

import { classNames } from "../utils/classNames";
import { IconButton } from "./IconButton";
import { ThemeToggle } from "./ThemeToggle";
import { Tooltip } from "./Tooltip";

const navItems = [
  { label: "شرکت‌ها", icon: Building2, to: "/companies" },
  { label: "سلامت سرویس", icon: Wifi, to: "/status" },
  { label: "راهنما", icon: CircleHelp }
];

export function RightSidebar() {
  return (
    <aside className="fixed right-0 top-0 z-30 flex h-screen w-20 flex-col items-center border-l border-white/10 bg-slate-950/45 px-3 py-5 shadow-2xl backdrop-blur-xl light:border-slate-200 light:bg-white/70">
      <Tooltip label="منوی اصلی">
        <IconButton
          aria-label="منوی اصلی"
          className="mb-8 bg-gradient-to-tr from-emerald-400 to-teal-300 text-slate-950 shadow-emerald-soft hover:scale-105"
        >
          <Menu className="h-6 w-6" />
        </IconButton>
      </Tooltip>

      <nav className="flex flex-1 flex-col items-center gap-4" aria-label="ناوبری اصلی">
        {navItems.map((item) => {
          const Icon = item.icon;

          if (!item.to) {
            return (
              <Tooltip key={item.label} label={`${item.label} - فازهای بعدی`}>
                <IconButton aria-label={item.label} disabled>
                  <Icon className="h-5 w-5" />
                </IconButton>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={item.label} label={item.label}>
              <NavLink
                aria-label={item.label}
                className={({ isActive }) =>
                  classNames(
                    "flex h-12 w-12 items-center justify-center rounded-lg border transition",
                    isActive
                      ? "border-emerald-300/30 bg-emerald-400/15 text-emerald-200"
                      : "border-transparent text-slate-400 hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
                  )
                }
                to={item.to}
              >
                <Icon className="h-5 w-5" />
              </NavLink>
            </Tooltip>
          );
        })}
      </nav>

      <Tooltip label="حالت روشن و تاریک">
        <ThemeToggle />
      </Tooltip>
    </aside>
  );
}
