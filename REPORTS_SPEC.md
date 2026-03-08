# EDLOG DATABASE-DRIVEN REPORTS SYSTEM — DESIGN SPECIFICATION

Save this file in the repo root as `REPORTS_SPEC.md`.

---

## 1. What We're Building

Every school admin and regional admin gets a set of live database tables rendered directly in the web UI. These tables ARE the reporting system. There is no "generate report" button. There are no static spreadsheets. The data updates the instant a teacher submits a logbook entry.

Think of it as giving every admin their own Airtable — scoped to their school or region, populated automatically from teacher activity, and designed specifically for Cameroonian education workflows.

---

## 2. The Three User Perspectives

**Teacher (already built):** Logs entries. Sees their own timetable, history, and streak.

**School Admin:** Monitors their school. Their questions:
- "Which of my teachers are actively logging?"
- "What subjects and topics are being covered this term?"
- "Who hasn't logged this week?"
- "What percentage of the syllabus has been taught?"

**Regional Admin:** Monitors multiple schools. Their questions:
- "Which schools are active and which are silent?"
- "Show me all Physics teachers in Form 1 across the region and what they're covering."
- "Which topics in the national syllabus haven't been taught at any school?"
- "How does School A compare to School B in Physics Form 1 coverage?"

---

## 3. Core UI Component: DataTable

Every report is a DataTable — a single reusable component built ONCE and configured per table.

Features:
- **Search bar** — full-text search across visible columns
- **Filter panel** — dropdowns for each filterable dimension
- **Sortable column headers** — click to toggle asc/desc
- **Pagination** — cursor-based, server-side, 25 rows per page
- **Row count** — "Showing 1–25 of 1,247 teachers"
- **Export button** — CSV download with current filters applied
- **URL-driven state** — all filters, sort, search, and page live in URL query string (bookmarkable, shareable, back-button friendly)
- **Empty state** — friendly message when no results
- **Loading skeleton** — table-shaped shimmer while data loads
- **Mobile responsive** — horizontal scroll with first column sticky on small screens

### DataTable Props

```typescript
interface ColumnDef<T = Record<string, unknown>> {
  key: string;                    // Field key in data row
  label: string;                  // Display header
  sortable?: boolean;
  filterable?: boolean;
  filterKey?: string;             // API filter param key (defaults to key)
  filterOptions?: string[];       // Static options (otherwise dynamic from API)
  searchable?: boolean;
  type?: 'text' | 'number' | 'date' | 'badge' | 'custom';
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  hideOnMobile?: boolean;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  endpoint: string;               // API endpoint
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchable?: boolean;           // default true
  filterable?: boolean;           // default true
  exportable?: boolean;           // default true
  exportFilename?: string;
  defaultSort?: string;
  defaultOrder?: 'asc' | 'desc';
  pageSize?: number;              // default 25
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}
```

### DataTable Visual Layout

```
┌─────────────────────────────────────────────────┐
│  Title                              [Export CSV] │
│  Description                                     │
├─────────────────────────────────────────────────┤
│  [🔍 Search teachers, subjects...]               │
│                                                   │
│  Filters: [Division ▾] [Subject ▾] [Level ▾]    │
│           [Active filter chip ✕] [Clear all]     │
├─────────────────────────────────────────────────┤
│  Name ↕ │ School ↕ │ Subject │ Entries ↕ │ ...  │
│──────────┼──────────┼─────────┼───────────┼──── │
│  row 1   │          │         │           │      │
│  row 2   │          │         │           │      │
│  ...     │          │         │           │      │
├─────────────────────────────────────────────────┤
│  Showing 1–25 of 1,247        [← Prev] [Next →] │
└─────────────────────────────────────────────────┘
```

### DataTable Styling

- Title: var(--font-body) 18px weight-700
- Search: full width, 15px font, var(--input-border) border, amber focus ring, 14px radius
- Filter dropdowns: styled `<select>` elements. Active filters shown as amber chips below with ✕ to remove
- Table headers: var(--font-body) 12px weight-600, uppercase, letter-spacing 0.04em, var(--text-tertiary), sticky on scroll
- Table cells: var(--font-body) 14px, var(--text-primary), 12px 16px padding
- Numeric data: var(--font-mono)
- Alternating row backgrounds: var(--bg-elevated) / var(--bg-secondary)
- Pagination: "Showing X–Y of Z" left, Prev/Next buttons right
- Mobile (<640px): horizontal scroll, first column sticky

---

## 4. Universal API Contract

Every table follows the same API pattern.

