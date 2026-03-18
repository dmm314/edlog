# EDLOG DESIGN SPEC v4.0 — DYNAMIC ALIVE SYSTEM

## 1. Mission

Edlog is a mobile-first digital teaching logbook for Cameroonian schools. The frontend must now feel **alive, adaptive, and rewarding** while staying serious, fast, and instantly understandable for teachers working on low-end Android phones.

This version replaces the old warm-paper / amber-heavy system with a **single dynamic blue-cyan accent family** that shifts subtly by context. The product should feel closer to the responsiveness and energy of Facebook Feed, Instagram Feed, and Reels-era interaction design — but with classroom-grade focus, not entertainment noise.

### Core product outcomes
- Teachers should know the **one next action** within one second of opening the app.
- Every screen should feel **responsive to touch**: lift, pulse, ripple, shimmer, confirm.
- Information density should be high, but the accent system should stay **cohesive** and never become multicolored.
- The experience should feel **premium on modern devices** and still remain **30-second fast on Tecno Spark-class phones**.

---

## 2. Design Philosophy

### 2.1 Dynamic, not decorative
The new system is not about adding random color or motion. It is about making the interface feel context-aware:
- the same accent family shifts slightly by theme and state,
- surfaces adapt fluidly,
- priority items lift visually,
- live tasks pulse gently,
- feedback happens immediately.

### 2.2 One hue family at a time
The product uses **one primary accent family** built from Meta blue / cyan energy.
- Base anchor: `#0866FF`
- Allowed contextual hue drift: approximately `±15°`
- Shifts happen through CSS variables and HSL tokens, not hardcoded random colors.
- Semantic states may tint cards and chips, but the interface must still read as a **single-hue ecosystem**.

### 2.3 Quiet seriousness with addictive responsiveness
Edlog is not a toy. It serves teachers, heads of department, school admins, and regional teams. The UI should combine:
- WhatsApp-like familiarity,
- Linear-like fluid motion,
- Facebook-like density and feed rhythm,
- Instagram/Reels-like touch delight.

The product must feel **alive**, but never loud.

---

## 3. Color System

## 3.1 Accent system
All accent behavior is controlled via HSL variables.

### Base accent
- Base hue anchor: `216°`
- Base color reference: `#0866FF`
- Dynamic variants are derived from:
  - theme (`light` / `dark`)
  - intensity (`calm` / `vibrant`)
  - status shift (`draft`, `submitted`, `verified`, `flagged`)
  - live context (`current period`, `active nav`, `composer open`, etc.)

### Rules
- Never introduce a second unrelated brand hue.
- Never use old amber surfaces or cream paper backgrounds.
- Accent glow, border emphasis, and soft fills all derive from the accent variables.
- Use `color-mix()` with accent variables for borders, shadows, and frosted surfaces.

## 3.2 Surface system
Surfaces are adaptive neutrals, not paper and not cold enterprise gray.

### Light mode intent
- crisp white cards,
- airy blue-tinted neutrals,
- subtle luminosity,
- slight accent infusion in elevated layers.

### Dark mode intent
- deep navy-charcoal surfaces,
- floating cards,
- clearer accent glows,
- OLED-friendly contrast without harsh blue-gray fatigue.

### Surface hierarchy
1. `surface-canvas` — app background
2. `surface-primary` — sections / large blocks
3. `surface-secondary` — muted containers / controls
4. `surface-elevated` — cards and active sheets
5. `surface-float` — nav, overlays, composer states

## 3.3 Text system
- `text-primary` for titles and key data
- `text-secondary` for descriptions and supporting labels
- `text-tertiary` for metadata and timestamps
- `text-inverse` for content placed on accent or header surfaces

Text must remain readable under both intensity modes.

## 3.4 Semantic states
Semantic colors support status messaging, but should not overpower the single accent family.
- Success: verification / completion
- Warning: late / pending / caution
- Danger: flagged / failed / destructive
- Info: same family as primary accent

These states should mostly appear in:
- chips,
- icons,
- micro-status indicators,
- confirmation patterns.

---

## 4. Typography

Three fonts remain mandatory.

| Font | Role | Usage |
|---|---|---|
| Fraunces | Identity / display | Hero names, dashboard titles, reward moments |
| DM Sans | Primary UI text | Body copy, controls, nav, forms, cards |
| JetBrains Mono | Time and data | Timetable times, counters, status values, percentages |

### Rules
- Fraunces only for display moments, never dense UI labels.
- DM Sans is the default system voice.
- JetBrains Mono is for timing, numbers, and compact metadata.

---

## 5. Layout Principles

### Mobile-first shell
- Max width on mobile content: `480px`
- Minimum touch targets: `44px`
- Bottom nav always reachable with one thumb
- Primary action should stay close to the bottom half of the screen whenever possible

### One action per screen
Every screen needs a clear priority action.
Examples:
- Dashboard: log the current period
- Composer: continue to next step or submit
- Timetable: tap a slot
- Notices: open what is new
- Profile: update a setting

### Density with clarity
The system should support high information density without looking crowded.
Use:
- strong grouping,
- adaptive chips,
- micro-headings,
- mono timestamps,
- subtle separators,
- animated hierarchy instead of extra colors.

---

## 6. Motion System

Motion is a product feature. It should reinforce recency, status, priority, and success.

