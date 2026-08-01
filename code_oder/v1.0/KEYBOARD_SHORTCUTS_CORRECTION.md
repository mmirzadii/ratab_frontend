# Keyboard shortcuts & mobile math hint (frontend-only)

Last updated: 2026-08-01

## Summary

Centralized keyboard shortcuts, predictable form focus navigation, and a mobile/desktop split for math-expression result actions (`Tab` vs compact `محاسبه`).

## Global shortcuts

| Chord | Action |
| --- | --- |
| `Ctrl/⌘ + S` | Save the registered active form (only when a save action is registered and enabled) |
| `Ctrl/⌘ + K` | Focus the primary search field in the current context |
| `Ctrl/⌘ + /` | Open the shortcut-help modal |
| `Escape` | Close the topmost registered layer (menus, modals, help) |

Platform helper uses `Ctrl` on Windows/Linux and `Command` on macOS.

## Scopes

`modal` > `group-drawer` > `cost-report` > `form` > `chat` > `global`

Only the highest-priority matching shortcut runs. IME composition blocks shortcuts. Editable targets only receive shortcuts marked `allowInEditable`.

## Form navigation

- Native `Tab` / `Shift+Tab` remain authoritative.
- Registered data-entry forms (`data-data-entry-form`) may use Enter to convert a math expression then move to the next field.
- Enter-to-next does not apply to textarea, composer, open listboxes, or confirmation buttons.

## Math result action

Shared component: `MathExpressionResultAction`

- Desktop: `= 81` + `Tab` keycap (`برای محاسبه Tab را فشار دهید`)
- Mobile / coarse pointer: `= 81` + compact `محاسبه` (`محاسبه عبارت`)
- Visible label ~10–11px; touch target ≥44px via padding
- `onPointerDown` applies without stealing caret/focus prematurely
- Same apply path as Tab for financial fields and composer

## Modules

- `src/shared/shortcuts/shortcutRegistry.ts`
- `src/shared/shortcuts/useShortcut.ts` (`ShortcutProvider`)
- `src/shared/shortcuts/ShortcutHelpModal.tsx`
- `src/shared/focus/focusNavigation.ts`
- `src/shared/hooks/useMediaQuery.ts`
- `src/shared/math/MathExpressionResultAction.tsx`

## Tests

- `npm run test:shortcuts`
- `npm run test:math-expression`
- `npm run test:composer-textarea`
