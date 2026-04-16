# EDLOG DESIGN SPECIFICATION — v5.1 (Elite Functional Minimal)

## DESIGN PHILOSOPHY

Edlog is a **functional-first teacher portal**. It must be the fastest, clearest
tool a Cameroonian teacher has ever used — on any device, on any network. Beauty
serves purpose. Beauty never hides function.

**Target vibe:** Facebook 2026 top form — color only on tabs and active elements.
The dashboard is neutral, readable, and functional. Teachers on Tecno phones
finish a log in 30 seconds without fighting beauty.

**Reference products:** Facebook (neutral feed, color only on nav tabs and
buttons), WhatsApp (familiar, fast, functional), Linear (craft quality).

**Anti-references:** Glassmorphism dashboards, glow effects, pulsing animations,
rainbow accent shifts, anything that makes a button hard to find.

### The Three Pillars

1. **Function first.** Every screen has ONE clear purpose and ONE primary action.
   A teacher sees "Log this class" within 2 seconds of opening the app. An admin
   sees "What needs attention today" instantly.

2. **Neutral calm.** Surfaces are white/gray in light mode, near-black in dark.
   No accent-tinted shadows, no background gradients, no glows on cards. Color
   appears ONLY on: active nav tabs, primary buttons, status badges, role dots.

3. **Beauty must never hide function.** The sign-in button is always visible.
   The header always shows what school/role/date. Every touch target is 44px.
   Every label is readable. Zero decorative animations.


## ROLE PORTALS — CLEAR FUNCTIONAL OBJECTIVES

### 1. Regional Admin
**Purpose:** Oversight across schools.
- Must see at a glance: total teachers, pending verifications, flagged entries,
  regional stats.
- One action per screen: "Review schools" or "Broadcast notice."
- Layout: Dense clean tables + filters. No distractions.
- Role dot color: Navy (`hsl(210 100% 30%)`)

### 2. VP / Level Coordinator
**Purpose:** Quality control & signing logs.
- Must see: Pending entries from their level with quick "Verify + Remark" flow.
- One action: Open entry → read → annotate → green check.
- Layout: Clean pending list + always-visible remark box.
- Role dot color: Purple (`hsl(270 60% 45%)`)

### 3. School Admin
**Purpose:** School management & reports.
- Must see: What needs attention today + full searchable reports.
- One action: "Generate report" or "Assign teacher."
- Layout: Summary cards + clean table.
- Role dot color: Slate (`hsl(215 20% 40%)`)

### 4. Teacher (default)
**Purpose:** Daily logging in 30 seconds.
- Must see: Today's timetable auto-filled + "Log this class now."
- One action: Fill entry → submit.
- Layout: Minimal form, collapsed extras, instant success.
- Role dot color: Blue (`hsl(217 100% 51%)`)

All portals share:
- Bottom nav: Home / Timetable / New Entry / Notices / Profile
- Mobile-first, 480px max content width
- 44px minimum touch targets
- WhatsApp-level familiarity


## COLOR SYSTEM — Facebook-Minimal

### Philosophy

One accent color: **#0866FF** (Facebook blue). Used ONLY on:
- Bottom nav active tab icon + label
- Primary action buttons
- Status pills (submitted = blue, verified = green, flagged = red)
- Tiny role indicator dots in the header

Everything else is neutral gray/white.

### Surface Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| surface-canvas | `220 5% 96%` | `220 10% 8%` | Page background |
| surface-secondary | `0 0% 100%` | `220 8% 12%` | Cards |
| surface-tertiary | `220 5% 91%` | `220 6% 16%` | Insets, dividers |
| surface-elevated | `0 0% 100%` | `220 8% 13%` | Floating panels |

Neutrals have minimal blue tint — clean, professional, not cold.

### Color Rules

1. **No accent-tinted shadows.** All shadows are neutral black at low opacity.
2. **No accent-tinted borders.** Borders are neutral gray.
3. **No background gradients** on cards, headers, or body.
4. **No glow, pulse, breathe, or ripple** effects on any element.
5. **Status colors stay semantic:** green=verified, amber=warning, red=flagged.
6. **Sign-in button:** Always `background: #0866FF; color: #FFFFFF;` — visible
   in both light and dark modes.


