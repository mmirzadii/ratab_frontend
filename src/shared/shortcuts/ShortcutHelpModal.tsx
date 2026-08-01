import { X } from "lucide-react";
import { useEffect, useMemo, useRef } from "react";

import { classNames } from "../utils/classNames";
import {
  formatShortcutChord,
  type RegisteredShortcut,
  type ShortcutScope
} from "./shortcutRegistry";

const SCOPE_LABELS: Record<ShortcutScope, string> = {
  global: "سراسری",
  chat: "گفتگو",
  form: "فرم",
  modal: "پنجره",
  "cost-report": "صورت‌بها",
  "group-drawer": "اطلاعات گروه"
};

const SCOPE_ORDER: ShortcutScope[] = [
  "global",
  "chat",
  "form",
  "modal",
  "cost-report",
  "group-drawer"
];

type ShortcutHelpModalProps = {
  shortcuts: RegisteredShortcut[];
  onClose: () => void;
};

export function ShortcutHelpModal({ shortcuts, onClose }: ShortcutHelpModalProps) {
  const closeRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const groups = useMemo(() => {
    const map = new Map<ShortcutScope, RegisteredShortcut[]>();
    for (const item of shortcuts) {
      if (item.enabled && !item.enabled()) continue;
      const list = map.get(item.scope) ?? [];
      list.push(item);
      map.set(item.scope, list);
    }
    return SCOPE_ORDER.filter((scope) => (map.get(scope)?.length ?? 0) > 0).map((scope) => ({
      scope,
      items: map.get(scope) ?? []
    }));
  }, [shortcuts]);

  return (
    <div
      aria-labelledby="shortcut-help-title"
      aria-modal="true"
      className="fixed inset-0 z-[150] flex items-end justify-center bg-black/45 p-3 sm:items-center"
      role="dialog"
    >
      <button
        aria-label="بستن پس‌زمینه"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <div className="relative z-10 flex max-h-[min(32rem,85dvh)] w-full max-w-md flex-col overflow-hidden rounded-2xl border border-ui-border-subtle bg-ui-surface shadow-ui">
        <header className="flex items-center gap-2 border-b border-ui-border-subtle px-4 py-3">
          <h2 className="min-w-0 flex-1 text-base font-black text-ui-text-primary" id="shortcut-help-title">
            میانبرهای صفحه‌کلید
          </h2>
          <button
            aria-label="بستن"
            className="flex h-9 w-9 items-center justify-center rounded-xl text-ui-text-secondary transition hover:bg-ui-surface-subtle hover:text-ui-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
            onClick={onClose}
            ref={closeRef}
            type="button"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3 [scrollbar-width:thin]">
          {groups.length === 0 ? (
            <p className="text-sm text-ui-text-muted">میانبر فعالی در این صفحه نیست.</p>
          ) : (
            groups.map((group) => (
              <section key={group.scope}>
                <h3 className="mb-2 text-xs font-black text-ui-text-muted">{SCOPE_LABELS[group.scope]}</h3>
                <ul className="space-y-1.5">
                  {group.items.map((item) => (
                    <li
                      className="flex items-start justify-between gap-3 rounded-xl bg-ui-surface-subtle px-3 py-2"
                      key={item.id}
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-ui-text-primary">{item.titleFa}</p>
                        {item.descriptionFa ? (
                          <p className="mt-0.5 text-[11px] text-ui-text-muted">{item.descriptionFa}</p>
                        ) : null}
                      </div>
                      <kbd
                        className={classNames(
                          "shrink-0 rounded-md border border-ui-border-subtle bg-ui-surface px-2 py-1 font-mono text-[11px] font-bold text-ui-text-secondary"
                        )}
                        dir="ltr"
                      >
                        {formatShortcutChord(item)}
                      </kbd>
                    </li>
                  ))}
                </ul>
              </section>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
