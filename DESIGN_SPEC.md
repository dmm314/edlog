# EDLOG DESIGN SPECIFICATION — v7.0 (Emerald Identity)

## DESIGN PHILOSOPHY

Edlog is a **functional-first teacher portal**. It must be the fastest, clearest
tool a Cameroonian teacher has ever used — on any device, on any network. Beauty
serves purpose. Beauty never hides function.

**Target vibe:** Clean, warm, professional. Emerald green = growth = education =
Cameroon. Gold = achievement = trust. Warm neutral surfaces — not cold tech-gray.
Teachers on Tecno phones finish a log in 30 seconds without fighting beauty.

**Reference products:** WhatsApp (familiar, fast, functional), Linear (craft
quality), Instagram (one accent color, restrained use).

**Anti-references:** Glassmorphism dashboards, glow effects, pulsing animations,
rainbow accent shifts, anything that makes a button hard to find. Facebook blue
clone aesthetics.

### The Three Pillars

1. **Function first.** Every screen has ONE clear purpose and ONE primary action.
   A teacher sees "Log this class" within 2 seconds of opening the app. An admin
   sees "What needs attention today" instantly.

2. **Warm neutral calm.** Surfaces are warm white/cream in light mode, warm
   charcoal in dark. No accent-tinted shadows, no background gradients, no glows
   on cards. Color appears ONLY on: active nav tabs, primary buttons, status
   badges, role dots.

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
- Role dot color: Emerald (`hsl(152 60% 36%)`)

All portals share:
- Bottom nav: Home / Timetable / New Entry / Notices / Profile
- Mobile-first, 480px max content width
- 44px minimum touch targets
- WhatsApp-level familiarity


## COLOR SYSTEM — Emerald + Gold

### Philosophy

Primary accent: **Emerald green** `hsl(152 60% 36%)`. Used ONLY on:
- Bottom nav active tab icon + label
- Primary action buttons
- Sign-in button
- Active link highlights

Secondary accent: **Gold** `hsl(42 92% 50%)`. Used ONLY on:
- Achievement badges, stars, streak indicators
- Premium/trust highlights
- Subtle decorative accents (sparingly)

Status colors stay semantic: green=verified, amber=warning, red=flagged,
blue=submitted.

Everything else is warm neutral.

### Surface Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| surface-canvas | `40 30% 97%` | `30 10% 8%` | Page background (warm) |
| surface-secondary | `40 25% 99%` | `30 8% 12%` | Cards |
| surface-tertiary | `40 15% 93%` | `30 6% 16%` | Insets, dividers |
| surface-elevated | `0 0% 100%` | `30 8% 13%` | Floating panels |

Neutrals have warm undertone — professional, welcoming, not cold.

### Brand Colors

| Token | Value | Purpose |
|-------|-------|---------|
| --accent | `152 60% 36%` | Primary green (buttons, links, nav) |
| --accent-hover | `152 60% 30%` | Green hover state |
| --gold | `42 92% 50%` | Achievement gold |
| --gold-soft | `42 80% 92%` | Gold background tint |
| --gold-text | `42 70% 35%` | Gold text (accessible) |

### Color Rules

1. **No accent-tinted shadows.** All shadows are neutral black at low opacity.
2. **No accent-tinted borders.** Borders are warm neutral gray.
3. **No background gradients** on cards, headers, or body.
4. **No glow, pulse, breathe, or ripple** effects on any element.
5. **Status colors stay semantic:** green=verified, amber=warning, red=flagged.
6. **Sign-in button:** Always emerald green bg, white text — visible in both
   light and dark modes.


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
- Active tab: accent green icon + label
- Inactive: gray icon + label
- Center "New Entry": accent green pill button
- Height: 64px + safe area inset
- No glow, no bob animation, no shadows on tabs

### Desktop Sidebar