## TYPOGRAPHY

Three fonts. No more.

| Font | Usage | Weight |
|------|-------|--------|
| Fraunces | Display — page titles, greeting, streak numbers | 600–800 |
| DM Sans | Body — everything else | 400–600 |
| JetBrains Mono | Data — numbers, timestamps, codes | 400–600 |

### Type Scale

| Size | Usage |
|------|-------|
| 24–28px | Page titles (Fraunces 700) |
| 16–18px | Section headings (DM Sans 600) |
| 14–15px | Body text, card content (DM Sans 400–500) |
| 12–13px | Labels, captions (DM Sans 500) |
| 10–11px | Timestamps, badges (JetBrains Mono 500) |


## MOTION SYSTEM — Minimal

### Philosophy

Motion exists only to confirm user actions and orient navigation. No decorative
animations. No infinite loops. No spring physics.

### Allowed Animations

| Animation | Duration | Usage |
|-----------|----------|-------|
| fade-in | 200ms | Elements appearing |
| slide-up | 250ms | Feed items entering |
| scale-in | 200ms | Modals opening |
| shimmer | 1800ms (loop) | Loading skeletons only |

### Rules

1. All animations respect `prefers-reduced-motion: reduce`.
2. No `will-change` on static elements.
3. No infinite animations except loading skeletons.
4. No spring easing. Use simple `ease-out`.
5. Button feedback: `transform: scale(0.97)` on active. Nothing more.


## LAYOUT

### Mobile-First Grid

- Max content width: 480px (phone), 720px (tablet), 1200px (desktop)
- Horizontal padding: 16px (phone), 24px (tablet), 32px (desktop)
- Card spacing: 12px between cards, 16px between sections
- Card radius: 14px
- Card padding: 16–20px

### Touch Targets

Minimum 44px height and width for ALL interactive elements. Non-negotiable.

### Header Bar

Clean functional bar on every page:
- Left: School name (or "Edlog" for login)
- Center/right: Role dot + date
- Right: Primary action button (if applicable)
- No gradients, no shine, no background images
- Light: white bg + bottom border. Dark: near-black bg + bottom border.

### Bottom Navigation (Mobile)

5 tabs maximum. Clean solid background (not frosted glass).
- Active tab: accent blue icon + label
- Inactive: gray icon + label
- Center "New Entry": accent blue pill button
- Height: 64px + safe area inset
- No glow, no bob animation, no shadows on tabs

### Desktop Sidebar

Persistent 288px (18rem) left sidebar on ≥1024px. Clean white/dark surface
with simple nav links. Active link has accent blue text + subtle blue bg tint.


## COMPONENT PATTERNS

### Cards

Simple white (or dark surface) cards with:
- 1px neutral border
- Subtle neutral shadow (box-shadow, no accent tint)
- 14px border-radius
- No hover lift animation. Shadow deepens slightly on hover.
- No `::after` pseudo-element glow lines.

### Buttons

| Variant | Style |
|---------|-------|
| Primary | Solid accent blue bg, white text |
| Secondary | White bg, gray border, dark text |
| Ghost | Transparent, gray text, gray bg on hover |
| Danger | Solid red bg, white text |
| Success | Solid green bg, white text |

One primary button per screen. Everything else secondary or ghost.

### Status Badges

Small pills with tinted backgrounds:
- Draft: gray bg, gray text
- Submitted: light blue bg, blue text
- Verified: light green bg, green text
- Flagged: light red bg, red text

### Entry Cards

Clean, functional display:
- White card with neutral border
- Subject name + class in bold
- Time + period as mono text
- Status badge on the right
- No ripple effects, no double-tap reactions, no spring entrance


## DARK MODE

