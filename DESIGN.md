# Couple Finance Design System

This document is the source of truth for visual decisions in Couple Finance. Existing screens should converge on these rules incrementally; new UI must follow them immediately.

## 1. Atmosphere & identity

Couple Finance should feel warm, trustworthy, and shared rather than institutional. Its signature is a soft pink glass surface over a restrained pastel mesh: friendly enough for daily household use while preserving the clarity expected from financial data.

Principles:

- Financial meaning comes before decoration.
- Soft surfaces may support hierarchy, but must not reduce contrast or obscure controls.
- Mobile is the primary surface; tablet and desktop retain a focused app frame unless a route defines a wider data layout.
- Korean copy is primary. English eyebrow labels are optional accents, not required navigation.

## 2. Color

### Core palette

| Role | Token | Value | Usage |
|---|---|---:|---|
| Brand primary | `--primary` | `#ff8fab` | Primary actions and selected controls |
| Brand strong | `--primary-dark` | `#fb6f92` | Hover, emphasis, active icons |
| Brand soft | `--primary-soft` | `#ffc2d1` | Selected backgrounds and highlights |
| Accent coral | `--accent-coral` | `#ffb3c6` | Supporting decorative accent |
| Accent peach | `--accent-peach` | `#ffe5ec` | Warm secondary surface |
| Accent violet | `--accent-violet` | `#e0c3fc` | Analysis/report accent |
| Text primary | `--text-main` | `#2d2d5f` | Headings, values, body text |
| Text secondary | `--text-secondary` | `#6b6b99` | Labels and supporting copy |
| Canvas | `--bg-light` | `#fdfdfd` | Application background |
| Dark canvas | `--bg-dark` | `#2d1b2e` | Reserved dark-mode background |
| Destructive | `--destructive` | `#ef4444` | Destructive actions and errors |

### Semantic rules

- Pink is reserved for primary interaction and brand emphasis.
- Income, expense, warning, and success colors must include a text or icon cue; color alone must not carry meaning.
- Body text targets WCAG 2.2 AA contrast of at least 4.5:1. Large text and essential iconography target at least 3:1.
- Raw hex, RGB, or HSL values are not introduced in components. Add or reuse a semantic token first.
- Glass borders must remain visible against both the canvas and adjacent cards.
- Dark mode is not considered complete until all semantic surface and text tokens have explicit dark values.

## 3. Typography

### Font stack

- Primary and display: `"Pretendard Variable", Pretendard, system-ui, -apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Noto Sans KR", "Segoe UI", sans-serif`
- Numeric data: the primary stack with tabular figures enabled.
- Use no more than two font families. A second family requires a documented product role.

### Type scale

| Level | Size / line height | Weight | Usage |
|---|---|---:|---|
| Display | `36px / 44px` | 800–900 | Auth/product title |
| H1 | `26px / 34px` | 800–900 | Page title |
| H2 | `22px / 30px` | 700–800 | Section title |
| H3 | `18px / 26px` | 700 | Card title |
| Body | `16px / 24px` | 400–600 | Default content and form input |
| Body small | `14px / 22px` | 400–600 | Supporting content |
| Caption | `12px / 18px` | 500–700 | Metadata and helper copy |
| Overline | `11px / 16px` | 600–700 | Optional eyebrow label |

Rules:

- Korean text uses `word-break: keep-all` where short labels or headings must preserve words.
- Use `text-wrap: balance` for headings and `text-wrap: pretty` for explanatory copy when supported.
- Monetary values and percentages use tabular figures and remain attached to their units.
- Body text must not be smaller than 14px. The 11–12px levels are limited to non-essential metadata.

## 4. Spacing & layout

### 8px grid

The base layout unit is **8px**. A 4px half-step is allowed only for optical alignment between an icon and adjacent text.

| Token | Value | Usage |
|---|---:|---|
| `--space-0-5` | `4px` | Optical/micro alignment only |
| `--space-1` | `8px` | Compact inline gap |
| `--space-2` | `16px` | Default control and card gap |
| `--space-3` | `24px` | Card padding and grouped content |
| `--space-4` | `32px` | Section separation |
| `--space-5` | `40px` | Page header separation |
| `--space-6` | `48px` | Major section separation |
| `--space-8` | `64px` | Large breathing room |
| `--space-12` | `96px` | App-shell reservation |

Layout rules:

- Primary mobile viewport: 375px and wider.
- Breakpoints follow Tailwind defaults: 640, 768, 1024, 1280, and 1536px.
- The focused application shell uses `max-w-md`; data-heavy screens may define a documented wider shell.
- Fixed bottom navigation reserves its full height, raised FAB footprint, and `env(safe-area-inset-bottom)` in content padding.
- Full-height surfaces use `min-height: 100dvh`, not `100vh`.
- Primary content must never be horizontally scrollable at 375px.

