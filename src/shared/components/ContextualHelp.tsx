import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState
} from "react";
import { HelpCircle } from "lucide-react";

import { useCoarsePointer } from "../hooks/useMediaQuery";
import { classNames } from "../utils/classNames";

type ContextualHelpProps = {
  /** Short Persian help (1–2 sentences). */
  text: string;
  /** Accessible name for the trigger. */
  label?: string;
  className?: string;
};

/**
 * Shared field/section help: hover+focus on desktop, tap toggletip on mobile.
 * Plain text only — use a dedicated popover if content needs actions/links.
 */
export function ContextualHelp({
  text,
  label = "راهنما",
  className
}: ContextualHelpProps) {
  const isCoarse = useCoarsePointer();
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const rootRef = useRef<HTMLSpanElement | null>(null);
  const panelId = useId();

  const clearCloseTimer = useCallback(() => {
    if (closeTimer.current != null) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setOpen(false), 160);
  }, [clearCloseTimer]);

  useEffect(() => () => clearCloseTimer(), [clearCloseTimer]);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    function onPointerDown(event: MouseEvent | TouchEvent) {
      const target = event.target as Node | null;
      if (target && rootRef.current && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
    };
  }, [open]);

  function openNow() {
    clearCloseTimer();
    setOpen(true);
  }

  return (
    <span className={classNames("relative inline-flex shrink-0", className)} ref={rootRef}>
      <button
        aria-controls={open ? panelId : undefined}
        aria-expanded={open}
        aria-label={label}
        className={classNames(
          "inline-flex h-7 w-7 items-center justify-center rounded-full text-ui-text-muted transition",
          "hover:bg-ui-surface-subtle hover:text-ui-text-secondary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus"
        )}
        data-testid="contextual-help-trigger"
        onBlur={() => {
          if (!isCoarse) scheduleClose();
        }}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          if (isCoarse) setOpen((value) => !value);
        }}
        onFocus={() => {
          if (!isCoarse) openNow();
        }}
        onMouseEnter={() => {
          if (!isCoarse) openNow();
        }}
        onMouseLeave={() => {
          if (!isCoarse) scheduleClose();
        }}
        type="button"
      >
        <HelpCircle aria-hidden className="h-3.5 w-3.5" strokeWidth={2.25} />
      </button>
      {open ? (
        <span
          className="absolute bottom-[calc(100%+0.35rem)] left-1/2 z-50 w-56 max-w-[min(14rem,calc(100vw-2rem))] -translate-x-1/2 rounded-xl border border-ui-border-default bg-ui-surface-elevated px-3 py-2 text-right text-[12px] leading-5 text-ui-text-secondary shadow-ui sm:left-auto sm:right-0 sm:translate-x-0"
          data-testid="contextual-help-panel"
          id={panelId}
          onMouseEnter={() => {
            if (!isCoarse) openNow();
          }}
          onMouseLeave={() => {
            if (!isCoarse) scheduleClose();
          }}
          role="tooltip"
        >
          {text}
        </span>
      ) : null}
    </span>
  );
}
