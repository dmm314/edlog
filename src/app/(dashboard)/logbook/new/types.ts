export interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  assignment: {
    id: string;
    classId: string;
    className: string;
    classLevel: string;
    subjectId: string;
    subjectName: string;
  };
}

export interface TopicItem {
  id: string;
  name: string;
  classLevel: string;
  moduleNum: number | null;
  moduleName: string | null;
  orderIndex: number;
}

export interface SubjectWithTopics {
  id: string;
  name: string;
  code: string;
  topics: TopicItem[];
}

export interface AssignmentItem {
  id: string;
  class: { id: string; name: string; level: string; stream: string | null };
  subject: { id: string; name: string; code: string };
  division: { id: string; name: string } | null;
  timetableSlots: {
    id: string;
    day: number;
    period: string;
    time: string;
  }[];
}

export interface SubmittedEntryData {
  entryIds: string[];
  subject: string;
  module: string;
  topic: string;
  topics: string[];
  className: string;
  classNames: string[];
  date: string;
  periods: { period: string; time: string; duration: string }[];
  notes: string;
  objectives: string;
  attendance: string;
  engagement: string;
  isDraft: boolean;
  classDidNotHold: boolean;
  familyOfSituation: string;
  bilingualActivity: boolean;
  bilingualType: string;
  lessonMode: string;
  integrationActivity: string;
  assignmentGiven: boolean;
  assignmentDetails: string;
  assignmentReviewed: boolean | null;
}

export interface EntryFormState {
  // Step
  step: number;

  // Date & slot
  date: string;
  selectedSlotIds: string[];
  timetableSlotId: string | null;
  period: string;
  duration: string;

  // Class & subject
  classId: string;
  subjectId: string;
  assignmentId: string | null;
  additionalClassIds: string[];

  // Curriculum
  moduleName: string;
  topicText: string;
  selectedTopicIds: string[];
  classDidNotHold: boolean;

  // CBA
  familyOfSituation: string;
  familyOfSitEditing: boolean;
  familyOfSitCustom: boolean;
  availableFamilies: string[];
  metadataObjectives: string[];
  selectedObjectives: Record<string, string>;
  customObjective: string;
  showCustomObjectiveInput: boolean;
  loadingMetadata: boolean;
  integrationActivity: string;
  integrationLevel: string;
  integrationStatus: string;

  // Bilingual
  bilingualActivity: boolean;
  bilingualType: string;
  bilingualNote: string;

  // Lesson mode
  lessonMode: string;
  digitalTools: string[];

  // Assignment tracking
  assignmentGiven: boolean;
  assignmentDetails: string;
  assignmentReviewed: boolean | null;
  pendingAssignmentInfo: string | null;

  // Details
  notes: string;
  studentAttendance: string;
  engagementLevel: string;
  signatureData: string | null;
  showOptionalDetails: boolean;

  // UI state
  submitting: boolean;
  savingDraft: boolean;
  error: string;
  success: boolean;
  draftSaved: boolean;

  // Reflection
  reflectionText: string;
  reflectionSending: boolean;
  reflectionSent: boolean;
}

export type EntryFormAction =
  | { type: "SET_STEP"; step: number }
  | { type: "SET_DATE"; date: string }
  | { type: "SET_SELECTED_SLOT_IDS"; ids: string[] }
  | { type: "SET_TIMETABLE_SLOT_ID"; id: string | null }
  | { type: "SET_PERIOD"; period: string }
  | { type: "SET_DURATION"; duration: string }
  | { type: "SET_CLASS_ID"; classId: string }
  | { type: "SET_SUBJECT_ID"; subjectId: string }
  | { type: "SET_ASSIGNMENT_ID"; id: string | null }
  | { type: "SET_ADDITIONAL_CLASS_IDS"; ids: string[] }
  | { type: "SET_MODULE_NAME"; name: string }
  | { type: "SET_TOPIC_TEXT"; text: string }
  | { type: "SET_SELECTED_TOPIC_IDS"; ids: string[] }
  | { type: "SET_CLASS_DID_NOT_HOLD"; value: boolean }
  | { type: "SET_FAMILY_OF_SITUATION"; value: string }
  | { type: "SET_FAMILY_OF_SIT_EDITING"; value: boolean }
  | { type: "SET_FAMILY_OF_SIT_CUSTOM"; value: boolean }
  | { type: "SET_AVAILABLE_FAMILIES"; families: string[] }
  | { type: "SET_METADATA_OBJECTIVES"; objectives: string[] }
  | { type: "SET_SELECTED_OBJECTIVES"; objectives: Record<string, string> }
  | { type: "SET_CUSTOM_OBJECTIVE"; value: string }
  | { type: "SET_SHOW_CUSTOM_OBJECTIVE_INPUT"; value: boolean }
  | { type: "SET_LOADING_METADATA"; value: boolean }
  | { type: "SET_INTEGRATION_ACTIVITY"; value: string }
  | { type: "SET_INTEGRATION_LEVEL"; value: string }
  | { type: "SET_INTEGRATION_STATUS"; value: string }
  | { type: "SET_BILINGUAL_ACTIVITY"; value: boolean }
  | { type: "SET_BILINGUAL_TYPE"; value: string }
  | { type: "SET_BILINGUAL_NOTE"; value: string }
  | { type: "SET_LESSON_MODE"; value: string }
  | { type: "SET_DIGITAL_TOOLS"; tools: string[] }
  | { type: "SET_ASSIGNMENT_GIVEN"; value: boolean }
  | { type: "SET_ASSIGNMENT_DETAILS"; value: string }
  | { type: "SET_ASSIGNMENT_REVIEWED"; value: boolean | null }
  | { type: "SET_PENDING_ASSIGNMENT_INFO"; value: string | null }
  | { type: "SET_NOTES"; value: string }
  | { type: "SET_STUDENT_ATTENDANCE"; value: string }
  | { type: "SET_ENGAGEMENT_LEVEL"; value: string }
  | { type: "SET_SIGNATURE_DATA"; value: string | null }
  | { type: "SET_SHOW_OPTIONAL_DETAILS"; value: boolean }
  | { type: "SET_SUBMITTING"; value: boolean }
  | { type: "SET_SAVING_DRAFT"; value: boolean }
  | { type: "SET_ERROR"; value: string }
  | { type: "SET_SUCCESS"; value: boolean }
  | { type: "SET_DRAFT_SAVED"; value: boolean }
  | { type: "SET_REFLECTION_TEXT"; value: string }
  | { type: "SET_REFLECTION_SENDING"; value: boolean }
  | { type: "SET_REFLECTION_SENT"; value: boolean }
  | { type: "RESET_FORM" }
  | { type: "SELECT_SLOT"; classId: string; subjectId: string; assignmentId: string; slotId: string; period: string; duration: string }
  | { type: "CLEAR_SLOT_SELECTION" }
  | { type: "HANDLE_CLASS_CHANGE"; classId: string }
  | { type: "HANDLE_SUBJECT_CHANGE"; subjectId: string; assignmentId: string | null };

export function getDayOfWeek(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00");
  const jsDay = d.getDay();
  return jsDay === 0 ? 7 : jsDay;
}

export const DAY_NAMES = ["", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
