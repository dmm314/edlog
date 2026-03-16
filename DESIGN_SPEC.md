# EDLOG DESIGN SPECIFICATION — v3.0 (Production)

## DESIGN PHILOSOPHY

Edlog is infrastructure. It should feel like opening a well-made notebook —
not like using an app. The design must communicate: "This was built by people 
who take education seriously."

**Reference products:** Facebook (density + clarity), Linear (craft + speed), 
Notion (clean information hierarchy), WhatsApp (familiar to every Cameroonian 
teacher on a Tecno Spark).

**Anti-references:** Generic admin dashboards, Material Design templates, 
anything that screams "built by a developer, not a designer."

### The Three Rules

1. **Information first.** Every pixel shows data the user needs. No 
   decorative gradients that don't communicate hierarchy. No icons that 
   don't mean something. No cards that exist because cards are trendy.

2. **One action per screen.** A teacher's dashboard has one job: show 
   what to log next. An admin's dashboard has one job: show what needs 
   attention. A report table has one job: answer questions about data.

3. **Silence is design.** Empty space is intentional. Muted colors are 
   intentional. The absence of a feature is a feature. The app should 
   feel quiet — like a library, not a carnival.


## COLOR SYSTEM

### The Palette

The palette is built from stone — warm neutrals that feel like paper and ink.
Amber is the only accent, used sparingly for actions and highlights.

**Light mode — "Warm Paper"**

| Token | Value | Usage |
|-------|-------|-------|
| --bg-primary | #FAFAF9 | Page background — warm off-white, never pure white |
| --bg-secondary | #F5F5F4 | Section backgrounds, insets |
| --bg-tertiary | #E7E5E4 | Borders as backgrounds, disabled states |
| --bg-elevated | #FFFFFF | Cards — pure white floats on warm cream |
| --text-primary | #1C1917 | Headlines, important labels |
| --text-secondary | #57534E | Body text, descriptions |
| --text-tertiary | #A8A29E | Captions, timestamps, meta |
| --text-quaternary | #D6D3D1 | Placeholders, disabled text |
| --accent | #F59E0B | Primary actions — buttons, links, FABs |
| --accent-hover | #D97706 | Hover state for accent |
| --accent-light | rgba(245,158,11,0.08) | Tinted backgrounds for accent elements |
| --accent-text | #D97706 | Text in accent color |

**Dark mode — "Deep OLED"**

| Token | Value | Usage |
|-------|-------|-------|
| --bg-primary | #0C0A09 | True near-black — OLED friendly |
| --bg-secondary | #1C1917 | Section backgrounds |
| --bg-tertiary | #292524 | Elevated insets |
| --bg-elevated | #1C1917 | Cards float one step above primary |
| --text-primary | #FAFAF9 | Headlines |
| --text-secondary | #A8A29E | Body |
| --text-tertiary | #78716C | Captions |
| --accent | #FBBF24 | Bright amber pops against the void |

### Color Rules

1. **Never use blue, purple, or green as surface colors.** These are 
   reserved for semantic status indicators only.
2. **Status colors use the same hue in both modes:** green = verified, 
   amber = pending, red = flagged. Use `rgba(color, 0.1)` backgrounds 
   that work on both light and dark surfaces.
