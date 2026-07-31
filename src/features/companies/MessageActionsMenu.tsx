import { useEffect, useLayoutEffect, useRef } from "react";
import { Forward, Pencil, Trash2 } from "lucide-react";

import { classNames } from "../../shared/utils/classNames";
import { clampMenuPosition, type MenuPoint } from "./messageMenuPosition";

export type MessageActionId = "edit" | "delete" | "forward";

export type MessageActionsMenuProps = {
  anchor: MenuPoint;
  canEdit: boolean;
  canDelete: boolean;
  canForward: boolean;
  onAction: (action: MessageActionId) => void;
  onClose: () => void;
};

export function MessageActionsMenu({
  anchor,
  canEdit,
  canDelete,
  canForward,
  onAction,
  onClose
}: MessageActionsMenuProps) {
  const menuRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = menuRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const clamped = clampMenuPosition(anchor, {
      width: rect.width,
      height: rect.height
    });
    el.style.left = `${clamped.x}px`;
    el.style.top = `${clamped.y}px`;
  }, [anchor]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && menuRef.current && !menuRef.current.contains(target)) {
        onClose();
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown, { passive: true });
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose]);

  const items = (
    [
      { id: "edit" as const, label: "ویرایش", icon: Pencil, enabled: canEdit },
      {
        id: "delete" as const,
        label: "حذف",
        icon: Trash2,
        enabled: canDelete,
        danger: true
      },
      { id: "forward" as const, label: "بازارسال", icon: Forward, enabled: canForward }
    ] as const
  ).filter((item) => item.enabled);

  if (items.length === 0) {
    return null;
  }

  return (
    <div
      aria-label="عملیات پیام"
      className="fixed z-[140] min-w-[10.5rem] overflow-hidden rounded-xl border border-ui-border-subtle bg-ui-surface py-1 shadow-xl backdrop-blur-md"
      data-testid="message-actions-menu"
      ref={menuRef}
      role="menu"
      style={{ left: anchor.x, top: anchor.y }}
    >
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <button
            className={classNames(
              "flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold transition hover:bg-ui-surface-subtle",
              "danger" in item && item.danger
                ? "text-rose-300 hover:text-rose-200"
                : "text-ui-text-primary"
            )}
            data-testid={`message-action-${item.id}`}
            key={item.id}
            onClick={() => onAction(item.id)}
            role="menuitem"
            type="button"
          >
            <Icon className="h-4 w-4 shrink-0" />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