Persistent 288px (18rem) left sidebar on ≥1024px. Clean white/dark surface
with simple nav links. Active link has accent green text + subtle green bg tint.


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
| Primary | Solid accent green bg, white text |
| Secondary | White bg, gray border, dark text |
| Ghost | Transparent, gray text, gray bg on hover |
| Danger | Solid red bg, white text |
| Success | Solid green bg, white text |

One primary button per screen. Everything else secondary or ghost.

### Status Badges

Small pills with tinted backgrounds:
- Draft: gray bg, gray text
- Submitted: light accent bg, accent text
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
2. Dark surfaces: warm charcoal (30° 8-10%) — not cold blue-black.
3. Accent green brightens in dark mode for visibility (36% → 50% lightness).
4. Shadows use deeper blacks (no accent tint).
5. Text hierarchy: primary=near-white, secondary=64%, tertiary=46%.
6. Borders stay subtle (20% lightness, warm undertone).


## RESPONSIVE BREAKPOINTS

| Breakpoint | Layout | Navigation | Tables |
|-----------|--------|-----------|--------|
| < 640px | Single column, full-width | Bottom nav (5 tabs) | Stacked cards |
| 640–1024px | Wider cards, 2-column | Bottom nav | Scrollable table |
| > 1024px | Sidebar + main content | Side nav | Full table |


## LOGIN PAGE & PUBLIC HOMEPAGE — v7.0

### Philosophy

Both the public homepage (`/`) and the login page (`/login`) use emerald green
on warm neutral surfaces. The homepage is a compelling landing page — even users
without accounts should feel the urge to join.

### Background

| Surface     | Light mode              | Dark mode             |
|-------------|-------------------------|-----------------------|
| Page canvas | `hsl(40 30% 97%)`       | `hsl(30 10% 8%)`      |
| Card        | `#FFFFFF`               | `hsl(30 8% 12%)`      |

Warm off-white canvas so cards pop with genuine contrast.

### Sign-In Button (THE rule)

```
background: hsl(var(--accent))   ← emerald green from CSS variables
color:      #FFFFFF              ← always white text
min-height: 48px                 ← 44px touch target + breathing room
```

### Homepage Layout

```
[sticky header: Leaf logo left | Sign In button right (green)]
[hero section: "The logbook that grows with your teaching"]
  ├─ H1 headline + tagline
  └─ [Get Started — green] [Learn More — ghost]
[stats bar: 60s / 40+ schools / 10 regions / 58 divisions]
[role cards: Teacher, School Admin, Regional Inspector]
[features grid: 6 features with green icons]
[how it works: 3-step flow]
[regional coverage: all 10 Cameroon regions with capitals]
[testimonials: 3 educator quotes with gold stars]
[green CTA section: "Ready to grow?"]
[footer: neutral]
```

### Login Page Layout

```
[centered column, max-w-[400px]]
  ├─ Logo: green Leaf icon + "Edlog" wordmark
  ├─ "Sign in to your account"
  ├─ [optional success / error banners]
  ├─ Email input
  ├─ Password input + show/hide toggle
  ├─ [Sign In button: green bg, white text, 48px height]
  └─ "Don't have an account? Get Started"
[register option cards below: Teacher / School Admin / Regional Inspector]
```

### Earned-Color on Login & Homepage

Emerald green appears ONLY on:
1. Logo icon (Leaf)
2. The Sign In / primary CTA button
3. Section label micro-text (e.g. "BUILT FOR CAMEROON")
4. Feature card icons
5. CTA section background
6. Step number circles

Gold appears on:
1. Star ratings in testimonials
2. Stats bar numbers
3. Achievement/streak indicators

Everything else is warm neutral surfaces. The green button stands out because
everything around it is neutral — that IS the earned color working.


## PERFORMANCE

- Target: 60fps on Tecno Spark (Mediatek Helio A22)
- No decorative animations consuming GPU cycles
- All transitions use `transform` and `opacity` only
- Image loading via Next/Image with blur placeholders
- Skeleton screens for all data-loading states
- CSS-only — no JS animation libraries
- `content-visibility: auto` for off-screen feed items
