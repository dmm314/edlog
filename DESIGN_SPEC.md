# EDLOG FRONTEND REDESIGN — THE DEFINITIVE ENGINEERING PROMPT

**Read this entire document before writing a single line of code.**

---

## PART 1: THE PROBLEM (Why We're Doing This)

Edlog is a digital curriculum logbook for Cameroonian secondary schools. Teachers, school admins, and regional inspectors use it. The backend is complete and works. The frontend does not match the ambition of this product.

Here is what is wrong with the current frontend, diagnosed specifically:

### The visual hierarchy is flat.

Open the teacher dashboard (`/logbook`). You see: a dark gradient header with "My Logbook" and three stat boxes (Today, This Week, This Month). Then a "New Entry" button. Then a schedule card. Then an unfilled periods card. Then recent entries.

The problem: everything has the same visual weight. The stat boxes are the same size, same color, same opacity. The schedule card looks identical to the unfilled periods card. The "New Entry" button is the most important action in the entire application and it's visually identical to every other accent-colored element. A teacher opening this app at 7:25am before first period has to *read* the screen to figure out what to do. They should be able to *glance* and know.

**The fix is not "make things bigger." The fix is: create a clear visual pecking order where the single most important action at any given moment screams at you, the second most important thing whispers, and everything else is furniture.**

### There is no personality.

