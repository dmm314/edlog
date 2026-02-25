export type Role = "TEACHER" | "SCHOOL_ADMIN" | "RPI_MEMBER";
export type EntryStatus = "DRAFT" | "SUBMITTED" | "VERIFIED" | "FLAGGED";

export interface SessionUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  schoolId: string | null;
}

export interface SubjectWithTopics {
  id: string;
  name: string;
  code: string;
  category: string | null;
  topics: {
    id: string;
    name: string;
    moduleNum: number | null;
    moduleName: string | null;
    orderIndex: number;
  }[];
}

export interface EntryWithRelations {
  id: string;
  date: string;
  period: number | null;
  duration: number;
  notes: string | null;
  objectives: string | null;
  signatureData: string | null;
  status: EntryStatus;
  createdAt: string;
  updatedAt: string;
  teacherId: string;
  teacher?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  class: {
    id: string;
    name: string;
    level: string;
  };
  topic: {
    id: string;
    name: string;
    moduleName: string | null;
    subject: {
      id: string;
      name: string;
      code: string;
    };
  };
}

export interface ClassOption {
  id: string;
  name: string;
  level: string;
  stream: string | null;
}

export interface AdminStats {
  totalTeachers: number;
  totalEntries: number;
  entriesThisMonth: number;
  entriesThisWeek: number;
  unverifiedTeachers: number;
  entriesBySubject: { subject: string; count: number }[];
  entriesByWeek: { week: string; count: number }[];
}

export interface TeacherWithStats {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  isVerified: boolean;
  createdAt: string;
  entryCount: number;
  lastEntry: string | null;
}
