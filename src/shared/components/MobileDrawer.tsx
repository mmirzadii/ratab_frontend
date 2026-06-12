import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppShell } from "../../app/appShellContext";
import { classNames } from "../utils/classNames";
import { PrimaryNavContent } from "./PrimaryNavContent";

type Props = { open: boolean; onClose: () => void };

export function MobileDrawer({ open, onClose }: Props) {
  const { secondaryNav, secondaryNavVariant } = useAppShell();
  const isViolet = secondaryNavVariant === "violet";
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 200);
      return () => clearTimeout(t);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-50 flex" dir="ltr">
      {/* Sliding panels — slides in from LEFT */}
      <div
        className={classNames(
          "flex transition-transform duration-200 ease-out",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Primary panel */}
        <div className="flex w-14 flex-col items-center border-r border-white/10 bg-slate-950/92 py-4 backdrop-blur-xl light:border-slate-200 light:bg-white/95">
          <PrimaryNavContent />
        </div>

        {/* Secondary panel */}
        {secondaryNav ? (
          <div className="flex w-56 flex-col border-r border-white/10 bg-slate-950/88 backdrop-blur-xl light:border-slate-200 light:bg-white/92">
            <div className="flex items-center justify-end border-b border-white/10 px-3 py-3 light:border-slate-200">
              <button
                aria-label="بستن منو"
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-slate-400 transition hover:border-white/10 hover:bg-white/8 hover:text-white light:text-slate-500 light:hover:text-slate-900"
                onClick={onClose}
                type="button"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-2">
              {secondaryNav.map((item) => {
                const Icon = item.icon;

                return (
                  <button
                    className={classNames(
                      "flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition",
                      item.isActive
                        ? isViolet
                          ? "border-violet-300/30 bg-violet-400/15 text-violet-100 light:text-violet-800"
                          : "border-brand-300/30 bg-brand-400/15 text-brand-100 light:text-brand-800"
                        : item.disabled
                          ? "cursor-not-allowed border-transparent text-slate-500 opacity-65 light:text-slate-400"
                          : isViolet
                            ? "border-transparent text-slate-400 hover:border-violet-300/30 hover:bg-violet-400/10 hover:text-violet-100 light:text-slate-600 light:hover:text-violet-800"
                            : "border-transparent text-slate-400 hover:border-brand-300/30 hover:bg-brand-400/10 hover:text-brand-100 light:text-slate-600 light:hover:text-brand-800"
                    )}
                    disabled={item.disabled}
                    key={item.id}
                    onClick={() => {
                      item.onClick?.();
                      onClose();
                    }}
                    title={item.disabled ? "در نسخه‌های بعدی فعال می‌شود" : item.label}
                    type="button"
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        ) : null}
      </div>

      {/* Backdrop */}
      <div
        className="flex-1 bg-slate-950/60 backdrop-blur-sm"
        onClick={onClose}
      />
    </div>
  );
}