The current UI uses the default Geist font, an indigo accent (#4f46e5), and a standard card-on-background layout. This is the same visual language as every SaaS dashboard built with Tailwind in the last three years. If you put the Edlog dashboard next to a generic project management app, they would be indistinguishable except for the text content.

Edlog is for teachers in Cameroon. It is competing against a physical paper logbook. The people using it range from 25 to 60 years old. Many are on budget Android phones with 720p screens. The app needs to feel warm, confident, and trustworthy — not like a Silicon Valley developer tool.

**The fix: a deliberately chosen palette (warm amber/stone instead of cold indigo), a type system with character (a serif display font for headings, a humanist sans for body, a monospace for data), and micro-moments of delight (streak animations, progress celebrations, smart contextual messages) that make the teacher feel like the app was built for them specifically.**

### The screens don't reward teachers for using it.

A paper logbook gives you one thing digital can't: the visual satisfaction of filled pages. You flip through and see your handwriting, your progress, your consistency. The current Edlog frontend gives you... a number. "12 entries this month." That's a spreadsheet, not a reward.

**The fix: build a streak system that makes consistency feel like an achievement. Show a "12-day streak" badge with a flame icon that bounces on load. Show a weekly progress chart where Monday through Friday fill up with color as the teacher logs. Show the syllabus completion percentage climbing. Make the success screen after submitting an entry feel like a small celebration, not a form confirmation. These are not gimmicks — they are the behavioral hooks that make teachers come back tomorrow instead of reverting to paper.**

---

## PART 2: THE DESIGN SYSTEM

### 2.1 Color Palette

Abandon indigo. The new primary accent is amber — warm, energetic, distinct.

**Light mode tokens:**
```
Background:
  --bg-primary:       #FAFAF9       stone-50 (warm white, not pure white)
  --bg-secondary:     #F5F5F4       stone-100
  --bg-elevated:      #FFFFFF       pure white (cards only)
  --bg-inset:         #F5F5F4       recessed areas

Text:
  --text-primary:     #1C1917       stone-900 (near-black, warm)
  --text-secondary:   #57534E       stone-600
  --text-tertiary:    #A8A29E       stone-400
  --text-muted:       #D6D3D1       stone-300

Borders:
  --border-primary:   #E7E5E4       stone-200
  --border-subtle:    #F5F5F4       stone-100

Accent (amber):
  --accent:           #F59E0B       amber-500
  --accent-hover:     #D97706       amber-600
  --accent-light:     rgba(245, 158, 11, 0.08)
  --accent-text:      #D97706       amber-600
  --accent-warm:      #FBBF24       amber-400 (gradient end)

Semantic:
  --success:          #16A34A       green-600
  --success-light:    #DCFCE7       green-100
  --danger:           #EF4444       red-500
  --danger-light:     #FEF2F2       red-50
```

**Dark mode:** Invert the stone scale. Accent becomes amber-400 (#FBBF24) for better contrast on dark backgrounds. Keep the same warmth — never go blue-gray. Use stone, not slate.

**Admin header variant:** The admin dashboard header uses a *cool* gradient (slate-900 → slate-700) instead of the warm stone gradient. This subtle difference signals "you are in a different role." Regional admin uses a deep teal or navy. Each role should feel distinct the moment the header loads.

**Why amber:** Amber is universally associated with warmth, energy, and attention. It works in both light and dark mode without losing saturation. It is distinct from every major EdTech product (Google Classroom = blue/green, Moodle = orange-red, Canvas = red). And it pairs beautifully with the stone neutral palette.

### 2.2 Typography

Three fonts. Each has a job. Never mix their jobs.

| Font | Job | Where |
|------|-----|-------|
| **Fraunces** (Google Fonts, variable, optical size) | Display & identity | Page titles ("My Logbook"), the Edlog wordmark, hero text on landing page. Weight 700-800. Gives Edlog a warm, authoritative voice. |
| **DM Sans** (Google Fonts, variable, optical size) | Everything else | Body text, buttons, labels, navigation, form fields, descriptions. Weight 400-800. Clean, legible at small sizes, excellent on low-res screens. |
| **JetBrains Mono** (Google Fonts) | Data & numbers | Times (7:30, 8:30), period labels (P1, P2), stats (87%), teacher codes (TCH-A1B2C3), counters. Weight 500-700. Makes numeric information instantly scannable. |

Load with `next/font/google`, `display: 'swap'`, and set as CSS variables (`--font-display`, `--font-body`, `--font-mono`).

**Critical rule: NEVER use Fraunces for anything smaller than 18px. It is a display font. If you're tempted to use it for a label or description, use DM Sans instead.**

### 2.3 Spacing, Radius, Shadows

**Radius:**
- Buttons, inputs: 14px
- Cards, modals: 16px
- Section containers: 20px
- Pills, chips, badges: 10px
- Circular elements (FAB, avatars): 50%

**Shadows — keep them light.** Many users are on IPS LCD panels where heavy shadows look like smudges:
```
--shadow-card:       0 1px 3px rgba(28, 25, 23, 0.04)
--shadow-lifted:     0 4px 12px -4px rgba(28, 25, 23, 0.08)
--shadow-accent:     0 4px 16px -4px rgba(245, 158, 11, 0.3)
--shadow-success:    0 4px 16px -4px rgba(22, 163, 74, 0.3)
```

### 2.4 Motion Principles

Every animation must answer: "What is this animation *communicating* to the teacher?" If the answer is "it looks cool," delete it.

- **Page load:** Cards stagger in (opacity 0→1, translateY 8→0, 400ms ease-out, 80ms delay per item). This communicates "content is arriving, the app is alive."
- **Streak counter:** Spring bounce on mount (scale 0.5→1.1→1, 500ms, cubic-bezier 0.34,1.56,0.64,1). This communicates "this number matters, celebrate it."
- **Progress bars:** Fill from 0% to target over 800ms with spring easing. This communicates "you earned this."
- **Button press:** scale(0.97) on :active, 80ms. This communicates "I received your tap."
- **Current period card:** A slow pulse on the amber border (2s cycle, subtle). This communicates "this is happening now, pay attention."

Wrap ALL animations in `@media (prefers-reduced-motion: reduce)` with instant alternatives. Test on a Tecno Spark 10 or Samsung Galaxy A14. If any animation drops below 60fps, simplify or remove it. Only animate `transform` and `opacity` — never `width`, `height`, `margin`, or `background-color`.

---

## PART 3: SCREEN SPECIFICATIONS

### 3.1 TEACHER DASHBOARD (`/logbook`)

**The single most important screen in the entire application.**

This is what a teacher sees every day. The current version treats it as a stats page. The redesign treats it as a **command center for today.**

**Layout, top to bottom:**

#### Header (dark warm gradient, stone-900 → stone-800)

Left side:
- "Good morning" in DM Sans 13px, stone-400. (Dynamically: morning/afternoon/evening.)
- Teacher's name in Fraunces 26px weight-700, white. (Pull from session. e.g., "Mr. Nkemnji".)

Right side:
- Notification bell icon (20px). If unread notifications exist, show an 8px amber dot on the top-right corner of the icon, with a 2px dark border so it doesn't bleed into the background.

Below the name, two stat pods sitting side by side:

**Pod 1 — Streak (THE KEY FEATURE):**
- Container: rounded-16px, amber tinted background (rgba(245,158,11,0.08)), 1px amber border (rgba(245,158,11,0.12))
- Left: 36px rounded-12px square with amber gradient (F59E0B → D97706), containing a lightning/zap icon (white, 16px). On mount, this square animates in with a spring bounce (scale 0.5 → 1).
- Right: "{N} days" in DM Sans 18px weight-800, amber-400 (#FBBF24). Below: "Logging streak" in DM Sans 11px, stone-400.
- If the streak is 0, show "Start a streak!" instead, in a muted style. Don't hide the pod — the empty state should motivate.

**Pod 2 — Syllabus Coverage:**
- Container: rounded-16px, subtle white-on-dark background (rgba(255,255,255,0.04)), 1px border (rgba(255,255,255,0.06))
- "{N}%" in DM Sans 20px weight-800, white. Below: "SYLLABUS" in DM Sans 10px, stone-600, uppercase, letter-spacing 0.05em.
- This tells the teacher: "You have covered N% of the topics assigned to you across all your classes." Calculate from the number of unique topics logged vs. total topics in assigned subjects/levels.

#### Main Content Area (scrollable, padding 16px horizontal, 90px bottom padding for nav)

**Section 1: Today's Schedule**

Header row: "Today — Wednesday" in DM Sans 14px weight-700, stone-900. Right-aligned: "2/5 logged" in DM Sans 12px, stone-400.

Below: a vertical list of period cards. Each card is a row with two columns:

**Left column (48px wide, flex-shrink-0):**
- Time in JetBrains Mono 12px weight-600 (e.g., "7:30"). Color depends on status: amber-600 for current period, stone-600 for everything else.
- "P{n}" below the time in DM Sans 10px, stone-400.

**Right column (the card itself):**
- White background, 16px radius, 14px horizontal + vertical padding.
- Top-left: Subject name in DM Sans 15px weight-700, stone-900.
- Below subject: Class name in DM Sans 13px, stone-600. If the entry is logged, append " · {module name}" in stone-400.

**Right side of the card depends on entry status:**

*If this period is already logged:*
- A 28px rounded-10px square with green-100 bg (#DCFCE7) containing a green check icon (16px, #16A34A).
- The entire card row gets `opacity: 0.55`. Not invisible — just clearly "done."

*If this is the CURRENT period (the period happening right now based on the clock and timetable start/end times):*
- The card gets: `border: 2px solid #F59E0B`, a subtle lifted shadow (shadow-accent), and a **3px amber gradient bar across the top edge** of the card (position absolute, top 0, left 0, right 0).
- Right side: An amber gradient button (F59E0B → D97706), rounded-12px, padding 6px 14px. Contains a pen/edit icon (14px) and "Log" text in DM Sans 12px weight-700, white. Shadow: shadow-accent.
- **This is the most important interactive element on the screen.** It must be impossible to miss. It should feel like the card is *asking* to be tapped.

*If this period is upcoming (hasn't started yet):*
- A 28px rounded-10px square with stone-100 bg, 2px dashed stone-300 border. Empty — a visual placeholder that says "not yet."

**Stagger animation:** Each card fades in with the fadeSlideIn animation (opacity 0→1, translateY 8→0), with 80ms delay between cards. First card appears at 0ms, second at 80ms, third at 160ms, etc.

**Edge case — weekend or no timetable:** Show a friendly empty state. An illustration or icon, "No classes today" text, and a link to view the full timetable or catch up on unfilled entries from the week.

**Edge case — all periods logged:** Show a celebratory state. Replace the schedule with a completion card: a large green check, "All caught up!" in Fraunces, and the streak counter prominently displayed. Make the teacher feel good about finishing.

**Section 2: Weekly Progress Chart**

Below the schedule. White card, 20px radius, 18px padding.
- Header: "This Week" left (DM Sans 13px weight-700, stone-900), "{X}/{Y} periods" right (DM Sans 12px, amber-600 weight-600).
- Chart: 5 vertical bars (Mon–Fri), each taking equal flex space, with 6px gap between them.
  - Each bar is 48px tall total, 10px border-radius.
  - Fill from bottom: green gradient (16A34A → 15803D) for fully completed days, amber gradient (F59E0B → D97706) for partially completed (today), stone-100 for future/empty days.
  - The fill height is proportional: (entries logged for that day / slots scheduled for that day) × 100%.
  - Day labels below each bar in JetBrains Mono 10px. Current day is weight-800, stone-900. Other days are weight-500, stone-400.
- Fill animation: bars grow from 0% to their actual height over 800ms with spring easing, staggered by 100ms per bar.

**Section 3: Quick Context Card (conditional)**

If the teacher's next class is within 2 hours, show a small card:
- "Next class in {time}" with subject and class details.
- This already exists in the current codebase (the `nextClassInfo` logic). Just make it visually distinct — perhaps a subtle left border accent.

---

### 3.2 NEW ENTRY FLOW (`/logbook/new`)

**Current problem:** The existing entry form is a single long scrollable page with all fields visible at once. Subject, class, period, module, topic, objectives, notes, attendance, engagement, signature, and two action buttons all compete for attention. A teacher sees a wall of inputs and their brain says "this is work." We need their brain to say "this is three taps."

**The redesign: a 3-step wizard.** Module → Topic → Details.

If the teacher arrived here by tapping "Log" on a specific period card from the dashboard, the subject, class, period, and time are ALREADY FILLED from the timetable context. The teacher does NOT need to re-select them. This is the happy path — optimize ruthlessly for it.

#### Persistent Header (stays visible across all 3 steps)

- Top bar: Back arrow (36px rounded-12px button, stone-100 bg, stone-600 icon) + "New Entry" in DM Sans 18px weight-700, stone-900. Right side: elapsed timer in JetBrains Mono (keep the existing timer — it's a good feature).

- **Auto-fill context card:** A warm amber card (gradient: FEF3C7 → FDE68A), 14px radius, 14px 16px padding. Contains:
  - Top line: "AUTO-FILLED FROM TIMETABLE" in DM Sans 10px weight-600, uppercase, letter-spacing 0.06em, amber-800 (#92400E).
  - Subject and class: "Physics — Lower Sixth Science A" in DM Sans 15px weight-700, stone-900.
  - Time: "Wed · Period 3 · 9:30–10:30" in JetBrains Mono 12px, stone-600.
  - Right side: A zap icon in a 44px rounded-14px white/translucent square, amber-600 color.
  - **This card communicates: "We already know what class you just taught. You don't need to tell us. Just tell us what topic."**
  - If the teacher navigated directly (not from a timetable slot), this card is replaced with dropdowns for class and subject selection.

- **Progress bar:** Three equal segments separated by 4px gaps. Each segment is a 4px-tall rounded bar. Completed steps: amber gradient fill. Current step: amber gradient fill. Future steps: stone-200.
  - Below each segment: step label in DM Sans 11px. Current step: weight-700, stone-900. Other steps: weight-500, stone-400.

#### Step 1: Module Selection

- Prompt: "Select the module you taught:" in DM Sans 13px, stone-600.
- List of modules for the selected subject and class level (pull from the Topic model, grouped by moduleName). Each module is a tappable card:
  - Left: 40px rounded-12px square with amber gradient bg (FEF3C7 → FDE68A), containing the module number in Fraunces 16px weight-700, amber-800.
  - Middle: Module name in DM Sans 15px weight-600, stone-900. Below: "{N} topics" in DM Sans 12px, stone-400.
  - Right: Chevron-right icon, stone-300.
  - Card: white bg, stone-200 border, 16px radius, 16px padding. On tap: border becomes amber, background gets a subtle amber tint, and the step advances.

#### Step 2: Topic Selection

- Breadcrumb: A small chip showing "Module {N}: {name}" in amber-100 bg, amber-500 border, DM Sans 12px weight-600, amber-800.
- Prompt: "What topic did you cover?" in DM Sans 13px, stone-600.
- **Primary input:** A text input field for free typing. 15px font, stone-200 border, amber focus ring. Placeholder: "e.g. Laws of reflection, image formation..."
  - This is the fast path. Many teachers will just type a few words.
- **Secondary option:** "OR SELECT FROM CURRICULUM" label (DM Sans 11px, stone-400, uppercase, letter-spacing 0.06em).
  - Below: a flex-wrap grid of curriculum topics as Chip components. Each chip: stone-100 bg, 12px radius, 8px 14px padding, DM Sans 13px weight-500, stone-600. Selected state: amber-100 bg, amber-500 border, amber-800 text.
  - Tapping a chip fills the text input with that topic name.
- **Continue button:** Full width, 16px padding, 16px radius. When topic is empty: stone-200 bg, stone-400 text (disabled look but still tappable). When topic has text: amber gradient (F59E0B → D97706), white text, shadow-accent. DM Sans 15px weight-700.

#### Step 3: Details & Submit

This is where optional extras live. Nothing here should feel mandatory.

- **Summary card:** White bg, stone-200 border, 16px radius, 16px padding. Four rows: Subject, Class, Module, Topic. Each row: label left (DM Sans 13px, stone-600), value right (DM Sans 13px, weight-600, stone-900). Rows separated by 1px stone-100 dividers.

- **Notes textarea** (optional): White card with stone-200 border. 3 rows. Placeholder: "Optional notes — objectives, observations..." DM Sans 14px.

- **Attendance + Engagement** (optional, side by side):
  - Attendance card: Label "Attendance" in DM Sans 11px weight-600, stone-400. Below: a large number input, JetBrains Mono 18px weight-700, centered in a stone-100 rounded-10px container.
  - Engagement card: Label "Engagement" in DM Sans 11px weight-600, stone-400. Below: three toggle buttons (High / Med / Low). Each button: flex-1, 10px padding, 10px radius. Default: stone-100 bg, stone-400 text. Selected High: green-100 bg, green-600 text. Selected Med: amber-100 bg, amber-600 text. Selected Low: red-100 bg, red-600 text. DM Sans 12px weight-600.

- **Submit button:** This is the CLIMAX of the entire user flow. The teacher has completed their entry. Make it feel like crossing a finish line.
  - Full width, 18px vertical padding, 16px radius.
  - Background: GREEN gradient (16A34A → 15803D). NOT amber — green signals "done, success, go."
  - Text: "Submit Entry" in DM Sans 16px weight-700, white. Check icon (18px) to the left of the text.
  - Shadow: shadow-success (green glow).
  - On :active, scale(0.97).
  - On tap: show a brief loading state (spinner replacing icon), then transition to success screen.

#### Success Screen

When the entry is submitted successfully:

- Full screen overlay. Background: green gradient (emerald-600 → emerald-500) for the top half, white for the bottom.
- Top section: A large white check icon inside a translucent circle (80px). Below: "Entry Logged!" in Fraunces 24px weight-700, white. Below: "Completed in {N} seconds" with the number in white bold.
- Bottom section: Entry summary (subject, class, module, topic, period, time) in a clean card.
- Two buttons: "New Entry" (primary, amber) and "Back to Dashboard" (secondary, stone border).
- **The teacher should see this screen and feel a tiny hit of satisfaction.** This is the dopamine that brings them back tomorrow.

---

### 3.3 ENTRY HISTORY (`/history`)

- **Filter bar** at the top: horizontal scroll of filter chips (All, This Week, This Month, by subject). Selected chip: amber fill. Unselected: stone-100.
- **Entries grouped by date.** Each date is a sticky header: "Wednesday, March 4" in DM Sans 13px weight-700, stone-900.
- **Each entry card:**
  - Left: Status indicator. Verified: 4px green left border. Submitted: 4px amber left border. Flagged: 4px red left border.
  - Content: Subject (DM Sans 14px weight-600, stone-900), class + module (13px, stone-600), time + period (12px, stone-400, JetBrains Mono).
  - Right: Status badge (pill shape, 10px radius). VERIFIED: green-100 bg, green-700 text. SUBMITTED: amber-100 bg, amber-700 text. FLAGGED: red-100 bg, red-700 text.
  - Tap to expand: notes, objectives, attendance, engagement, signature image.

---

### 3.4 TIMETABLE VIEW (`/timetable`)

- Full weekly grid. 5 columns (Mon–Fri), rows for each period.
- Column headers: Day abbreviations in DM Sans 11px weight-700. Current day column has an amber-100 background.
- Each cell: Subject abbreviation (e.g., "PHY") in DM Sans 12px weight-700, class abbreviation below (e.g., "F4A") in 10px weight-500.
- Color-code by subject. Assign deterministic colors based on subject ID (hash the ID to pick from a palette of 8-10 muted colors). This creates a visual "fingerprint" for the teacher's week that they'll learn to read at a glance.
- Current period cell: amber border (2px), pulsing subtly.
- Tap any cell → navigate to log entry for that slot, or view the entry if already logged.

---

### 3.5 SCHOOL ADMIN DASHBOARD (`/admin`)

The admin's job is: "Are my teachers logging? Who's falling behind? What needs my attention?" Every pixel on this screen must serve one of those questions.

#### Header (COOL gradient — slate-900 → slate-700, NOT warm stone)

- "School Admin" in DM Sans 12px weight-500, slate-400.
- School name in Fraunces 22px weight-700, white. (e.g., "GHS Limbe")
- Right side: Status pill — "Active" in green-400 text, green-400/10 bg, green-400/15 border. Or "Pending" in amber, "Suspended" in red.

**Three stat pods in a row** (equal width):
- Teachers count: large number in indigo-400 (#818CF8), label below in slate-500.
- Entries this week: large number in amber-400, label below.
- Compliance rate: large number in green-400, label below.
- Each pod: dark transparent bg (rgba 255,255,255,0.04), 14px radius, 1px border (rgba 255,255,255,0.06).

#### Quick Actions Grid (2×2)

Four cards, each with a *distinct* gradient background that makes them visually scannable:

| Card | Gradient | Icon Color | Title | Subtitle |
|------|----------|------------|-------|----------|
| Verify Entries | indigo-50 → indigo-100 | indigo-600 | Verify Entries | "{N} pending" |
| Timetable | green-50 → green-100 | green-600 | Timetable | "Up to date" or "{N} issues" |
| Reports | amber-50 → amber-100 | amber-600 | Reports | "Generate" |
| Teachers | rose-50 → rose-100 | rose-600 | Teachers | "{N} active" |

Each card: 16px radius, 16px padding. Icon on top (18px), title in DM Sans 14px weight-700, subtitle in 12px stone-600.

**The four different gradient colors are critical.** The current admin page uses the same accent-light color for every quick action card. They all look the same. The admin should be able to locate "Verify Entries" by muscle memory — "it's the purple one in the top-left."

#### Teacher Activity Section

White card, 20px radius, 18px padding.
- Header: "Teacher Activity" left, "View all →" right (amber-600, tappable).
- List of teachers. Each row:
  - **Avatar:** 36px rounded-12px square. Background: a light tint of the status color (green for ≥90% compliance, amber for ≥70%, red for <70%). Contains the teacher's last name initial in the status color, DM Sans 13px weight-700.
  - **Name + progress:** Name in DM Sans 13px weight-600, stone-900. Next to the name, right-aligned: "{entries}/{target}" in JetBrains Mono 12px weight-600, colored by status.
  - **Progress bar below name:** 6px height, stone-100 bg, rounded-full. Fill color: green gradient for ≥90%, amber gradient for ≥70%, red gradient for <70%. Fill width is (entries/target × 100)%. Animated on mount, staggered per row.
- Sort teachers by compliance (lowest first) so the admin immediately sees who needs attention.

#### Pending Verification Section

White card, 20px radius, 18px padding.
- Header: "Pending Verification" in DM Sans 14px weight-700.
- List of unverified entries. Each row:
  - Teacher name in DM Sans 14px weight-600, stone-900.
  - Subject + class + time ago in DM Sans 12px, stone-400.
  - Right side: Green check button (36px rounded-12px, green-100 bg, green-600 icon). One tap = verified.
- If many pending: show first 5 with a "View all {N} pending" link at the bottom.

---

### 3.6 REGIONAL ADMIN DASHBOARD (`/regional`)

The regional inspector oversees multiple schools. Their question: "Which schools are performing, and which need intervention?"

#### Header (deep teal/navy gradient — distinct from both teacher and admin)

Use a gradient like: slate-950 → teal-900 → slate-900. Or navy-950 → indigo-900. Something that reads "authority, oversight, government." The regional admin is often a government official.

- "Regional Inspector" in DM Sans 12px, teal-400.
- Region name in Fraunces 22px weight-700, white. (e.g., "South West Region")

**Stat pods:** Total Schools, Total Teachers, Average Compliance, Entries This Month. Four pods in a 2×2 grid.

#### School Rankings

The most important section. A ranked list of schools in the region, sorted by compliance rate (lowest first — the inspector needs to find problems).

Each school row:
- Rank number (JetBrains Mono, 14px weight-700). Color: green for top 25%, amber for middle 50%, red for bottom 25%.
- School name in DM Sans 14px weight-600.
- Compliance progress bar (same style as teacher activity bars in admin dashboard).
- Teacher count and entry count as small secondary metrics.
- Tap to drill into the full school detail view.

#### Registration Codes Section

Card showing active codes, used codes, and a "Generate New Code" button. The current implementation exists — just restyle it to match the new system.

---

### 3.7 LANDING PAGE (`/`)

The current landing page is actually decent in structure. Updates needed:

- Switch fonts to Fraunces (headings) + DM Sans (body).
- Switch accent to amber.
- Hero gradient: Use the warm stone gradient (1B1512 → 2D2420 → 3D322C) instead of the current slate.
- Add a subtle dot grid pattern overlay on the hero (opacity 0.03, white dots on dark bg) for texture.
- Trust indicators ("60s per entry", "40+ subjects", "100% mobile-first"): Animate them counting up from 0 when they scroll into view.
- The three role cards (Teacher, Admin, Regional): Give each a distinct icon color as specified in the current design, but use the new radius (16px) and type system.

### 3.8 AUTH PAGES (`/login`, `/register`)

- Centered card on a full-screen warm gradient (stone-900 → stone-800).
- Edlog logo (amber gradient square, 40px, rounded-14px) + "Edlog" in Fraunces 24px.
- Clean white card for the form. Generous padding (24px). 20px radius.
- Inputs: 16px font (CRITICAL — prevents iOS zoom), stone-200 border, 14px radius, amber focus ring.
- Primary button: amber gradient, full width.
- Registration code field on the register page: make it prominent. Larger font, perhaps a monospace font (JetBrains Mono) since codes look like codes. A subtle label: "Enter the registration code provided by your school or regional office."
- Error messages: red-500 text below the field, with a small alert icon. NEVER use alert() dialogs.

---

## PART 4: COMPONENT SPECIFICATIONS

Build these as reusable components in `src/components/ui/`. Every component uses CSS variables from the design tokens — never hardcode colors.

**Button:**
- Variants: `primary` (amber gradient + white text + shadow-accent), `secondary` (white bg + stone-200 border + stone-900 text), `ghost` (transparent + stone-600 text), `danger` (red-500 bg + white text), `success` (green gradient + white text + shadow-success).
- Sizes: `sm` (10px 16px padding, 13px text), `md` (14px 20px padding, 15px text), `lg` (18px 24px padding, 16px text).
- All variants: 14px radius, DM Sans weight-700, active:scale(0.97) with 80ms transition.
- Disabled: opacity 0.5, cursor-not-allowed, no hover/active effects.

**Card:**
- White bg (--bg-elevated), 1px stone-200 border, 16px radius, shadow-card.
- Hover state (desktop only): translateY(-1px), shadow-lifted. 200ms transition.

**Badge:**
- VERIFIED: green-100 bg, green-700 text. SUBMITTED: amber-100 bg, amber-700 text. FLAGGED: red-100 bg, red-700 text. DRAFT: stone-100 bg, stone-600 text.
- Pill shape (10px radius), DM Sans 11px weight-600, 4px 10px padding.

**ProgressBar:**
- Container: 6px height, stone-100 bg, rounded-full.
- Fill: rounded-full, gradient based on context (green for success, amber for progress, red for danger).
- Animated width on mount: 0% → target% over 800ms, spring easing.

**Chip:**
- Default: stone-100 bg, stone-600 text, transparent border.
- Selected: amber-100 bg, amber-700 text, amber-500 border.
- 12px radius, 8px 14px padding, DM Sans 13px weight-500.
- Toggleable. Tap to select/deselect.

**Skeleton:**
- Shimmer animation (left-to-right shine). Stone-100 base, white/translucent highlight.
- **Must match the exact dimensions and layout of the loaded content.** A skeleton for a period card must be the same height and width as an actual period card. Never use generic rectangles.

**Toast:**
- Bottom-center, 16px from bottom edge, 16px radius, max-width 90%.
- Success: green-600 bg, white text, check icon. Error: red-500 bg, white text, alert icon. Info: amber-500 bg, white text.
- Auto-dismiss after 3 seconds. Slide-up entrance, slide-down exit.

**EmptyState:**
- Centered in the available space. Large icon (48px) in stone-300. Title in DM Sans 16px weight-700, stone-900. Description in 14px, stone-500. Optional CTA button below.

---

## PART 5: BOTTOM NAVIGATION

The bottom nav is the app's skeleton. Three variants based on role:

**Teacher:**
| Tab | Icon | Label | Notes |
|-----|------|-------|-------|
| Home | House | Home | Links to /logbook |
| New Entry | Plus | New Entry | **HIGHLIGHTED — see below** |
| Timetable | Calendar | Timetable | Links to /timetable |
| History | Clock | History | Links to /history |
| Profile | User | Profile | Links to /profile |

**The "New Entry" tab is the FAB (Floating Action Button).** It is NOT a regular tab. It is a 48px circle with an amber gradient background (F59E0B → D97706), raised 12px above the nav bar, with a white plus icon (22px) and shadow-accent. Below the circle: "New Entry" label in DM Sans 10px weight-700, amber-600. This button must be the most tappable, most visible element in the nav. It's the primary action of the entire product.

**School Admin:**
| Tab | Icon | Label |
|-----|------|-------|
| Dashboard | Shield | Dashboard |
| Teachers | Users | Teachers |
| Timetable | Calendar | Timetable |
| Entries | Book | Entries |
| Profile | User | Profile |

**Regional Admin:**
| Tab | Icon | Label |
|-----|------|-------|
| Overview | Globe | Overview |
| Schools | Building | Schools |
| Reports | BarChart | Reports |
| Profile | User | Profile |

**Nav styling:**
- Fixed bottom, full width, z-50. Background: white with 0.95 opacity + backdrop-blur-xl. 1px top border (stone-200). Height: 68px + safe-area-inset-bottom.
- Active tab: icon and label in amber-600 (teacher) or indigo-600 (admin) or teal-600 (regional). Inactive: stone-400.
- Icon size: 20px. Label: DM Sans 10px. Active label: weight-700. Inactive: weight-500.

---

## PART 6: IMPLEMENTATION ORDER

**Phase 1 — Tokens & Components (2-3 days)**
Update globals.css, load fonts in layout.tsx, build/rebuild all UI components listed above. Deploy. The app will look "different" even before screens are rebuilt, because the palette and typography change everything.

**Phase 2 — Teacher Dashboard (3-4 days)**
The timetable-first layout, streak badge, weekly progress chart, stagger animations, skeleton states. This is the highest-impact screen.

**Phase 3 — Entry Flow (3-4 days)**
3-step wizard with auto-fill, curriculum chips, success overlay. The 60-second promise lives or dies here.

**Phase 4 — Admin Dashboard (2-3 days)**
Quick actions grid, teacher activity bars, pending verification one-tap, compliance visualization.

**Phase 5 — Everything Else (3-5 days)**
Regional dashboard, history page with filters, timetable grid, landing page refresh, auth pages, PWA theme update.

---

## PART 7: THE TEST

When this is done, show it to a teacher who has never seen Edlog. Hand them a phone. Say nothing.

If they can figure out what the app is, find today's schedule, and log an entry in under 90 seconds without any guidance — you succeeded.

If they smile when the success screen appears — you *really* succeeded.

If they open the app the next morning without being asked — you built something that matters.

---

*Edlog — Built by Darren Monyongo & Brayan Lontchi. Cameroon.*