**Request:**
```
GET /api/{role}/reports/{table}?
  search=<string>
  &sort=<column>
  &order=asc|desc
  &cursor=<string>
  &limit=25
  &filter[subject]=Physics
  &filter[division]=Fako
  &filter[level]=Form+1
  &filter[dateFrom]=2026-01-01
  &filter[dateTo]=2026-03-08
  &filter[status]=SUBMITTED
```

**Response:**
```json
{
  "data": [ ... rows ... ],
  "pagination": {
    "total": 1247,
    "limit": 25,
    "cursor": "base64encodedid",
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "subject": ["Physics", "Chemistry", "Biology"],
    "division": ["Fako", "Meme", "Manyu"],
    "level": ["Form 1", "Form 2", "Lower Sixth", "Upper Sixth"],
    "status": ["SUBMITTED", "VERIFIED", "FLAGGED"]
  }
}
```

The `filters` field returns available options for each filter dimension, populated dynamically from actual data. The frontend doesn't hardcode options.

---

## 5. School Admin Tables

Live at `/admin/reports/` with tab navigation.

### Table 1: Teachers (`/admin/reports/teachers`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Teacher Name | User.firstName + lastName | Yes | Search |
| Gender | User.gender | No | Dropdown |
| Phone | User.phone | No | No |
| Teacher Code | User.teacherCode | No | Search |
| Subjects | TeacherAssignment → Subject.name (comma-separated) | No | Dropdown |
| Classes | TeacherAssignment → Class.name (comma-separated) | No | Dropdown |
| Entries This Week | COUNT LogbookEntry where date ≥ Monday | Yes | No |
| Entries This Month | COUNT LogbookEntry where date ≥ 1st | Yes | No |
| Last Active | MAX LogbookEntry.date | Yes | No |
| Status | TeacherSchool.status | No | Dropdown |

Default sort: Last Active descending.

### Table 2: Teacher Assignments (`/admin/reports/assignments`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Teacher Name | User name | Yes | Search |
| Subject | Subject.name | Yes | Dropdown |
| Division | SubjectDivision.name | No | Dropdown |
| Class | Class.name | Yes | Dropdown |
| Level | Class.level | No | Dropdown |
| Periods/Week | COUNT TimetableSlot | Yes | No |

Default sort: Subject ascending.

### Table 3: Teaching Activity (`/admin/reports/activity`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Date | LogbookEntry.date | Yes | Date range |
| Teacher | User name | Yes | Dropdown |
| Subject | via Assignment → Subject.name | Yes | Dropdown |
| Class | Class.name | Yes | Dropdown |
| Level | Class.level | No | Dropdown |
| Module | LogbookEntry.moduleName | Yes | Search |
| Topic | LogbookEntry.topicText | Yes | Search |
| Period | LogbookEntry.period | Yes | No |
| Status | LogbookEntry.status | No | Dropdown |
| Engagement | LogbookEntry.engagementLevel | No | Dropdown |
| Attendance | LogbookEntry.studentAttendance | Yes | No |

Default sort: Date descending.

### Table 4: Curriculum Coverage (`/admin/reports/coverage`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Subject | Subject.name | Yes | Dropdown |
| Level | Topic.classLevel | No | Dropdown |
| Module | Topic.moduleName | Yes | No |
| Topic | Topic.name | Yes | Search |
| Taught By | Teachers who covered this topic | No | No |
| Times Covered | COUNT entries covering this topic | Yes | No |
| Last Taught | MAX entry date for this topic | Yes | No |
| Status | "Covered" or "Not Yet" | No | Dropdown |

Default sort: Subject ASC, then orderIndex ASC (follows syllabus order).

---

## 6. Regional Admin Tables

Live at `/regional/reports/` with tab navigation.

### Table 1: Schools (`/regional/reports/schools`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| School Name | School.name | Yes | Search |
| School Code | School.code | No | Search |
| Division | Division.name | Yes | Dropdown |
| Type | School.schoolType | No | Dropdown |
| Principal | School.principalName | No | Search |
| Teachers | COUNT active teachers | Yes | No |
| Entries This Week | COUNT entries this week | Yes | No |
| Entries This Month | COUNT entries this month | Yes | No |
| Compliance Rate | (entries / expected) × 100 | Yes | No |
| Status | School.status | No | Dropdown |

Default sort: Compliance Rate ascending (worst first — inspector finds problems).

### Table 2: Teachers (`/regional/reports/teachers`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Teacher Name | User name | Yes | Search |
| Gender | User.gender | No | Dropdown |
| School | School.name | Yes | Dropdown |
| Division | Division.name | Yes | Dropdown |
| Subjects | From assignments (comma-separated) | No | Dropdown |
| Classes | From assignments (comma-separated) | No | Dropdown (by level) |
| Entries This Month | COUNT | Yes | No |
| Last Active | MAX entry date | Yes | No |

Default sort: Last Active descending.

