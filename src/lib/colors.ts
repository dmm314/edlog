/**
 * Dynamic accent-based subject color system.
 * Uses the single accent hue at varying opacities and lightness
 * instead of a multicolor rainbow palette.
 */

const ACCENT_VARIANTS = [
  { bg: "bg-accent/5", border: "border-accent/20", text: "text-accent-text", accent: "bg-accent", opacity: 1.0 },
  { bg: "bg-accent/8", border: "border-accent/15", text: "text-accent-text", accent: "bg-accent/90", opacity: 0.9 },
  { bg: "bg-accent/6", border: "border-accent/18", text: "text-accent-text", accent: "bg-accent/80", opacity: 0.8 },
  { bg: "bg-accent/4", border: "border-accent/12", text: "text-accent-text", accent: "bg-accent/70", opacity: 0.7 },
  { bg: "bg-accent/7", border: "border-accent/16", text: "text-accent-text", accent: "bg-accent/85", opacity: 0.85 },
  { bg: "bg-accent/5", border: "border-accent/14", text: "text-accent-text", accent: "bg-accent/75", opacity: 0.75 },
];

/** Deterministic color assignment from a string (subject name/id) */
export function getSubjectColor(subjectIdOrName: string) {
  let hash = 0;
  for (let i = 0; i < subjectIdOrName.length; i++) {
    hash = subjectIdOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return ACCENT_VARIANTS[Math.abs(hash) % ACCENT_VARIANTS.length];
}

/** Get a gradient bar color class for charts — all use accent at varying strengths */
export function getBarGradient(index: number): string {
  const gradients = [
    "from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))]",
    "from-[hsl(var(--accent)/0.9)] to-[hsl(var(--accent-strong)/0.9)]",
    "from-[hsl(var(--accent)/0.8)] to-[hsl(var(--accent-strong)/0.8)]",
    "from-[hsl(var(--accent)/0.7)] to-[hsl(var(--accent-strong)/0.7)]",
    "from-[hsl(var(--accent)/0.85)] to-[hsl(var(--accent-strong)/0.85)]",
    "from-[hsl(var(--accent)/0.75)] to-[hsl(var(--accent-strong)/0.75)]",
  ];
  return gradients[index % gradients.length];
}

// Keep old export name for compatibility
const SUBJECT_COLORS = ACCENT_VARIANTS;
export { SUBJECT_COLORS };
