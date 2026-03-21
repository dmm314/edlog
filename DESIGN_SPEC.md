# EDLOG DESIGN SPECIFICATION — v4.0 (Dynamic Alive System)

## DESIGN PHILOSOPHY

Edlog is a **living teaching companion**. It should feel like opening the most
polished, responsive feed in the world — alive, magnetic, and utterly clear.
Every surface breathes. Every tap rewards. Every transition has spring.

**Target vibe:** Facebook 2026 density + Instagram Reels motion energy + Linear
craft precision — but distilled into one action per screen for a Cameroonian
teacher on a Tecno Spark in 30 seconds flat.

**Reference products:** Facebook (information density, alive feed, adaptive UI),
Instagram Reels (motion energy, ripple feedback, spring animations), Linear
(craft quality, single-accent cohesion), WhatsApp (familiar to every teacher).

**Anti-references:** Static admin dashboards, flat Material Design, multicolor
rainbow UIs, anything that feels like 2020.

### The Three Pillars

1. **Dynamic first.** Every color is HSL-derived. Accent hue subtly shifts by
   context (role, status, time). Surfaces adapt. Shadows use accent-tinted
   color-mix. Nothing is a fixed hex — everything breathes.

2. **One action, maximum reward.** A teacher taps one thing and gets spring
   feedback, ripple confirmation, status glow. Entry in 30 seconds. The feed
   rewards every interaction with motion.

3. **Alive silence.** The app is visually quiet — clean neutrals, one accent
   family — but every element is alive beneath the surface. Cards lift on
   hover. Feed items pulse live. Double-tap ripples. The stillness has energy.


## COLOR SYSTEM — Dynamic HSL Adaptive

### Philosophy

