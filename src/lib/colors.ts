const SUBJECT_COLORS = [
  { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", accent: "bg-blue-500", hex: "#3B82F6" },
  { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", accent: "bg-emerald-500", hex: "#10B981" },
  { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", accent: "bg-purple-500", hex: "#8B5CF6" },
  { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", accent: "bg-amber-500", hex: "#F59E0B" },
  { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", accent: "bg-rose-500", hex: "#F43F5E" },
  { bg: "bg-cyan-50", border: "border-cyan-200", text: "text-cyan-700", accent: "bg-cyan-500", hex: "#06B6D4" },
  { bg: "bg-indigo-50", border: "border-indigo-200", text: "text-indigo-700", accent: "bg-indigo-500", hex: "#6366F1" },
  { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", accent: "bg-orange-500", hex: "#F97316" },
  { bg: "bg-teal-50", border: "border-teal-200", text: "text-teal-700", accent: "bg-teal-500", hex: "#14B8A6" },
  { bg: "bg-pink-50", border: "border-pink-200", text: "text-pink-700", accent: "bg-pink-500", hex: "#EC4899" },
];

/** Deterministic color assignment from a string (subject name/id) */
export function getSubjectColor(subjectIdOrName: string) {
  let hash = 0;
  for (let i = 0; i < subjectIdOrName.length; i++) {
    hash = subjectIdOrName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
}

/** Get a gradient bar color class for charts */
export function getBarGradient(index: number): string {
  const gradients = [
    "from-amber-500 to-amber-400",
    "from-emerald-500 to-emerald-400",
    "from-blue-500 to-blue-400",
    "from-purple-500 to-purple-400",
    "from-rose-500 to-rose-400",
    "from-cyan-500 to-cyan-400",
  ];
  return gradients[index % gradients.length];
}

export { SUBJECT_COLORS };
