/** Shared keyboard shortcut types and matching helpers. */

export type ShortcutScope =
  | "global"
  | "chat"
  | "form"
  | "modal"
  | "cost-report"
  | "group-drawer";

export type ShortcutDefinition = {
  id: string;
  /** Lowercase key from KeyboardEvent.key (e.g. "s", "/", "Escape", "Enter", "k"). */
  key: string;
  titleFa: string;
  descriptionFa?: string;
  scope: ShortcutScope;
  ctrlOrMeta?: boolean;
  shift?: boolean;
  alt?: boolean;
  /** When false, ignore while focus is in input/textarea/contenteditable. Default false for most globals. */
  allowInEditable?: boolean;
  preventDefault?: boolean;
  enabled?: () => boolean;
  run: (event: KeyboardEvent) => void;
};

export type RegisteredShortcut = ShortcutDefinition & {
  order: number;
};

const SCOPE_PRIORITY: Record<ShortcutScope, number> = {
  modal: 100,
  "group-drawer": 80,
  "cost-report": 70,
  form: 60,
  chat: 50,
  global: 10
};

export function isEditableTarget(target: EventTarget | null): boolean {
  if (typeof HTMLElement === "undefined") return false;
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (target.isContentEditable) return true;
  return Boolean(target.closest("[contenteditable='true']"));
}

export function isComposingEvent(event: KeyboardEvent): boolean {
  return Boolean(event.isComposing || (event as KeyboardEvent & { keyCode?: number }).keyCode === 229);
}

export function isMacPlatform(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export function primaryModifierPressed(event: {
  ctrlKey: boolean;
  metaKey: boolean;
}): boolean {
  return isMacPlatform() ? event.metaKey : event.ctrlKey;
}

export function formatShortcutChord(def: Pick<ShortcutDefinition, "key" | "ctrlOrMeta" | "shift" | "alt">): string {
  const parts: string[] = [];
  if (def.ctrlOrMeta) parts.push(isMacPlatform() ? "⌘" : "Ctrl");
  if (def.alt) parts.push(isMacPlatform() ? "⌥" : "Alt");
  if (def.shift) parts.push(isMacPlatform() ? "⇧" : "Shift");
  const keyLabel =
    def.key === " " ? "Space" : def.key === "/" ? "/" : def.key.length === 1 ? def.key.toUpperCase() : def.key;
  parts.push(keyLabel);
  return parts.join(isMacPlatform() ? "" : "+");
}

export function eventMatchesShortcut(event: KeyboardEvent, def: ShortcutDefinition): boolean {
  if (isComposingEvent(event)) return false;
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
  const expected = def.key.length === 1 ? def.key.toLowerCase() : def.key;
  if (key !== expected) return false;

  if (def.ctrlOrMeta) {
    if (!primaryModifierPressed(event)) return false;
    // Do not require the other OS modifier to be free when using platform primary.
  } else if (event.ctrlKey || event.metaKey) {
    return false;
  }

  if (Boolean(def.shift) !== event.shiftKey) return false;
  if (Boolean(def.alt) !== event.altKey) return false;
  return true;
}

export function compareShortcutPriority(a: RegisteredShortcut, b: RegisteredShortcut): number {
  const scopeDiff = SCOPE_PRIORITY[b.scope] - SCOPE_PRIORITY[a.scope];
  if (scopeDiff !== 0) return scopeDiff;
  return b.order - a.order;
}

export function selectShortcutToRun(
  event: KeyboardEvent,
  shortcuts: readonly RegisteredShortcut[]
): RegisteredShortcut | null {
  const editable = isEditableTarget(event.target);
  const candidates = shortcuts
    .filter((item) => {
      if (item.enabled && !item.enabled()) return false;
      if (!eventMatchesShortcut(event, item)) return false;
      if (editable && !item.allowInEditable) return false;
      return true;
    })
    .sort(compareShortcutPriority);
  return candidates[0] ?? null;
}
