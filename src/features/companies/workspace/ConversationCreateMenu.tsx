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
          "flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-300/30 bg-emerald-400/15 text-emerald-100 transition hover:bg-emerald-400/25 disabled:cursor-not-allowed disabled:opacity-45 light:border-emerald-200 light:bg-emerald-50 light:text-emerald-800"
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
          className="absolute left-0 top-11 z-30 w-52 overflow-hidden rounded-xl border border-white/10 bg-slate-950 py-1 shadow-2xl light:border-slate-200 light:bg-white"
          role="menu"
        >
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-slate-100 transition hover:bg-emerald-400/10 light:text-slate-900 light:hover:bg-emerald-50"
            data-tour="create-project-action"
            onClick={() => {
              setOpen(false);
              onCreateProject();
            }}
            role="menuitem"
            type="button"
          >
            <FolderKanban className="h-4 w-4 text-emerald-300 light:text-emerald-700" />
            پروژه جدید
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-right text-sm font-bold text-slate-100 transition hover:bg-violet-400/10 light:text-slate-900 light:hover:bg-violet-50"
            data-tour="create-group-action"
            onClick={() => {
              setOpen(false);
              onCreateGroup();
            }}
            role="menuitem"
            type="button"
          >
            <Network className="h-4 w-4 text-violet-300 light:text-violet-700" />
            گروه جدید
          </button>
        </div>
      ) : null}
    </div>
  );
}