One accent hue family. Never multicolor. The accent (blue-cyan, base hsl(217,
100%, 51%) = #0866FF) shifts ±15° by context while maintaining absolute
visual cohesion. All derived colors use CSS custom properties with HSL
decomposition for true runtime adaptability.

### Primary Accent

| Context | Hue | Result |
|---------|-----|--------|
| Default (teacher) | 217° | Electric blue #0866FF |
| Verified | 202° | Cyan-shifted (celebration) |
| Flagged | 232° | Indigo-shifted (attention) |
| Admin | 222° | Deeper blue (authority) |
| Coordinator | 225° | Royal blue |
| Regional | 210° | Sky blue (wide scope) |

The shift is subtle (±15°) — users perceive one cohesive blue, not
different colors. This is the core of the "alive" feeling.

### Surface Palette

| Token | Light | Dark | Purpose |
|-------|-------|------|---------|
| surface-canvas | 220 14% 96% | 220 16% 8% | Page background |
| surface-primary | 220 14% 96% | 220 16% 8% | Primary fill |
| surface-secondary | 0 0% 100% | 220 14% 12% | Cards, elevated |
| surface-tertiary | 220 13% 91% | 220 12% 16% | Insets, dividers |
| surface-elevated | 0 0% 100% | 220 14% 13% | Floating panels |

Neutrals have a 220° blue tint — never warm stone, never cold grey.
Premium, modern, cohesive with the accent.

### Dynamic Intensity Toggle

Users can switch between `calm` and `vibrant` intensity:
- **Calm:** accent saturation drops to 72%, lightness adjusts
- **Vibrant (default):** full 100% saturation, maximum energy

This respects user preference while keeping the system dynamic.

### Color Rules

1. **Never use amber, orange, or warm tones as accent.** The old paper/amber
   system is fully replaced. Blue-cyan is the only accent family.
2. **Status colors stay semantic:** green=verified, amber=warning, red=danger.
   They use `hsl(var(--status) / 0.12)` backgrounds that work on both modes.
3. **All shadows use accent-tinted color-mix** — shadows are alive, not grey.
4. **Borders blend with accent** via `color-mix(in oklab)` for cohesion.
5. **No decorative multicolor.** Subject colors use the single accent at
   different opacities, not different hues.


## TYPOGRAPHY

Three fonts. No more.

| Font | Usage | Weight |
|------|-------|--------|
| Fraunces | Display — dashboard titles, hero headings, streak numbers | 600–800 |
| DM Sans | Body — everything else | 400–700 |
| JetBrains Mono | Data — numbers, timestamps, codes, metrics | 400–600 |

### Type Scale

| Size | Usage |
|------|-------|
| 24–28px | Dashboard greeting, page titles (Fraunces 700) |
| 18–20px | Section headings (DM Sans 700) |
| 14–16px | Body text, card content (DM Sans 400–500) |
| 12–13px | Labels, captions, meta (DM Sans 500–600) |
| 10–11px | Timestamps, badges (JetBrains Mono 500) |


## MOTION SYSTEM — Spring + Ripple + Pulse

### Philosophy

Every interaction produces visible, spring-based feedback. The app feels
physically responsive — like touching a taut surface, not clicking flat UI.

### Animation Library

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| spring-bounce | 600ms | cubic-bezier(0.34,1.56,0.64,1) | Cards entering, stat numbers |
| spring-expand | 450ms | spring easing | Composer opening, sections expanding |
| ripple-tap | 500ms | ease-out | Touch feedback on any tappable surface |
| live-pulse | 2400ms | ease-in-out, infinite | Live items, active class indicators |
| glow-breathe | 3000ms | ease-in-out, infinite | Live cards, accent CTA buttons |
| heart-pop | 500ms | spring easing | Double-tap reaction feedback |
| shimmer | 1800ms | linear, infinite | Loading skeletons |
| nav-bob | 400ms | spring easing | Active nav tab bounce |
| slide-up | 350ms | expo-out | Feed items entering viewport |
| stories-scroll | 20s | linear, infinite | Auto-scrolling notice pills |

### Rules

1. All animations respect `prefers-reduced-motion: reduce` — instant cuts.
2. Duration never exceeds 600ms for user-initiated actions.
3. Spring easing is preferred over linear/ease for all transform animations.
4. Infinite animations (pulse, breathe, shimmer) use low-intensity values.


## LAYOUT

### Mobile-First Grid

- Max content width: 480px (phone), 720px (tablet), 1200px (desktop)
- Horizontal padding: 16–20px (phone), 32px (tablet), 40px (desktop)
- Card spacing: 12px between cards, 16px between sections
- Card radius: 16px (cards), 24–32px (hero sections), pill (badges/chips)
- Card padding: 16px (compact), 20px (standard), 24px (spacious)

### Touch Targets

Minimum 44px height and width for ALL interactive elements. No exceptions.
This is non-negotiable for Tecno Spark and similar budget phones.

### Information Density

Facebook principle: MORE data in LESS space. A teacher sees their full day
without scrolling. An admin sees 6+ teacher rows. Reports show 15+ rows
on desktop. Compact mode uses 44px row height.

### Desktop Sidebar

Persistent 312px left sidebar on ≥1024px screens. Content area uses
remaining width. Navigation switches to SideNav.

### Bottom Navigation (Mobile)

5 tabs maximum. Frosted glass background with accent-tinted blur. Active
tab has accent glow + bob animation + accent background pill.
Height: 78px + safe area inset.


## COMPONENT PATTERNS

### DynamicEntryCard

The hero component. Each card:
- Status-adaptive accent glow along top edge
- Touch ripple on tap (expanding circle from touch point)
- Double-tap triggers heart-pop reaction
- Spring-bounce entrance animation
- Hover lifts card 2px with accent-tinted shadow
- Status badge animates on verification

### QuickActionsRow

Horizontally scrollable action cards:
- Primary action (Log Now) has live-pulse animation
- Each card springs on entry (staggered delay)
- Touch produces ripple feedback
- Icon containers use accent gradient backgrounds
- Pending count shown as live badge

### BottomNav

Frosted glass bar with:
- Active tab: accent background pill + glow shadow + nav-bob on select
- Center "New Entry" button: accent gradient, always prominent
- Inactive: subtle text, transitions to active on tap

### Story Notices

Horizontally scrolling notice pills:
- Unread notices pulse with live-pulse animation
- Glass panel background with accent tint
- Staggered entrance animations
- Auto-scroll option for ambient display

### Buttons

| Variant | Style |
|---------|-------|
| Primary | Accent gradient, white text, accent shadow, spring on tap |
| Secondary | Surface fill + accent tint, accent border on hover |
| Ghost | Transparent, accent-soft background on hover |
| Danger | Red gradient with red shadow |
| Success | Green gradient with green shadow |

One primary button per screen. Everything else secondary or ghost.


## DARK MODE

1. Every element uses HSL CSS variables. No hardcoded hex in components.
2. Dark surfaces use 220° hue tint (blue-tinted darks, not warm stone).
3. Accent lightness increases in dark mode for visibility (51% → 66%).
4. Shadows use deeper blacks with slight accent tint.
5. Glass effects increase blur and reduce transparency.
6. Text hierarchy: primary=near-white, secondary=64% lightness, tertiary=46%.
7. Borders are visible but quiet (20% lightness).


## RESPONSIVE BREAKPOINTS

| Breakpoint | Layout | Navigation | Tables |
|-----------|--------|-----------|--------|
| < 640px | Single column, full-width | Bottom nav (5 tabs) | Stacked cards |
| 640–1024px | Wider cards, 2-column | Bottom nav | Scrollable table |
| > 1024px | Sidebar + main content | Side nav | Full table |


## PERFORMANCE

- Target: 60fps on Tecno Spark (Mediatek Helio A22)
- All animations use `transform` and `opacity` only (GPU-composited)
- `will-change: transform` on animated elements, removed after animation
- Image loading via Next/Image with blur placeholders
- Skeleton screens for all data-loading states
- No spinner — always skeletons with shimmer
- CSS animations preferred over JS where possible
- `content-visibility: auto` for off-screen feed items
