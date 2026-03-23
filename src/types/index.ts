export type Role = "TEACHER" | "SCHOOL_ADMIN" | "REGIONAL_ADMIN";
export type EntryStatus = "DRAFT" | "SUBMITTED" | "VERIFIED" | "FLAGGED";
export type EngagementLevel = "LOW" | "MEDIUM" | "HIGH";
export type SchoolStatus = "PENDING" | "ACTIVE" | "SUSPENDED";
export type Language = "EN" | "FR";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  schoolId: string | null;
  regionId: string | null;
}

export interface SubjectWithTopics {
  id: string;
  name: string;
  code: string;
  category: string | null;
  topics: {
    id: string;
    name: string;
    classLevel: string;
    moduleNum: number | null;
    moduleName: string | null;
    orderIndex: number;
  }[];
}

export interface TopicRef {
  id: string;
  name: string;
  moduleName: string | null;
  moduleNum: number | null;
  subject?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface EntryWithRelations {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  moduleName: string | null;
  topicText: string | null;
  notes: string | null;
  objectives: string | null;
  signatureData: string | null;
  status: EntryStatus;
  studentAttendance: number | null;
  engagementLevel: EngagementLevel | null;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    photoUrl?: string | null;
  };
  class: {
    id: string;
    name: string;
    abbreviation: string | null;
    level: string;
  };
  topics: TopicRef[];
  assignment?: {
    id: string;
    subject: { id: string; name: string; code: string };
  } | null;
  timetableSlot?: {
    id: string;
    periodLabel: string;
    startTime: string;
    endTime: string;
  } | null;
}

export interface ClassOption {
  id: string;
  name: string;
  abbreviation: string | null;
  level: string;
  stream: string | null;
  section: string | null;
}

export interface AdminStats {
  totalTeachers: number;
  verifiedTeachers: number;
  unverifiedTeachers: number;
  pendingTeachers?: number;
  totalEntries: number;
  entriesThisMonth: number;
  entriesThisWeek: number;
  verifiedEntries: number;
  flaggedEntries: number;
  verifiedEntriesThisMonth?: number;
  flaggedEntriesThisMonth?: number;
  pendingEntriesThisMonth?: number;
  vpBreakdown?: Array<{
    id: string;
    title: string;
    levels: string[];
    name: string;
    entriesThisMonth: number;
    verifiedEntriesThisMonth: number;
    pendingEntriesThisMonth: number;
    flaggedEntriesThisMonth: number;
  }>;
  complianceRate: number;
  entriesBySubject: { subject: string; count: number }[];
  entriesByWeek: { week: string; count: number }[];
}

export interface TeacherWithStats {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  gender: string | null;
  photoUrl: string | null;
  isVerified: boolean;
  membershipStatus: "PENDING" | "ACTIVE";
  membershipId: string | null;
  createdAt: string;
  entryCount: number;
  entriesThisWeek: number;
  periodsPerWeek: number;
  lastEntry: string | null;
  subjects: string[];
  classes: string[];
  subjectClasses: { subject: string; classes: string[] }[];
}

export interface NotificationData {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  link: string | null;
  senderRole: string | null;
  schoolId: string | null;
  createdAt: string;
}

export interface RegionalStats {
  totalSchools: number;
  activeSchools: number;
  pendingSchools: number;
  totalTeachers: number;
  totalEntries: number;
  entriesThisMonth: number;
  complianceRate: number;
  schoolRankings: {
    id: string;
    name: string;
    code: string;
    teacherCount: number;
    entryCount: number;
    complianceRate: number;
  }[];
}

// ── v2.0 Types ───────────────────────────────────────────

export interface AcademicYearData {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  terms: TermData[];
}

export interface TermData {
  id: string;
  name: string;
  number: number;
  startDate: string;
  endDate: string;
}

export interface AuditLogEntry {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  actorId: string;
  actorRole: string;
  metadata: Record<string, unknown> | null;
  createdAt: string;
  actor?: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
  };
}

export interface DraftEntryData {
  id: string;
  teacherId: string;
  formData: Record<string, unknown>;
  slotId: string | null;
  lastSavedAt: string;
  expiresAt: string;
}

/** Standardized API response for success */
export interface ApiResponse<T> {
  data: T;
  meta?: {
    total: number;
    page: number;
    pageSize: number;
  };
}

/** Standardized API response for errors */
export interface ApiError {
  error: string;
  code: string;
  details?: Record<string, string[]>;
}

/** Teacher's timetable slot with entry status */
export interface SlotWithStatus {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  assignment: {
    id: string;
    subject: { id: string; name: string; code: string };
    class: { id: string; name: string; abbreviation: string | null; level: string };
  };
  status: "logged" | "current" | "upcoming" | "missed";
  entryId?: string;
}

/** Compliance calculation result */
export interface ComplianceData {
  entriesSubmitted: number;
  expectedEntries: number;
  rate: number; // 0-100
  period: "week" | "term" | "year";
}
