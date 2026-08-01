/** Focus helpers for form navigation and restoration. */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])"
].join(",");

export function isElementVisible(element: HTMLElement): boolean {
  if (element.hidden) return false;
  if (element.getAttribute("aria-hidden") === "true") return false;
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden") return false;
  const rect = element.getBoundingClientRect();
  return rect.width > 0 || rect.height > 0;
}

export function getFocusableElements(container: ParentNode = document): HTMLElement[] {
  const nodes = Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
  return nodes.filter((el) => isElementVisible(el) && !el.hasAttribute("data-skip-focus"));
}

export function focusElement(element: HTMLElement | null | undefined): void {
  if (!element) return;
  element.focus({ preventScroll: false });
}

/**
 * Move focus to the next/previous enabled editable field inside a registered data-entry form.
 * Skips buttons, textareas (unless includeTextarea), and hidden controls.
 */
export function focusAdjacentFormField(
  current: HTMLElement,
  direction: "next" | "previous",
  options?: { includeTextarea?: boolean; fallthroughToAction?: boolean }
): boolean {
  const form = current.closest("form") ?? current.closest("[data-data-entry-form]");
  if (!form) return false;
  const fields = getFocusableElements(form).filter((el) => {
    if (el.tagName === "BUTTON") {
      return Boolean(options?.fallthroughToAction) && el.getAttribute("type") !== "button"
        ? true
        : el.getAttribute("data-primary-action") === "true";
    }
    if (el.tagName === "TEXTAREA" && !options?.includeTextarea) return false;
    if (el.getAttribute("role") === "listbox") return false;
    return true;
  });

  const index = fields.indexOf(current);
  if (index < 0) return false;
  const nextIndex = direction === "next" ? index + 1 : index - 1;
  const target = fields[nextIndex];
  if (!target) {
    if (direction === "next" && options?.fallthroughToAction) {
      const action = form.querySelector<HTMLElement>("[data-primary-action='true']");
      if (action && isElementVisible(action)) {
        focusElement(action);
        return true;
      }
    }
    return false;
  }
  focusElement(target);
  return true;
}

export function restoreFocus(target: HTMLElement | null | undefined): void {
  if (!target || !isElementVisible(target)) return;
  requestAnimationFrame(() => focusElement(target));
}
