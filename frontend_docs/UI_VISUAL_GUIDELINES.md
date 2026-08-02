# UI Visual Guidelines

Visual discipline for authenticated Ratab screens. Preserve brand identity; avoid generic AI-dashboard aesthetics.

## Spacing

| Token | Use |
| --- | --- |
| 4px | Micro spacing |
| 8px | Related inline elements |
| 12px | Compact groups |
| 16px | Standard field / card padding |
| 20–24px | Section spacing |
| 32px | Major page sections only |

Avoid random gaps and oversized empty regions after copy removal.

## Radius

| Surface | Approx |
| --- | --- |
| Inputs / buttons | 10–12px (`rounded-[11px]`) |
| Cards | 14–16px (`rounded-xl`) |
| Sheets / modals | 16–20px |
| Status chips | pill (`rounded-full`) |

Do not make every container a large pill or heavy glass panel.

## Surfaces

- Subtle borders (`border-ui-border-subtle`)
- Restrained shadows (`shadow-ui-sm`, `shadow-ui` on hover)
- No glow on ordinary containers
- Prefer divider / spacing over nested cards
- Stronger emphasis only for active / selected / focus

Shared: `GlassCard` (surface container), not a marketing hero.

## Typography

| Role | Guidance |
| --- | --- |
| Page title | Compact, strong (`text-xl` → `sm:text-2xl`) |
| Section title | Medium (`text-base` → `text-lg`) |
| Body | Readable `text-sm` with calm line-height |
| Metadata | Smaller muted |

Authenticated pages must not use landing-sized (`text-3xl` / `text-4xl`) headings.
Font: Vazirmatn.

## Buttons

Variants: primary, secondary, ghost, danger, icon/sm sizes via `Button`.

- One clear primary action
- Desktop: prefer compact width; mobile: full-width when appropriate
- Preserve width in loading state
- `focus-visible` ring required
- Icon-only needs accessible label (+ tooltip when useful)

## Badges

Keep for: status, role, plan, unread, selection, decision-relevant category.
Remove decorative brand/page-repeat badges.

## Page header

Use `PageHeader`:

- one title
- optional compact status/count
- actions
- no generic subtitle by default
- border divider instead of hero card

## Density

- Compact headers
- Medium-density forms
- Compact lists
- Comfortable modals
- Larger spacing only for empty states / public pages

When removing copy: shrink padding and height; move content up.

## Motion

- 120–180ms transitions
- Subtle hover border/background on interactive cards
- Respect `prefers-reduced-motion` (`motion-safe:`)
- No heavy layout animation

## Mobile

- Task-focused, not scaled desktop
- ≥44px touch targets
- Safe-area aware sheets
- Contextual help as tap toggletip
- List content high above the fold

## Themes

Validate light and dark:

- Readable muted text
- Adequate border contrast
- Controlled shadows (no wash-out in light)
- Clear focus / danger / success

## Components to prefer

- `PageHeader`
- `Button`
- `Field` (+ `help` / `optional`)
- `ContextualHelp`
- `GlassCard`
- `EmptyState`
- `StatusBadge`
- Existing `Tooltip` for icon-nav labels only