## 6.1 Approved motion types
- **Lift:** cards rise slightly on hover/tap/focus
- **Pulse:** active or live actions breathe subtly
- **Ripple:** double-tap / touch feedback on cards and timetable slots
- **Spring bounce:** celebratory confirmation, active composer moments, hero metric reveal
- **Shimmer:** loading skeletons and placeholder surfaces
- **Live update:** timestamps and current-state indicators subtly animate

## 6.2 Motion rules
- Prefer animating `transform`, `opacity`, and lightweight shadow changes.
- Respect `prefers-reduced-motion` globally.
- Do not animate layout-critical properties like width/height when avoidable.
- Motion should finish quickly and feel responsive under 60fps constraints.

## 6.3 Intensity modes
The system includes a **Dynamic Intensity** preference:
- `calm` — softer glow and reduced visual energy
- `vibrant` — stronger accent presence and more pronounced live-feel

Intensity affects:
- accent saturation,
- accent glow,
- pulse strength,
- overall perceived liveliness.

---

## 7. Screen Direction

## 7.1 Teacher dashboard / feed
The teacher dashboard is now a **live feed command center**.

### Required sections
1. Dynamic hero header
2. Quick actions row
3. Stories-style notices strip
4. Today’s schedule with live period emphasis
5. Weekly progress bars
6. Context card for next class
7. Recent entry feed

### Behavioral rules
- Current period card gets strongest emphasis.
- Logged cards look completed but remain visible.
- Notices should feel recent and horizontally thumbable.
- Entry cards should support double-tap ripple reactions.

## 7.2 Entry composer
The entry form should feel like a dynamic composer, not a bureaucratic sheet.

### Required experience goals
- Expand with spring-based transitions
- Strong use of auto-filled timetable context
- Subtle pulse for suggestion moments
- Skeletons / shimmer for topic loading
- Focus state should always make the current next action obvious

## 7.3 Timetable
- Slot cards must feel tappable and immediate.
- Current or upcoming periods should carry light accent energy.
- Tapping a slot should ripple and confirm the touch.

## 7.4 Notices
- Notices should behave like a stories rail:
  - horizontally scrollable,
  - strong first-glance titles,
  - unread items pulse subtly,
  - new items should feel fresh without feeling playful.

## 7.5 Bottom navigation
- Fixed, frosted, rounded container
- Active item glows and scales slightly
- Composer action is a floating hero control
- Thumb ergonomics are non-negotiable

## 7.6 Profile / Admin / Regional views
All supporting dashboards should inherit the same system:
- adaptive surfaces,
- dynamic cards,
- single-hue cohesion,
- soft feed-like spacing,
- animated counters and loading states,
- stronger hierarchy for the main action.

---

## 8. Component Guidance

## 8.1 Dynamic entry card
Must include:
- status-adaptive accent shift,
- elevated surface,
- top-edge accent beam,
- mono timestamp,
- double-tap ripple,
- responsive micro-actions,
- visible but restrained metadata.

## 8.2 Quick actions row
Must include:
- horizontal scroll on small screens,
- one primary pulsing action,
- fast captions,
- obvious next-step framing.

## 8.3 Skeletons and loading
Loading should feel intentional, never dead.
Use:
- shimmer,
- soft accent tint,
- rounded surfaces,
- staged reveal.

## 8.4 Focus states
Focus states should be visible and modern:
- accent ring,
- soft glow,
- no harsh browser-default outlines.

---

## 9. Technical Implementation Rules

- Use CSS custom properties in `globals.css` as the source of truth.
- Use Tailwind only as a consumer of tokens, not as a place for static theme decisions.
- Prefer pure CSS for context-aware accent shifts where possible.
- Use `next/image` and lazy-loading patterns for media when relevant.
- Maintain mobile-first constraints and low-end Android performance.
- Avoid heavyweight animation libraries unless strictly necessary.

### Performance requirements
- All key interactions must feel immediate on constrained devices.
- Motion must degrade gracefully under reduced-motion or low-power conditions.
- Avoid multi-layer blur overload on list-heavy screens.
- Keep shadows and glows efficient and restrained.

---

## 10. Anti-Patterns (Forbidden)

The following are now explicitly disallowed:
- old warm paper / cream backgrounds,
- amber-led primary branding,
- static accent hex values scattered across components,
- multi-hue rainbow chips and cards,
- flat cards with no motion hierarchy,
- oversized hero blocks that bury the main action,
- decorative animation with no informational purpose,
- tiny tap targets,
- desktop-first spacing on mobile.

---

## 11. Product References

This redesign should feel informed by:
- **Facebook Feed (2026):** dense but readable cards, responsive touch hierarchy, clear live surfaces
- **Facebook Reels UI:** fluid motion, quick reward loops, thumb-first engagement
- **Instagram Feed:** card polish, subtle interaction reward, fast visual scanning
- **Linear:** disciplined motion, frosted depth, premium restraint
- **WhatsApp:** immediacy, familiarity, very low cognitive load

The output should be unmistakably Edlog, but benchmark at that level of confidence and responsiveness.

---

## 12. Success Criteria

The redesign is successful when:
- a teacher instantly sees what to do next,
- the app feels faster than paper, not more complicated than paper,
- every important tap produces satisfying confirmation,
- the UI feels modern and alive without feeling childish,
- the system stays visually cohesive across teacher, admin, and regional experiences,
- the product feels worthy of daily use across schools in Cameroon.
