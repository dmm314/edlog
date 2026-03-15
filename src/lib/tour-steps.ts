import type { TourStep } from "@/components/OnboardingTour";

export const TEACHER_TOUR: TourStep[] = [
  {
    target: "[data-tour='welcome']",
    title: "Welcome to Edlog! 👋",
    description: "This is your digital logbook. Let's take a quick tour so you know where everything is. It'll take 30 seconds.",
    position: "center",
  },
  {
    target: "[data-tour='streak']",
    title: "Your Logging Streak 🔥",
    description: "This tracks how many days in a row you've logged your lessons. Try to never break it!",
    position: "bottom",
  },
  {
    target: "[data-tour='today-schedule']",
    title: "Today's Classes",
    description: "Your timetable for today. When a class is done, tap 'Log' to record what you taught. It takes less than 60 seconds.",
    position: "top",
  },
  {
    target: "[data-tour='nav-new-entry']",
    title: "Log a New Entry ✏️",
    description: "The fastest way to record a lesson. Your class, subject, and period auto-fill from your timetable.",
    position: "top",
  },
  {
    target: "[data-tour='nav-timetable']",
    title: "Your Timetable",
    description: "See your full weekly schedule here. If you teach at multiple schools, all your classes appear in one place.",
    position: "top",
  },
  {
    target: "[data-tour='nav-history']",
    title: "Entry History",
    description: "All your past logbook entries. You'll also see feedback and remarks from your VP and HOD here.",
    position: "top",
  },
  {
    target: "[data-tour='nav-profile']",
    title: "Your Profile",
    description: "Your account, schools, settings, and appearance preferences. You can always replay this tour from here.",
    position: "top",
  },
];

export const COORDINATOR_TOUR: TourStep[] = [
  {
    target: "[data-tour='coordinator-welcome']",
    title: "Welcome, VP! 👋",
    description: "This is your level management portal. You'll review entries, verify lessons, and monitor teachers at your level.",
    position: "center",
  },
  {
    target: "[data-tour='coordinator-stats']",
    title: "Your Level at a Glance",
    description: "Key numbers for your level — entries to review, teachers active, verification progress. The 'To Review' count is your priority.",
    position: "bottom",
  },
  {
    target: "[data-tour='coordinator-pending']",
    title: "Entries to Review",
    description: "Unverified entries appear here. Tap any entry to read it, leave a remark, and verify it with your name.",
    position: "top",
  },
  {
    target: "[data-tour='nav-coordinator-entries']",
    title: "Entries Database",
    description: "Browse ALL entries for your level. Search, filter by teacher or subject, and review any entry in detail.",
    position: "top",
  },
  {
    target: "[data-tour='nav-coordinator-teachers']",
    title: "Teachers at Your Level",
    description: "See which teachers are assigned to your classes, how often they're logging, and who might need a nudge.",
    position: "top",
  },
  {
    target: "[data-tour='coordinator-mode-switch']",
    title: "Switch Modes",
    description: "You're also a teacher! Switch to Teacher mode to log your own entries, then come back to Coordinator mode to review others.",
    position: "bottom",
  },
];

export const ADMIN_TOUR: TourStep[] = [
  {
    target: "[data-tour='admin-welcome']",
    title: "Welcome, Admin! 👋",
    description: "This is your school command center. You'll manage teachers, timetables, and oversee everything happening at your school.",
    position: "center",
  },
  {
    target: "[data-tour='admin-stats']",
    title: "School Overview",
    description: "Your key numbers — total teachers, entries this week, and compliance rate. Green is good, amber needs attention, red needs action.",
    position: "bottom",
  },
  {
    target: "[data-tour='admin-quick-actions']",
    title: "Quick Actions",
    description: "Jump to common tasks. Each card is color-coded so you can find it at a glance.",
    position: "top",
  },
  {
    target: "[data-tour='admin-teacher-activity']",
    title: "Teacher Activity",
    description: "See which teachers are logging and who's falling behind. Teachers needing attention appear first.",
    position: "top",
  },
  {
    target: "[data-tour='nav-admin-teachers']",
    title: "Manage Teachers",
    description: "Add teachers, approve invitations, and see everyone at your school.",
    position: "top",
  },
  {
    target: "[data-tour='nav-admin-entries']",
    title: "Browse Entries",
    description: "View all logbook entries. Your VPs verify them — you oversee the process and can notify a VP if something needs attention.",
    position: "top",
  },
  {
    target: "[data-tour='nav-admin-timetable']",
    title: "School Timetable",
    description: "Set up and manage the timetable. Assign teachers to periods. The system prevents double-booking across schools.",
    position: "top",
  },
  {
    target: "[data-tour='nav-admin-profile']",
    title: "Profile & Settings",
    description: "Your school profile, VP management, reports, and announcements. You can replay this tour anytime from here.",
    position: "top",
  },
];

export const REGIONAL_TOUR: TourStep[] = [
  {
    target: "[data-tour='regional-welcome']",
    title: "Welcome, Inspector! 👋",
    description: "This is your regional oversight dashboard. Monitor schools, track curriculum delivery, and identify where attention is needed.",
    position: "center",
  },
  {
    target: "[data-tour='regional-stats']",
    title: "Regional Overview",
    description: "Total schools, teachers, and the average compliance rate across your region. These numbers update in real-time.",
    position: "bottom",
  },
  {
    target: "[data-tour='nav-regional-schools']",
    title: "Schools",
    description: "All schools in your region. Sorted by compliance — schools needing attention appear first.",
    position: "top",
  },
  {
    target: "[data-tour='nav-regional-reports']",
    title: "Reports & Data",
    description: "Live database tables — teachers, assignments, entries, curriculum coverage. Filter, search, and export anything you need.",
    position: "top",
  },
  {
    target: "[data-tour='nav-regional-profile']",
    title: "Your Profile",
    description: "Registration codes, announcements, and settings. You can replay this tour from here anytime.",
    position: "top",
  },
];
