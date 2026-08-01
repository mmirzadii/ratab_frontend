import { type PointerEvent } from "react";

import { MATH_MOBILE_APPLY_LABEL_FA, MATH_TAB_HINT_TITLE_FA } from "./mathConfig.ts";
import { useCoarsePointer } from "../hooks/useMediaQuery";
import { classNames } from "../utils/classNames";

export type MathExpressionResultActionProps = {
  result: string;
  onApply: () => void;
  mode?: "financial-field" | "composer";
  disabled?: boolean;
  className?: string;
  /** Force presentation for tests. */
  forceMobile?: boolean;
};

/**
 * Shared math result chip: desktop shows Tab keycap; mobile shows compact «محاسبه».
 * Uses pointerdown so composer caret is not lost before replacement.
 */
export function MathExpressionResultAction({
  result,
  onApply,
  mode = "financial-field",
  disabled = false,
  className,
  forceMobile
}: MathExpressionResultActionProps) {
  const coarse = useCoarsePointer();
  const isMobile = forceMobile ?? coarse;
  const isComposer = mode === "composer";

  function handlePointerDown(event: PointerEvent<HTMLButtonElement>) {
    if (disabled) return;
    event.preventDefault();
    onApply();
  }

  return (
    <button
      aria-label={isMobile ? MATH_MOBILE_APPLY_LABEL_FA : MATH_TAB_HINT_TITLE_FA}
      className={classNames(
        "inline-flex items-center gap-2 font-bold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ui-focus",
        isComposer
          ? "rounded-lg border border-ui-primary/40 bg-ui-surface shadow-ui hover:bg-ui-primary-soft"
          : "rounded-lg hover:bg-ui-surface-subtle",
        isMobile ? "min-h-11 min-w-11 px-2.5 py-1.5" : "min-h-9 px-2 py-1",
        disabled && "pointer-events-none opacity-45",
        className
      )}
      data-mobile={isMobile ? "true" : "false"}
      data-testid="math-expression-hint"
      disabled={disabled}
      onPointerDown={handlePointerDown}
      title={isMobile ? MATH_MOBILE_APPLY_LABEL_FA : MATH_TAB_HINT_TITLE_FA}
      type="button"
    >
      <span
        className={classNames(
          "font-mono tabular-nums",
          isComposer ? "text-sm font-black text-ui-primary" : "text-[11px] text-ui-text-secondary"
        )}
        dir="ltr"
      >
        = {result}
      </span>
      {isMobile ? (
        <span className="text-[10px] font-bold leading-none text-ui-primary/90 sm:text-[11px]">
          محاسبه
        </span>
      ) : (
        <kbd
          className={classNames(
            "rounded border px-1.5 py-0.5 font-sans text-[10px] font-black",
            isComposer
              ? "border-ui-primary/35 bg-ui-primary-soft text-ui-primary"
              : "border-ui-border-subtle bg-ui-surface-subtle text-ui-text-muted"
          )}
        >
          Tab
        </kbd>
      )}
    </button>
  );
}
