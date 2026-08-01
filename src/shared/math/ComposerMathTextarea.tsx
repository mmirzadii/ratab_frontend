import {
  type CSSProperties,
  type KeyboardEvent,
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState
} from "react";

import {
  findExpressionBeforeCaret,
  replaceExpressionBeforeCaret,
  type ExpressionBeforeCaret
} from "./findExpressionBeforeCaret.ts";
import { MathExpressionResultAction } from "./MathExpressionResultAction";

const MIRROR_BASE_CLASS =
  "pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words text-sm leading-6";

type ComposerMathTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  className: string;
  disabled?: boolean;
  placeholder?: string;
  "aria-label"?: string;
  onInputResize?: (element: HTMLTextAreaElement) => void;
  onKeyDown?: (event: KeyboardEvent<HTMLTextAreaElement>) => void;
  /** Clears when the conversation context changes. */
  detectionKey?: string | number | null;
};

function splitHighlighted(
  text: string,
  match: ExpressionBeforeCaret | null
): { before: string; expr: string; after: string } {
  if (!match) {
    return { before: text, expr: "", after: "" };
  }
  return {
    before: text.slice(0, match.start),
    expr: text.slice(match.start, match.end),
    after: text.slice(match.end)
  };
}

/**
 * Controlled composer textarea with math-expression highlight overlay and Tab replace.
 */
export function ComposerMathTextarea({
  value,
  onChange,
  textareaRef,
  className,
  disabled,
  placeholder,
  "aria-label": ariaLabel,
  onInputResize,
  onKeyDown,
  detectionKey
}: ComposerMathTextareaProps) {
  const [caret, setCaret] = useState(0);
  const [selectionEnd, setSelectionEnd] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    setCaret(0);
    setSelectionEnd(0);
  }, [detectionKey]);

  const syncCaretFromElement = useCallback((element: HTMLTextAreaElement | null) => {
    if (!element) return;
    setCaret(element.selectionStart ?? 0);
    setSelectionEnd(element.selectionEnd ?? 0);
    setScrollTop(element.scrollTop);
    setScrollLeft(element.scrollLeft);
  }, []);

  const match = useMemo(
    () =>
      findExpressionBeforeCaret(value, caret, {
        selectionStart: caret,
        selectionEnd
      }),
    [value, caret, selectionEnd]
  );

  const parts = useMemo(() => splitHighlighted(value, match), [value, match]);

  useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    onInputResize?.(element);
  }, [value, match, onInputResize, textareaRef]);

  function applyMatch(current: ExpressionBeforeCaret) {
    const element = textareaRef.current;
    const next = replaceExpressionBeforeCaret(value, current);
    onChange(next.text);
    requestAnimationFrame(() => {
      const el = element ?? textareaRef.current;
      if (!el) return;
      el.focus();
      el.setSelectionRange(next.caret, next.caret);
      syncCaretFromElement(el);
      onInputResize?.(el);
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    onKeyDown?.(event);
    if (event.defaultPrevented) return;
    if (event.key === "Tab" && !event.shiftKey) {
      if (event.nativeEvent.isComposing) {
        event.preventDefault();
        return;
      }
      event.preventDefault();
      if (match) {
        applyMatch(match);
      }
      // No expression: keep focus and text unchanged (intentional).
      return;
    }
  }

  const mirrorStyle: CSSProperties = {
    transform: `translate(${-scrollLeft}px, ${-scrollTop}px)`
  };

  return (
    <div className="relative min-w-0 flex-1 self-center">
      <div className="relative min-h-11 w-full">
        <div
          aria-hidden
          className={`${MIRROR_BASE_CLASS} rounded-xl bg-ui-surface-subtle px-3 py-2.5 text-transparent`}
          data-testid="composer-math-mirror"
          style={mirrorStyle}
        >
          <span>{parts.before}</span>
          {parts.expr ? (
            <span
              className="rounded-sm bg-ui-primary/25 text-transparent"
              data-testid="composer-math-highlight"
            >
              {parts.expr}
            </span>
          ) : null}
          <span>{parts.after}</span>
        </div>
        <textarea
          aria-label={ariaLabel}
          className={`${className} relative z-10 bg-transparent caret-ui-text-primary ${
            match ? "pb-10" : ""
          }`}
          disabled={disabled}
          onBlur={() => syncCaretFromElement(textareaRef.current)}
          onChange={(event) => {
            onChange(event.target.value);
            syncCaretFromElement(event.currentTarget);
            onInputResize?.(event.currentTarget);
          }}
          onClick={(event) => syncCaretFromElement(event.currentTarget)}
          onKeyDown={handleKeyDown}
          onKeyUp={(event) => syncCaretFromElement(event.currentTarget)}
          onScroll={(event) => {
            setScrollTop(event.currentTarget.scrollTop);
            setScrollLeft(event.currentTarget.scrollLeft);
          }}
          onSelect={(event) => syncCaretFromElement(event.currentTarget)}
          placeholder={placeholder}
          ref={textareaRef}
          rows={1}
          value={value}
        />
        {match ? (
          <MathExpressionResultAction
            className="absolute bottom-1.5 left-1.5 z-20"
            mode="composer"
            onApply={() => applyMatch(match)}
            result={match.result}
          />
        ) : null}
      </div>
    </div>
  );
}