## 5. Components

### Button

- Minimum touch target: 44×44px.
- Variants: primary, secondary, ghost, destructive, and icon.
- States: default, hover, active, focus-visible, disabled, and loading.
- Icon-only buttons require an accessible name; nested SVG icons are decorative.
- Loading buttons remain disabled and preserve their original width.

### Input

- Labels remain visible outside the input; placeholders never replace labels.
- States: default, focus-visible, invalid, disabled, and read-only.
- Input boundaries must remain visible on glass surfaces.
- Validation feedback is placed next to the field and associated programmatically.

### Card and glass panel

- Cards group related information; they are not the default wrapper for every block.
- Use one clear depth cue per hierarchy level. Avoid stacking strong border, shadow, and gradient without a documented reason.
- Interactive cards expose hover, active, keyboard focus, and accessible semantics.

### Bottom navigation and FAB

- Render only inside authenticated `(app)` routes.
- The navigation owns a labelled `nav` landmark and marks the current page.
- The FAB represents the primary create action and has an accessible name.
- Hide or adapt the FAB when a screen already presents a competing create/submit action.
- Content padding must exceed the complete navigation/FAB footprint.

### Financial charts

- Charts include a textual summary or table-equivalent data.
- Legends use text plus color. Tooltips remain operable by keyboard and touch.
- Currency and percentages share the central formatting utilities.

## 6. Motion & interaction

| Motion | Duration | Easing | Usage |
|---|---:|---|---|
| Immediate | 100ms | ease-out | Press feedback |
| Micro | 150ms | ease-out | Hover and focus transitions |
| Standard | 200–300ms | ease-in-out | Dialog, sheet, and tab transitions |
| Emphasis | 400ms maximum | cubic-bezier(0.16, 1, 0.3, 1) | Rare page-level emphasis |

Rules:

- Animate only `transform`, `opacity`, and carefully scoped `filter` effects.
- Motion communicates interaction or state; decorative perpetual motion is avoided.
- `prefers-reduced-motion: reduce` disables non-essential animation and smooth scrolling and shortens remaining transitions to effectively immediate.
- Loading spinners may continue only when they are necessary to communicate active progress.

## 7. Radius, depth & shadow

### Border-radius scale

| Level | Value | Usage |
|---|---:|---|
| Small | `12px` | Compact controls and badges |
| Medium | `16px` | Inputs and buttons |
| Large | `24px` | Cards and dialogs |
| Extra large | `32px` | Feature/summary surfaces |
| Display | `40px` | Rare auth or hero container |
| Full | `9999px` | Avatars, pills, FAB, bottom navigation |

Inner elements use a radius at least one level smaller than their container.

### Shadow scale

| Token | Value | Usage |
|---|---|---|
| `--shadow-soft` | `0 10px 40px -10px rgba(100,100,150,.08)` | Resting card |
| `--shadow-glass` | `0 8px 32px rgba(220,220,240,.35)` | Glass panel |
| `--shadow-candy` | inner highlight + soft pink depth | Branded interactive surface |
| `--shadow-glow` | `0 0 25px rgba(255,143,171,.4)` | Rare primary emphasis |

Do not add an unregistered shadow. Strong glow is reserved for one primary focal action per screen.

## 8. Accessibility constraints & accepted debt

### Constraints

- Target WCAG 2.2 AA.
- Browser zoom remains enabled.
- Every interactive control is keyboard reachable and has a visible focus indicator.
- Touch targets are at least 44×44px where feasible.
- Icon-only controls have accessible names; decorative icons use `aria-hidden="true"`.
- UI icons use **Lucide** with the 24×24 viewBox, standard 2px stroke, and 16/20/24/32px rendered sizes.
- Emoji are not used as functional icons, status indicators, pseudo-element decoration, or substitutes for brand assets.
- Category emoji stored as user-facing data are temporarily permitted, but must have a text label and may not be the sole category identifier.
- Content remains usable at 375px width, 200% zoom, increased text size, and reduced motion.

### Accepted debt

| Item | Location | Why accepted | Exit condition |
|---|---|---|---|
| Category emoji data | Transaction/category screens | Existing persisted category model | Migrate to a typed Lucide icon key with a data migration |
| Raw color and arbitrary radius utilities | Existing page components | Legacy Stitch-derived styling | Replace incrementally when each feature is edited |
| Partial dark-mode variables | `app/globals.css` | Dark mode is not currently a complete product feature | Complete semantic dark tokens or remove the partial mode |
| Decorative perpetual animations | Auth and legacy surfaces | Existing brand treatment | Replace with static or reduced-motion-safe treatments during component cleanup |

New accessibility or design debt must be added to this table with an owner or concrete exit condition; it must not be accepted silently.