1. Every element uses CSS custom properties.
2. Dark surfaces: near-black with minimal blue tint (220° 8-10%).
3. Accent blue brightens in dark mode for visibility (51% → 66% lightness).
4. Shadows use deeper blacks (no accent tint).
5. Text hierarchy: primary=near-white, secondary=64%, tertiary=46%.
6. Borders stay subtle (20% lightness).


## RESPONSIVE BREAKPOINTS

| Breakpoint | Layout | Navigation | Tables |
|-----------|--------|-----------|--------|
| < 640px | Single column, full-width | Bottom nav (5 tabs) | Stacked cards |
| 640–1024px | Wider cards, 2-column | Bottom nav | Scrollable table |
| > 1024px | Sidebar + main content | Side nav | Full table |


## LOGIN PAGE & PUBLIC HOMEPAGE — v5.1 Standard

### Philosophy

Both the public homepage (`/`) and the login page (`/login`) follow the same
"standard modern login" pattern used by Facebook, WhatsApp, and Notion in 2026:
earned blue on a calm neutral canvas, centered white card, no pure-white pages.

### Background

| Surface     | Light mode              | Dark mode             |
|-------------|-------------------------|-----------------------|
| Page canvas | `hsl(220 14% 96%)`      | `hsl(220 10% 8%)`     |
| Card        | `#FFFFFF`               | `hsl(220 8% 12%)`     |

Never use `background: white` on the full page. The canvas must always be a
step off-white (light gray) so the card pops with genuine contrast.

### Sign-In Button (THE rule)

```
background: #0866FF   ← hardcoded, not a CSS variable
color:      #FFFFFF   ← always white text
min-height: 48px      ← 44px touch target + breathing room
```

**Why hardcoded?** Older Android WebViews (Tecno/Infinix phones, Chrome < 65)
may not resolve `hsl(space-separated)` CSS Level 4 syntax reliably. Hardcoding
`#0866FF` guarantees the button is always blue with white text — no FOUC, no
white-on-white, no contrast failure in either light or dark mode.

### Homepage Layout

```
[sticky header: logo left | Sign In button right (#0866FF)]
[hero card: blue gradient contained in rounded-2xl card]
  ├─ "New · Smart timetabling" pill
  ├─ H1 headline (white text)
  ├─ Tagline (white/60 text)
  └─ [Sign In — white bg #0866FF text] [Get Started — ghost]
[stats row: 60s / 40+ / 100% — neutral white card]
[role cards: Teacher, School Admin, Regional Inspector]
[features grid: 2-col, neutral cards on secondary bg]
[how it works: 3-step list]
[final CTA: blue gradient section — second earned-color moment]
[footer: neutral]
```

### Login Page Layout

```
[centered column, max-w-[400px]]
  ├─ Logo: #0866FF icon + "Edlog" wordmark + "Sign in to your account"
  ├─ [optional success / error banners]
  ├─ Email input (input-field class)
  ├─ Password input + show/hide toggle
  ├─ [Sign In button: #0866FF bg, #FFFFFF text, 48px height]
  └─ "Don't have an account? Get Started"
[register option cards below: Teacher / School Admin / Regional Inspector]
```

### Earned-Color on Login & Homepage

Blue (`#0866FF`) appears ONLY on:
1. Logo icon background
2. The Sign In / primary CTA button (always blue, always pops)
3. Section label micro-text (e.g. "BUILT FOR EVERYONE")
4. Role card icons that map to the accent (Teacher role)
5. Hero card and final CTA section background gradient
6. Step number bubbles (gradient)

Everything else is neutral surfaces (`surface-canvas`, `surface-elevated`,
`border-primary`, `text-primary/secondary/tertiary`). The blue button stands
out because everything around it is neutral — that IS the earned color working.


## PERFORMANCE

- Target: 60fps on Tecno Spark (Mediatek Helio A22)
- No decorative animations consuming GPU cycles
- All transitions use `transform` and `opacity` only
- Image loading via Next/Image with blur placeholders
- Skeleton screens for all data-loading states
- CSS-only — no JS animation libraries
- `content-visibility: auto` for off-screen feed items
