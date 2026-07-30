/** Compact Telegram-like composer textarea height bounds (px). */
export const COMPOSER_TEXTAREA_MIN_HEIGHT_PX = 44;
export const COMPOSER_TEXTAREA_MAX_HEIGHT_PX = 160;
export const COMPOSER_TEXTAREA_MAX_HEIGHT_MOBILE_PX = 140;

export type ComposerTextareaHeightResult = {
  heightPx: number;
  overflowY: "hidden" | "auto";
};

/**
 * Compute next textarea height from measured scrollHeight.
 * Caps growth so the composer stays sticky at the bottom without filling the chat.
 */
export function computeComposerTextareaHeight(
  scrollHeight: number,
  options?: {
    minHeightPx?: number;
    maxHeightPx?: number;
  }
): ComposerTextareaHeightResult {
  const minHeightPx = options?.minHeightPx ?? COMPOSER_TEXTAREA_MIN_HEIGHT_PX;
  const maxHeightPx = options?.maxHeightPx ?? COMPOSER_TEXTAREA_MAX_HEIGHT_PX;
  const measured = Number.isFinite(scrollHeight) ? Math.max(0, scrollHeight) : 0;
  if (measured <= maxHeightPx) {
    return {
      heightPx: Math.max(minHeightPx, measured),
      overflowY: "hidden"
    };
  }
  return {
    heightPx: maxHeightPx,
    overflowY: "auto"
  };
}

export function resolveComposerTextareaMaxHeight(viewportWidth: number): number {
  return viewportWidth < 640
    ? COMPOSER_TEXTAREA_MAX_HEIGHT_MOBILE_PX
    : COMPOSER_TEXTAREA_MAX_HEIGHT_PX;
}

/** Apply scrollHeight-based resize to a live textarea element. */
export function applyComposerTextareaAutoResize(
  element: HTMLTextAreaElement | null,
  viewportWidth: number = typeof window !== "undefined" ? window.innerWidth : 1280
): ComposerTextareaHeightResult | null {
  if (!element) return null;
  const maxHeightPx = resolveComposerTextareaMaxHeight(viewportWidth);
  element.style.height = "auto";
  element.style.overflowY = "hidden";
  const next = computeComposerTextareaHeight(element.scrollHeight, {
    minHeightPx: COMPOSER_TEXTAREA_MIN_HEIGHT_PX,
    maxHeightPx
  });
  element.style.height = `${next.heightPx}px`;
  element.style.overflowY = next.overflowY;
  return next;
}

export function shouldSendOnEnterKey(event: {
  key: string;
  shiftKey: boolean;
  nativeEvent?: { isComposing?: boolean };
  isComposing?: boolean;
}): boolean {
  if (event.key !== "Enter" || event.shiftKey) return false;
  if (event.isComposing || event.nativeEvent?.isComposing) return false;
  return true;
}
