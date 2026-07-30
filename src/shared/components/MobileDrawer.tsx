import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { useAppShell } from "../../app/appShellContext";
import { classNames } from "../utils/classNames";
import { PrimaryNavContent } from "./PrimaryNavContent";

type Props = { open: boolean; onClose: () => void };

export function MobileDrawer({ open, onClose }: Props) {
  const { secondaryNav } = useAppShell();
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
    <div className="fixed inset-0 z-50 flex" data-testid="mobile-nav-drawer" dir="ltr">
      <div
        className={classNames(
          "flex max-w-[92vw] transition-transform duration-200 ease-out",
          visible ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex w-64 flex-col border-r border-ui-border-subtle bg-ui-surface px-3 py-4 shadow-ui">
          <div className="mb-2 flex items-center justify-end">
            <button
              aria-label="بستن منو"
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
              onClick={onClose}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <PrimaryNavContent onNavigate={onClose} variant="drawer" />
        </div>

        {secondaryNav ? (
          <div className="flex w-56 flex-col border-r border-ui-border-subtle bg-ui-surface-subtle">
            <div className="flex items-center justify-end border-b border-ui-border-subtle px-3 py-3">
              <button
                aria-label="بستن منوی فرعی"
                className="flex h-11 w-11 items-center justify-center rounded-lg border border-transparent text-ui-text-muted transition hover:border-ui-border-subtle hover:bg-ui-surface-hover hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
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
                      "flex h-11 w-full items-center gap-3 rounded-lg border px-3 text-right text-sm font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
                      item.isActive
                        ? "border-ui-primary/30 bg-ui-primary-soft text-ui-primary"
                        : item.disabled
                          ? "cursor-not-allowed border-transparent text-ui-text-muted opacity-65"
                          : "border-transparent text-ui-text-muted hover:border-ui-primary/30 hover:bg-ui-primary-soft hover:text-ui-primary"
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

      <div className="flex-1 bg-ui-overlay backdrop-blur-sm" onClick={onClose} />
    </div>
  );
}