### Table 3: Teacher Assignments (`/regional/reports/assignments`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Teacher | User name | Yes | Search |
| School | School.name | Yes | Dropdown |
| Division | Division.name | Yes | Dropdown |
| Subject | Subject.name | Yes | Dropdown |
| Class | Class.name | Yes | No |
| Level | Class.level | No | Dropdown |

Default sort: School ASC, then Subject ASC.

### Table 4: Teaching Activity (`/regional/reports/activity`)

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Date | LogbookEntry.date | Yes | Date range |
| Teacher | User name | Yes | Search |
| School | School.name | Yes | Dropdown |
| Division | Division.name | Yes | Dropdown |
| Subject | Subject name | Yes | Dropdown |
| Class | Class name | Yes | Dropdown |
| Level | Class level | No | Dropdown |
| Module | LogbookEntry.moduleName | Yes | Search |
| Topic | LogbookEntry.topicText | Yes | Search |
| Status | LogbookEntry.status | No | Dropdown |

Default sort: Date descending.

### Table 5: Curriculum Coverage (`/regional/reports/coverage`)

Shows every topic in the national syllabus with regional coverage data.

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| Subject | Subject.name | Yes | Dropdown |
| Level | Topic.classLevel | Yes | Dropdown |
| Module | Topic.moduleName | Yes | Search |
| Topic | Topic.name | Yes | Search |
| Schools Covering | COUNT distinct schools with entries for this topic | Yes | No |
| Total Schools | COUNT schools teaching this subject at this level | No | No |
| Coverage Rate | (schoolsCovering / totalSchools) × 100 | Yes | No |
| Total Entries | COUNT all entries covering this topic | Yes | No |
| Teachers | COUNT distinct teachers | Yes | No |
| Last Taught | MAX entry date | Yes | No |

Filters: Subject, Level, Division, Module, Coverage Status (All / Covered / Gaps).
Default sort: Subject ASC, Level ASC, orderIndex ASC.

The "Coverage Rate" column renders as: "3/12 schools" with a colored mini progress bar (green ≥80%, amber ≥50%, red <50%).

Filtering to `covered=gaps` shows only topics where coverage < 100% — the inspector's most common workflow.

### Table 6: School Comparison (`/regional/reports/school-coverage`)

Compares schools side-by-side for a SPECIFIC subject and level.

**Requires** the inspector to select a subject and level first. Without both, show a prompt: "Select a subject and class level to compare schools."

| Column | Source | Sortable | Filterable |
|--------|--------|----------|------------|
| School | School.name | Yes | Search |
| Division | Division.name | Yes | Dropdown |
| Coverage | topicsCovered/totalTopics (%) | Yes | No |
| Teachers | COUNT distinct teachers for this subject+level | Yes | No |
| Entries | COUNT entries for this subject+level | Yes | No |
| Last Active | MAX entry date | Yes | No |
| Missing Topics | First 3-5 uncovered topic names | No | No |

Default sort: Coverage ascending (worst first).

The "Missing Topics" column shows: "Laws of Reflection, Wave Optics, +3 more" — or a green check + "Complete" if fully covered. This is what makes this table transformative: the inspector sees specific gaps per school at a glance.

---

## 7. Curriculum Data Architecture

### Where the Curriculum Lives

The national syllabus is stored in the `Topic` table:
- `subjectId` → links to `Subject` (Physics, Chemistry, etc.)
- `classLevel` → "Form 1", "Form 2", ..., "Lower Sixth", "Upper Sixth"
- `moduleNum` → numeric module order
- `moduleName` → "The World of Science", "Geometrical Optics", etc.
- `name` → specific topic name ("Laws of Reflection", "Definition of mass and SI units", etc.)
- `orderIndex` → syllabus order within the module

This was seeded from structured curriculum files (`prisma/seed/curriculum-physics.ts`, etc.). Physics Form 1 alone has 55 topics across 6 modules.

### How Entries Link to Curriculum

When a teacher creates a logbook entry, topics are recorded in TWO ways:

1. **Structured selection (direct link):** Teacher taps curriculum topic checkboxes in the entry form. This creates records in the `_EntryTopics` join table, directly linking `LogbookEntry` → `Topic`. High confidence — we know exactly which syllabus topic was taught.

2. **Free text only (no link):** Teacher types in the `topicText` field without selecting checkboxes. The entry also stores `moduleName` as a string. There is NO foreign key link to the `Topic` table. The coverage tables cannot count these directly.

### Coverage Query Strategy: Direct + Module Matching

To avoid undercounting, coverage queries must check BOTH paths:

**Path 1 — Direct match (high confidence):**
Entry is linked to Topic via `_EntryTopics` join table.

