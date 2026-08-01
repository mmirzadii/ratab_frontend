import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode
} from "react";

import {
  selectShortcutToRun,
  type RegisteredShortcut,
  type ShortcutDefinition,
  type ShortcutScope
} from "./shortcutRegistry";
import { ShortcutHelpModal } from "./ShortcutHelpModal";

type ShortcutContextValue = {
  register: (definition: ShortcutDefinition) => () => void;
  registerSaveAction: (action: (() => void) | null) => () => void;
  registerSearchTarget: (element: HTMLElement | null) => () => void;
  registerEscapeLayer: (close: () => void, options?: { id?: string }) => () => void;
  openHelp: () => void;
  closeHelp: () => void;
  helpOpen: boolean;
  listShortcuts: () => RegisteredShortcut[];
};

const ShortcutContext = createContext<ShortcutContextValue | null>(null);

let nextOrder = 1;

export function ShortcutProvider({ children }: { children: ReactNode }) {
  const shortcutsRef = useRef<Map<string, RegisteredShortcut>>(new Map());
  const saveActionRef = useRef<(() => void) | null>(null);
  const searchTargetRef = useRef<HTMLElement | null>(null);
  const escapeStackRef = useRef<Array<{ id: string; close: () => void }>>([]);
  const [, bump] = useState(0);
  const [helpOpen, setHelpOpen] = useState(false);

  const listShortcuts = useCallback(() => Array.from(shortcutsRef.current.values()), []);

  const register = useCallback((definition: ShortcutDefinition) => {
    const registered: RegisteredShortcut = { ...definition, order: nextOrder++ };
    shortcutsRef.current.set(definition.id, registered);
    bump((n) => n + 1);
    return () => {
      shortcutsRef.current.delete(definition.id);
      bump((n) => n + 1);
    };
  }, []);

  const registerSaveAction = useCallback((action: (() => void) | null) => {
    saveActionRef.current = action;
    return () => {
      if (saveActionRef.current === action) saveActionRef.current = null;
    };
  }, []);

  const registerSearchTarget = useCallback((element: HTMLElement | null) => {
    searchTargetRef.current = element;
    return () => {
      if (searchTargetRef.current === element) searchTargetRef.current = null;
    };
  }, []);

  const registerEscapeLayer = useCallback((close: () => void, options?: { id?: string }) => {
    const id = options?.id ?? `escape-${nextOrder++}`;
    escapeStackRef.current.push({ id, close });
    return () => {
      escapeStackRef.current = escapeStackRef.current.filter((layer) => layer.id !== id);
    };
  }, []);

  const openHelp = useCallback(() => setHelpOpen(true), []);
  const closeHelp = useCallback(() => setHelpOpen(false), []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;

      if (event.key === "Escape" && !event.ctrlKey && !event.metaKey && !event.altKey) {
        const top = escapeStackRef.current[escapeStackRef.current.length - 1];
        if (top) {
          event.preventDefault();
          top.close();
          return;
        }
        if (helpOpen) {
          event.preventDefault();
          setHelpOpen(false);
          return;
        }
      }

      const selected = selectShortcutToRun(event, Array.from(shortcutsRef.current.values()));
      if (!selected) return;
      if (selected.preventDefault !== false) event.preventDefault();
      selected.run(event);
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [helpOpen]);

  // Built-in global shortcuts
  useEffect(() => {
    const unsubs = [
      register({
        id: "global.save",
        key: "s",
        ctrlOrMeta: true,
        scope: "global",
        titleFa: "ذخیره",
        descriptionFa: "ذخیره فرم فعال در صورت وجود",
        allowInEditable: true,
        preventDefault: true,
        enabled: () => saveActionRef.current != null,
        run: () => {
          saveActionRef.current?.();
        }
      }),
      register({
        id: "global.search",
        key: "k",
        ctrlOrMeta: true,
        scope: "global",
        titleFa: "جستجو",
        descriptionFa: "تمرکز روی فیلد جستجوی اصلی",
        allowInEditable: true,
        preventDefault: true,
        enabled: () => searchTargetRef.current != null,
        run: () => {
          const target = searchTargetRef.current;
          if (!target) return;
          target.focus();
          if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
            target.select();
          }
        }
      }),
      register({
        id: "global.help",
        key: "/",
        ctrlOrMeta: true,
        scope: "global",
        titleFa: "راهنمای میانبرها",
        descriptionFa: "نمایش میانبرهای فعال",
        allowInEditable: true,
        preventDefault: true,
        run: () => setHelpOpen(true)
      })
    ];
    return () => unsubs.forEach((u) => u());
  }, [register]);

  useEffect(() => {
    if (!helpOpen) return;
    return registerEscapeLayer(() => setHelpOpen(false), { id: "shortcut-help" });
  }, [helpOpen, registerEscapeLayer]);

  const value = useMemo<ShortcutContextValue>(
    () => ({
      register,
      registerSaveAction,
      registerSearchTarget,
      registerEscapeLayer,
      openHelp,
      closeHelp,
      helpOpen,
      listShortcuts
    }),
    [
      register,
      registerSaveAction,
      registerSearchTarget,
      registerEscapeLayer,
      openHelp,
      closeHelp,
      helpOpen,
      listShortcuts
    ]
  );

  return (
    <ShortcutContext.Provider value={value}>
      {children}
      {helpOpen ? (
        <ShortcutHelpModal onClose={closeHelp} shortcuts={listShortcuts()} />
      ) : null}
    </ShortcutContext.Provider>
  );
}

export function useShortcutContext(): ShortcutContextValue {
  const ctx = useContext(ShortcutContext);
  if (!ctx) {
    throw new Error("useShortcutContext must be used within ShortcutProvider");
  }
  return ctx;
}

/** Register a shortcut for the lifetime of the calling component. */
export function useShortcut(definition: ShortcutDefinition | null): void {
  const { register } = useShortcutContext();
  useEffect(() => {
    if (!definition) return;
    return register(definition);
  }, [register, definition]);
}

export function useRegisterSaveAction(action: (() => void) | null, enabled = true): void {
  const { registerSaveAction } = useShortcutContext();
  useEffect(() => {
    if (!enabled || !action) return;
    return registerSaveAction(action);
  }, [registerSaveAction, action, enabled]);
}

export function useRegisterSearchTarget(element: HTMLElement | null): void {
  const { registerSearchTarget } = useShortcutContext();
  useEffect(() => registerSearchTarget(element), [registerSearchTarget, element]);
}

export function useEscapeLayer(close: () => void, enabled = true, id?: string): void {
  const { registerEscapeLayer } = useShortcutContext();
  useEffect(() => {
    if (!enabled) return;
    return registerEscapeLayer(close, id ? { id } : undefined);
  }, [registerEscapeLayer, close, enabled, id]);
}

export type { ShortcutDefinition, ShortcutScope, RegisteredShortcut };
