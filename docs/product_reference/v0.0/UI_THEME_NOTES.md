# UI Theme Notes — Metril Corporate Blue (v1.0)

Product visual system for Ratab/Metril Frontend v1.0.

## Brand direction

**Metril Corporate Blue** — professional corporate engineering UI:

| Role | Light | Dark |
| --- | --- | --- |
| Primary | `#2563EB` | `#60A5FA` |
| Primary hover | `#1D4ED8` | `#93C5FD` |
| Soft / selected | `#DBEAFE` / `#E8F1FF` | `#102A4C` |
| Engineering navy | `#0B1F33` | — |
| Steel cyan (info accent) | `#0EA5E9` | `#38BDF8` |
| Canvas | `#F5F7FB` | `#08111F` |
| Surface | `#FFFFFF` | `#0D1B2A` |
| Elevated | `#E8EEF6` | `#17263D` |
| Border | `#D8E1EC` | `#24344D` |
| Text | `#0F172A` | `#E8EEF7` |

Green / yellow / red are **semantic state colors only** (success / warning / danger). Do not use emerald, violet, or mint as brand.

## Token ownership

| Layer | Path |
| --- | --- |
| CSS semantic variables | `src/styles/index.css` (`--ui-*`, `--brand-*`) |
| Tailwind aliases | `tailwind.config.ts` → `theme.extend.colors.ui` / `brand` |
| Theme persistence | `src/features/ui/uiSlice.ts` + `usePersistedTheme.ts` |
| FOUC prevention | inline script in `index.html` (`metril.theme` / `ratab.theme`) |
| Shared primitives | `src/shared/components/*` (Button, GlassCard, IconButton, StatusBadge, …) |

Components must consume semantic roles (`bg-ui-surface`, `text-ui-text-primary`, `border-ui-border-subtle`, `bg-ui-primary`, …). Do not hardcode hex/rgb for ordinary layout chrome.

## Surface hierarchy

0. Canvas — page / chat background (`ui-canvas`)
1. Surface — sidebars, list panes, forms (`ui-surface`)
2. Subtle / elevated — dropdowns, input groups, panels (`ui-surface-subtle` / `ui-surface-elevated`)
3. Hover / selected — interaction only (`ui-surface-hover` / `ui-surface-selected`)

Prefer surface difference and subtle borders over bright full-width dividers. No `border-white` layout separators.

## Theme switching

- Attribute: `document.documentElement.dataset.theme` = `light` | `dark`
- Tailwind `darkMode`: `class` + `[data-theme="dark"]`
- Legacy `light:` variant remains available but new code should use semantic tokens that switch by CSS variable.

## Retained non-token colors

- Printable financial HTML/PDF CSS inside document preview (print fidelity)
- Decorative landing macOS traffic-light dots
- Restrained token-gold chip (`ui-token` / `ui-token-soft`)
- Literal `text-white` on brand gradient logos / dark marketing heroes

## Removed legacy

- Pale green light canvas (`#eef7f4` gradients)
- Emerald/teal primary CTAs and mint selected rows
- Violet secondary-nav brand accents
- Bright dark-mode white dividers
- Duplicate light-mode override blocks that forced mint surfaces