**Path 2 — Module match (medium confidence):**
Entry has no direct topic link, BUT:
- Entry's `moduleName` matches Topic's `moduleName` (case-insensitive)
- Entry's class level (via `Class.level`) matches Topic's `classLevel`
- Entry's teacher has a `TeacherAssignment` for the same subject and school

This catches teachers who select a module and type free text but don't tap the checkboxes.

**Transparency:** In the UI, topics matched via direct link show with full confidence (solid green indicator). Topics matched only via module-level match show with partial confidence (dashed or amber indicator with note: "Matched by module").

### SQL Pattern for Coverage

```sql
WITH direct_coverage AS (
  SELECT et."B" as topic_id, le."teacherId", u."schoolId", le.date, le.id as entry_id
  FROM "_EntryTopics" et
  JOIN "LogbookEntry" le ON le.id = et."A"
  JOIN "User" u ON u.id = le."teacherId"
  JOIN "School" s ON s.id = u."schoolId"
  WHERE s."regionId" = $regionId
),
module_coverage AS (
  SELECT t.id as topic_id, le."teacherId", u."schoolId", le.date, le.id as entry_id
  FROM "Topic" t
  JOIN "LogbookEntry" le ON LOWER(le."moduleName") = LOWER(t."moduleName")
  JOIN "User" u ON u.id = le."teacherId"
  JOIN "School" s ON s.id = u."schoolId"
  JOIN "TeacherAssignment" ta ON ta."teacherId" = u.id AND ta."subjectId" = t."subjectId" AND ta."schoolId" = s.id
  JOIN "Class" c ON c.id = le."classId" AND c.level = t."classLevel"
  WHERE s."regionId" = $regionId
    AND le.id NOT IN (SELECT et."A" FROM "_EntryTopics" et WHERE et."B" = t.id)
),
combined AS (
  SELECT * FROM direct_coverage
  UNION
  SELECT * FROM module_coverage
)
SELECT 
  t.id, t.name, t."classLevel", t."moduleNum", t."moduleName", t."orderIndex",
  sub.name as subject_name,
  COUNT(DISTINCT c."schoolId") as schools_covering,
  COUNT(DISTINCT c.entry_id) as total_entries,
  COUNT(DISTINCT c."teacherId") as teachers_covering,
  MAX(c.date) as last_taught
FROM "Topic" t
JOIN "Subject" sub ON sub.id = t."subjectId"
LEFT JOIN combined c ON c.topic_id = t.id
GROUP BY t.id, sub.name
```

Adapt for school-level queries by replacing the region scope with school scope.

---

## 8. Report Navigation

### School Admin: `/admin/reports/`

Tab bar:
| Tab | Route |
|-----|-------|
| Teachers | `/admin/reports/teachers` |
| Assignments | `/admin/reports/assignments` |
| Teaching Activity | `/admin/reports/activity` |
| Curriculum Coverage | `/admin/reports/coverage` |

### Regional Admin: `/regional/reports/`

Tab bar:
| Tab | Route |
|-----|-------|
| Schools | `/regional/reports/schools` |
| Teachers | `/regional/reports/teachers` |
| Assignments | `/regional/reports/assignments` |
| Teaching Activity | `/regional/reports/activity` |
| Curriculum | `/regional/reports/coverage` |
| School Comparison | `/regional/reports/school-coverage` |

---

## 9. Performance Considerations

- **Indexes:** Ensure indexes on `LogbookEntry(teacherId, date)`, `LogbookEntry(classId, date)`, `TeacherAssignment(schoolId)`, `TeacherAssignment(teacherId, schoolId)`, `User(schoolId, role)`, `School(regionId, divisionId)`.
- **Cursor pagination:** Use row ID as cursor, not offset. Offset degrades with large datasets.
- **No N+1 queries:** Use subqueries or CTEs for count columns (teacher count per school, entries per teacher). Never loop.
- **Aggregations in SQL:** Compute "Entries This Week," "Compliance Rate," etc. in the query, not in application code.
- **Cache filter options:** The `filters` response (available dropdown options) changes infrequently. Consider caching for 5 minutes.

---

## 10. Entry Form UI Improvement

To maximize structured topic selection (which makes coverage data more accurate):

- Make curriculum topic checkboxes MORE prominent in the entry form — primary interaction, larger tap targets.
- Add context: "Physics Form 1 · Module 3 · 12 topics in syllabus" above checkboxes.
- If teacher types free text but selects no checkboxes, show a subtle nudge: "Tip: Selecting topics from the curriculum above helps track syllabus progress."
- Keep free text as supplementary, NOT a replacement: label it "Additional notes on topic (optional)."
- Never make checkboxes mandatory — some teachers teach outside the standard curriculum.
