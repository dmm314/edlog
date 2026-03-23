/**
 * English strings — All user-facing text in Edlog.
 * Phase 1: Extract strings for future bilingual support (EN/FR).
 * Phase 2: Add fr.ts with French translations.
 */

export const strings = {
  // ── Common ─────────────────────────────────────────────
  common: {
    appName: "Edlog",
    loading: "Loading...",
    save: "Save",
    cancel: "Cancel",
    delete: "Delete",
    edit: "Edit",
    submit: "Submit",
    confirm: "Confirm",
    back: "Back",
    next: "Next",
    search: "Search",
    filter: "Filter",
    export: "Export",
    refresh: "Refresh",
    retry: "Retry",
    close: "Close",
    yes: "Yes",
    no: "No",
    all: "All",
    none: "None",
    or: "or",
    and: "and",
    showMore: "Show more",
    showLess: "Show less",
    seeAll: "See all",
    noResults: "No results found",
    required: "Required",
    optional: "Optional",
  },

  // ── Navigation ─────────────────────────────────────────
  nav: {
    home: "Home",
    timetable: "Timetable",
    newEntry: "New",
    history: "History",
    profile: "Profile",
    dashboard: "Dashboard",
    entries: "Entries",
    teachers: "Teachers",
    reports: "Reports",
    classes: "Classes",
    subjects: "Subjects",
    assessments: "Assessments",
    announcements: "Announcements",
    settings: "Settings",
    signOut: "Sign out",
    notifications: "Notifications",
  },

  // ── Auth ────────────────────────────────────────────────
  auth: {
    signIn: "Sign in",
    signInTitle: "Sign in to your account",
    signUp: "Get Started",
    email: "Email",
    password: "Password",
    confirmPassword: "Confirm password",
    forgotPassword: "Forgot password?",
    noAccount: "Don't have an account?",
    hasAccount: "Already have an account?",
    invalidCredentials: "Invalid email or password",
    schoolCode: "School code",
  },

  // ── Teacher Portal ─────────────────────────────────────
  teacher: {
    greeting: (name: string) => `Good morning, ${name}`,
    todaysClasses: "Today's Classes",
    logNow: "Log Now",
    noClassesToday: "No classes today",
    enjoyRest: "Enjoy your rest.",
    weeklyProgress: "This week",
    dayStreak: "Day streak",
    loggedToday: "Logged today",
    recentEntries: "Recent",
    emptyLogbook: "Your logbook is empty",
    emptyLogbookAction: "Log your first class",
  },

  // ── Entry Form ─────────────────────────────────────────
  entry: {
    newEntry: "New Entry",
    editEntry: "Edit Entry",
    submitEntry: "Submit Entry",
    saveAsDraft: "Save as Draft",
    moduleAndTopic: "Module & Topic",
    lessonDetails: "Lesson Details",
    addLessonDetails: "+ Add lesson details",
    cbaFields: "CBA Fields",
    signatureAndSubmit: "Signature & Submit",
    signHere: "Sign here",
    clearSignature: "Clear",
    selectModule: "Select a module",
    selectTopic: "Select at least one topic",
    customTopic: "+ Custom topic",
    classDidNotHold: "Class did not hold",
    classDidNotHoldReason: "Reason class didn't hold",
    attendance: "Student attendance",
    engagement: "Engagement level",
    lessonMode: "Lesson mode",
    notes: "Notes",
    notesPlaceholder: "Optional: What went well? What would you change?",
    bilingualActivity: "Bilingual activity",
    integrationActivity: "Integration activity",
    assignmentGiven: "Assignment given",
    assignmentDetails: "Assignment details",
    assignmentReviewed: "Previous assignment reviewed",
  },

  // ── Entry Status ───────────────────────────────────────
  status: {
    draft: "Draft",
    submitted: "Submitted",
    verified: "Verified",
    flagged: "Flagged",
  },

  // ── Coordinator Portal ─────────────────────────────────
  coordinator: {
    pendingVerification: "Pending verification",
    todaysActivity: "Today's activity",
    teacherCompliance: "Teacher compliance",
    verify: "Verify",
    flag: "Flag",
    addRemark: "Add remark",
    remarkPlaceholder: "Add a remark (optional)",
    confirmVerification: "Confirm Verification",
    reasonForFlagging: "Reason for flagging",
    confirmFlag: "Confirm Flag",
    sendRemark: "Send Remark",
    allCaughtUp: "All caught up!",
    batchVerify: (count: number) => `Verify ${count} entries`,
  },

  // ── Admin Portal ───────────────────────────────────────
  admin: {
    attentionNeeded: "Attention needed",
    pendingTeachers: "pending teachers",
    unverifiedEntries: "unverified entries",
    flaggedEntries: "flagged entries",
    allClear: "All clear. Nothing needs attention.",
    complianceRate: "Compliance Rate",
    activeTeachers: "Active Teachers",
    entriesThisWeek: "Entries This Week",
    verificationRate: "Verification Rate",
    teacherActivity: "Teacher Activity",
    inviteTeacher: "Invite Teacher",
    sendReminder: "Send Reminder",
  },

  // ── Reports ────────────────────────────────────────────
  reports: {
    activity: "Activity",
    teacherReport: "Teachers",
    coverage: "Coverage",
    assessmentReport: "Assessments",
    assignments: "Assignments",
    exportCsv: "Export CSV",
    dateRange: "Date range",
    thisWeek: "This Week",
    thisMonth: "This Month",
    thisTerm: "This Term",
  },

  // ── Errors ─────────────────────────────────────────────
  errors: {
    connectionLost: "Connection lost",
    connectionLostDesc: "Check your internet and try again",
    somethingWrong: "Something went wrong",
    somethingWrongDesc: "We're looking into it. Try refreshing.",
    pageNotFound: "Page not found",
    pageNotFoundDesc: "This page doesn't exist or you don't have access.",
    goToDashboard: "Go to Dashboard",
  },

  // ── Offline ────────────────────────────────────────────
  offline: {
    indicator: "You're offline. Changes will sync when you're back online.",
    backOnline: "Back online. Syncing...",
  },

  // ── Empty States ───────────────────────────────────────
  empty: {
    noEntries: "No entries found",
    noTeachers: "No teachers yet",
    noNotifications: "No notifications",
    allCaughtUp: "You're all caught up.",
    inviteTeachers: "Invite teachers",
    logAClass: "Log a class",
    clearFilters: "Clear filters",
  },
} as const;

export type Strings = typeof strings;
