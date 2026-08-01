import {
  type ChangeEvent,
  type FocusEvent,
  type InputHTMLAttributes,
  type KeyboardEvent,
  forwardRef,
  useMemo
} from "react";

import { focusAdjacentFormField } from "../focus/focusNavigation";
import { evaluateMathExpression, getMathExpressionPreview } from "./mathExpression.ts";
import { MathExpressionResultAction } from "./MathExpressionResultAction";
import { normalizeNumberInput } from "../utils/numberText";

type MathNumericInputProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
> & {
  value: string;
  onChange: (value: string) => void;
  wrapperClassName?: string;
  /** When true, Enter converts a valid expression then moves to the next field. */
  enterAdvances?: boolean;
};

function resolveFinancialFieldValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return "";

  const evaluated = evaluateMathExpression(raw);
  if (evaluated.ok) {
    return evaluated.formatted;
  }

  const plain = normalizeNumberInput(raw).replace(/[٬,]/g, "").replace(/٫/g, ".");
  if (/^-?\d+(\.\d+)?$/.test(plain)) {
    return plain === "-0" ? "0" : plain;
  }

  return null;
}

/**
 * Financial decimal input with live math preview.
 * Desktop: Tab converts then advances focus. Mobile: «محاسبه» applies without advancing.
 * Blur still resolves or rejects invalid values.
 */
export const MathNumericInput = forwardRef<HTMLInputElement, MathNumericInputProps>(
  function MathNumericInput(
    {
      value,
      onChange,
      onBlur,
      onKeyDown,
      wrapperClassName,
      className,
      enterAdvances = false,
      ...rest
    },
    ref
  ) {
    const preview = useMemo(() => getMathExpressionPreview(value), [value]);

    function applyPreview(options?: { advance?: boolean }) {
      if (!preview) return;
      onChange(preview);
      if (options?.advance) {
        requestAnimationFrame(() => {
          const el =
            typeof ref === "function"
              ? null
              : (ref?.current ?? null);
          // Prefer the currently focused element when available.
          const current = (document.activeElement as HTMLElement | null) ?? el;
          if (current) {
            focusAdjacentFormField(current, "next", { fallthroughToAction: true });
          }
        });
      }
    }

    function handleChange(event: ChangeEvent<HTMLInputElement>) {
      onChange(event.target.value);
    }

    function handleBlur(event: FocusEvent<HTMLInputElement>) {
      const resolved = resolveFinancialFieldValue(value);
      if (resolved === null) {
        if (value.trim() !== "") onChange("");
      } else if (resolved !== value) {
        onChange(resolved);
      }
      onBlur?.(event);
    }

    function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
      onKeyDown?.(event);
      if (event.defaultPrevented || event.nativeEvent.isComposing) return;

      if (event.key === "Tab" && !event.shiftKey && preview) {
        // Replace then allow native focus advance.
        onChange(preview);
        return;
      }

      if (
        enterAdvances &&
        event.key === "Enter" &&
        !event.shiftKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        event.preventDefault();
        if (preview) {
          applyPreview({ advance: true });
          return;
        }
        focusAdjacentFormField(event.currentTarget, "next", { fallthroughToAction: true });
      }
    }

    return (
      <div className={wrapperClassName ?? "min-w-0"}>
        <input
          {...rest}
          className={className}
          dir={rest.dir ?? "ltr"}
          inputMode={rest.inputMode ?? "decimal"}
          onBlur={handleBlur}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          ref={ref}
          type="text"
          value={value}
        />
        {preview ? (
          <MathExpressionResultAction
            className="mt-1"
            mode="financial-field"
            onApply={() => applyPreview({ advance: false })}
            result={preview}
          />
        ) : null}
      </div>
    );
  }
);