3. **Role gradients for headers only** — not for cards or backgrounds:
   - Teacher: warm stone (#1B1512 → #3D322C)
   - School Admin: cool slate (#0F172A → #334155)
   - VP/Coordinator: purple (#4C1D95 → #7C3AED)
   - Regional: deep navy (#0C1222 → #1A2744)
4. **No decorative color.** If a color doesn't communicate information 
   (status, role, action), it shouldn't exist.


## TYPOGRAPHY

Three fonts. No more.

| Font | Usage | Weight range |
|------|-------|-------------|
| Fraunces | Display — dashboard titles, hero headings | 600–800 |
| DM Sans | Body — everything else: labels, paragraphs, buttons, nav | 400–700 |
| JetBrains Mono | Data — numbers, codes, timestamps, table cells | 400–600 |

### Type scale

| Size | Usage |
|------|-------|
| 24–28px | Dashboard greeting, page titles (Fraunces) |
| 18–20px | Section headings (DM Sans 700) |
| 14–16px | Body text, card content (DM Sans 400–500) |
| 12–13px | Labels, captions, meta (DM Sans 500–600) |
| 10–11px | Timestamps, badges, fine print (DM Sans/JetBrains 500) |

### Type rules

1. UPPERCASE is reserved for: section labels (10px, tracking 0.1em), 
   badge text, and tab labels. Never for body text or headings.
2. Line height: headings 1.2, body 1.5, captions 1.4.
3. Letter spacing: headings -0.02em, body 0, uppercase +0.08em.


## LAYOUT

### Mobile-first grid

- Max content width: 480px (phone), 720px (tablet), 1200px (desktop)
- Horizontal padding: 20px (phone), 32px (tablet), 40px (desktop)
- Card spacing: 8px between cards, 16px between sections
- Card radius: 16px
- Card padding: 16px (compact), 20px (standard), 24px (spacious)

### Desktop layout (admin, coordinator, regional)

On screens ≥1024px, show a persistent left sidebar (240px) with navigation.
The main content area uses the remaining width. This is already implemented
via SideNav — ensure it's used consistently.

### Bottom navigation (mobile)

5 tabs maximum per role. Each tab: icon (20px) + label (10px bold).
Active tab: accent color. Inactive: tertiary text.
Background: frosted glass (--nav-bg with backdrop-blur).

### Information density

**Facebook principle:** Show MORE data in LESS space. Don't waste vertical 
space on giant padding or decorative elements. A teacher should see their 
entire day without scrolling. An admin should see 6+ teacher rows without 
scrolling. A report table should show 15+ rows on desktop.

Compact mode for data-dense views:
- Table row height: 44px (touch target minimum)
- Card padding: 12–16px
- Section gap: 8px
- Font size in tables: 13px body, 11px meta


## INTERACTION PATTERNS

### Entry form — the most important screen

The entry form should feel like filling out a paper logbook — fast, 
familiar, minimal typing. Target: complete entry in 30 seconds.

**Flow:**
1. Tap timetable cell (or New Entry FAB)
2. Date, class, subject, period auto-fill from timetable
3. Module dropdown → select
4. Topic checkboxes → tap
5. Submit

**Optional fields** (collapsed by default):
- Attendance, engagement, objectives, family of situation, integration 
  activity, bilingual activity, lesson mode, assignment tracking, notes, 
  signature

**Collapsed section:** "More details ▾" — one line, tappable. Expands to 
show all optional fields. Remembers expansion state in localStorage.

### Report tables — the second most important screen

Report tables are where admins and inspectors spend 80% of their time.
They must be fast, filterable, and exportable.

**DataTable contract:**
- Search bar (full-text across key fields)
- Filter chips (dropdowns for categorical fields)
- Column sorting (tap header to sort)
- Column visibility toggle ("Columns" button)
- Pagination (cursor-based, 25 per page)
- CSV export (all data, all columns, proper formatting)
- Row click → entry detail panel

### Verification flow — the third most important

VP opens coordinator dashboard → sees bold/unread entries → taps one → 
reads the full entry → types remark → enters name (auto-suggested) → 
draws signature (optional) → taps "Verify" → entry turns green, teacher 
gets notified.

This should feel like signing a physical logbook: read, annotate, sign, 
done. No extra steps.


## COMPONENT LIBRARY

### Cards
```css
.card {
  background: var(--bg-elevated);
  border: 1px solid var(--border-primary);
  border-radius: 16px;
  padding: 16px;
  box-shadow: var(--shadow-card);
}
```

No nested cards. No cards inside cards. One level of elevation only.

### Status badges
```css
.badge-verified { background: rgba(16,185,129,0.1); color: #059669; }
.badge-submitted { background: rgba(245,158,11,0.1); color: #D97706; }
.badge-flagged { background: rgba(239,68,68,0.1); color: #DC2626; }
.badge-draft { background: rgba(168,162,158,0.1); color: #78716C; }
```

Always pill-shaped (border-radius: 999px), 10–11px font, 600 weight.

### Form inputs
```css
.input-field {
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 16px; /* prevents iOS zoom */
  font-family: var(--font-body);
  color: var(--text-primary);
  transition: border-color 150ms ease;
}
.input-field:focus {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--input-focus-ring);
}
```

### Empty states

Use emoji (not icons) for personality. Keep text to 2 lines max.
Background: subtle gradient tint matching the context.
Always offer a next action ("Log entry", "View timetable", "Catch up").

### Loading states

Skeleton screens that match the layout being loaded. Use 
var(--skeleton-base) with a subtle shimmer animation.
Never show a spinner in the middle of the page — always skeletons.

### Buttons

Primary: amber gradient, white text, 14px radius, 48px height.
Secondary: --bg-tertiary background, --text-secondary text.
Ghost: no background, --text-tertiary, appears on hover/tap.
Destructive: red-500/10 background, red-600 text.

Only ONE primary button per screen. Everything else is secondary or ghost.


## DARK MODE RULES

1. Every element uses CSS variables. No hardcoded hex values in components.
2. Semantic colors (green/amber/red) use `rgba(color, 0.1)` backgrounds 
   that work on both surfaces.
3. Gradient headers use `var(--header-from/via/to)` — different in light 
   vs dark.
4. Cards in dark mode: --bg-elevated (#1C1917) on --bg-primary (#0C0A09). 
   The contrast is subtle — cards float, they don't pop.
5. Text hierarchy in dark mode: primary = near-white, secondary = warm 
   gray, tertiary = stone. Never cold blue-grays.
6. Borders: --border-primary (#44403C in dark). Visible but quiet.
7. Shadows: stronger in dark mode (deeper blacks) to maintain elevation.
8. Quick-action cards: use `rgba(iconColor, 0.08)` gradients, not 
   hardcoded pastel hex values.


## RESPONSIVE BEHAVIOR

| Breakpoint | Layout | Navigation | Tables |
|-----------|--------|-----------|--------|
| < 640px | Single column, full-width cards | Bottom nav (5 tabs) | Stacked cards or horizontal scroll |
| 640–1024px | Wider cards, 2-column where appropriate | Bottom nav | Scrollable table |
| > 1024px | Sidebar + main content area | Side nav (persistent) | Full table with all columns |

Tables on mobile: show 3–4 core columns, hide the rest. The "Columns" 
toggle lets users add columns back. Or use a card-per-row layout for 
mobile with expandable detail.
