/**
 * Calculates how "complete" a logbook entry is across 7 key fields.
 * Returns a 0–100 score and a list of what's missing.
 */
export function getEntryCompleteness(entry: {
  moduleName?: string | null;
  topicText?: string | null;
  topics?: unknown[];
  familyOfSituation?: string | null;
  integrationActivity?: string | null;
  studentAttendance?: number | null;
  engagementLevel?: string | null;
  objectives?: unknown;
}): { score: number; missing: string[] } {
  const checks: [boolean, string][] = [
    [!!(entry.moduleName), "Module"],
    [!!(entry.topicText || (entry.topics && (entry.topics as unknown[]).length > 0)), "Topic"],
    [!!(entry.familyOfSituation), "Family of Situation"],
    [!!(entry.integrationActivity), "Integration Activity"],
    [entry.studentAttendance !== null && entry.studentAttendance !== undefined, "Attendance"],
    [!!(entry.engagementLevel), "Engagement"],
    [!!(entry.objectives), "Objectives"],
  ];

  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label);
  const filled = checks.filter(([ok]) => ok).length;
  return {
    score: Math.round((filled / checks.length) * 100),
    missing,
  };
}
