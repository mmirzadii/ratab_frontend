import { useEffect, useRef, useState } from "react";
import { FolderKanban, Network, Plus } from "lucide-react";

import { classNames } from "../../../shared/utils/classNames";

export function ConversationCreateMenu({
  onCreateProject,
  onCreateGroup,
  disabled
}: {
  onCreateProject: () => void;
  onCreateGroup: () => void;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    function handlePointer(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="ایجاد پروژه یا گروه"
        className={classNames(
          "flex h-9 w-9 items-center justify-center rounded-xl border border-ui-primary/30 bg-ui-primary-soft text-ui-primary transition hover:bg-ui-primary-soft disabled:cursor-not-allowed disabled:opacity-45"
        )}
        data-tour="conversation-create-menu"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        type="button"
      >
        <Plus className="h-4 w-4" />
      </button>
      {open ? (
        <div
          className="absolute left-0 top-11 z-30 w-52 overflow-hidden rounded-xl border border-ui-border-subtle bg-ui-surface py-1 shadow-ui"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-ui-text-primary transition hover:bg-ui-primary-soft focus-visible:bg-ui-surface-selected"
            data-tour="create-project-action"
            onClick={() => {
              setOpen(false);
              onCreateProject();
            }}
            role="menuitem"
            type="button"
          >
            <FolderKanban className="h-4 w-4 text-ui-primary" />
            پروژه جدید
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-ui-text-primary transition hover:bg-ui-primary-soft focus-visible:bg-ui-surface-selected"
            data-tour="create-group-action"
            onClick={() => {
              setOpen(false);
              onCreateGroup();
            }}
            role="menuitem"
            type="button"
          >
            <Network className="h-4 w-4 text-ui-primary" />
            ساخت گروه
          </button>
        </div>
      ) : null}
    </div>
  );
}
