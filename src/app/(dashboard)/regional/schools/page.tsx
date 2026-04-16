"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Users,
  BookOpen,
  ChevronRight,
  ToggleLeft,
  ToggleRight,
  Search,
  Filter,
  X,
  GraduationCap,
} from "lucide-react";

interface SchoolItem {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  divisionId: string;
  division: string;
  principalName: string | null;
  principalPhone: string | null;
  admin: { name: string; email: string } | null;
  teacherCount: number;
  classCount: number;
  entryCount: number;
  createdAt: string;
}

interface DivisionOption {
  id: string;
  name: string;
}

export default function RegionalSchoolsPage() {
  const router = useRouter();
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [divisions, setDivisions] = useState<DivisionOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDivision, setFilterDivision] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const res = await fetch("/api/regional/schools");
      if (res.ok) {
        const data = await res.json();
        setSchools(data.schools);
        setDivisions(data.divisions);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function updateSchoolStatus(
    e: React.MouseEvent,
    schoolId: string,
    newStatus: "ACTIVE" | "SUSPENDED"
  ) {
    e.stopPropagation();
    setToggling(schoolId);
    try {
      const res = await fetch("/api/regional/schools", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ schoolId, status: newStatus }),
      });
      if (res.ok) {
        setSchools((prev) =>
          prev.map((s) =>
            s.id === schoolId ? { ...s, status: newStatus } : s
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setToggling(null);
    }
  }

  const filteredSchools = useMemo(() => {
    return schools.filter((s) => {
      const nameMatch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.code.toLowerCase().includes(searchQuery.toLowerCase());

      const divisionMatch =
        !filterDivision || s.divisionId === filterDivision;

      const statusMatch = !filterStatus || s.status === filterStatus;

      return nameMatch && divisionMatch && statusMatch;
    });
  }, [schools, searchQuery, filterDivision, filterStatus]);

  const sortedSchools = useMemo(() => {
    const statusOrder: Record<string, number> = { PENDING: 0, ACTIVE: 1, SUSPENDED: 2 };
    return [...filteredSchools].sort(
      (a, b) => statusOrder[a.status] - statusOrder[b.status]
    );
  }, [filteredSchools]);

  const hasActiveFilters = filterDivision || filterStatus;

  function clearFilters() {
    setFilterDivision("");
    setFilterStatus("");
    setSearchQuery("");
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))]";
      case "PENDING":
        return "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]";
      case "SUSPENDED":
        return "bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))]";
      default:
        return "bg-[hsl(var(--surface-tertiary))] text-[var(--text-secondary)]";
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      {/* Header */}
      <div className="bg-gradient-to-br from-[hsl(var(--accent))] to-[hsl(var(--accent-strong))] px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="page-shell">
          <Link
            href="/regional"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Manage Schools</h1>
          <p className="text-[var(--header-text-muted)] text-sm mt-0.5">
            {schools.length} school{schools.length !== 1 ? "s" : ""} in your
            region
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 page-shell space-y-4">
        {/* Search + Filter button */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-tertiary)]" />
            <input
              type="text"
              placeholder="Search by school name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 bg-[hsl(var(--surface-elevated))] border border-[var(--border-primary)] rounded-xl text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--accent)] focus:border-transparent"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
              hasActiveFilters
                ? "border-[var(--accent-muted)] text-[var(--accent-text)]"
                : "bg-[hsl(var(--surface-elevated))] border-[var(--border-primary)] text-[var(--text-secondary)] hover:bg-[hsl(var(--surface-tertiary))]"
            }`}
            style={hasActiveFilters ? { background: "var(--accent-soft)" } : undefined}
          >
            <Filter className="w-4 h-4" />
            {hasActiveFilters && (
              <span className="w-1.5 h-1.5 bg-[var(--accent)] rounded-full" />
            )}
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="card p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Filters</h4>
              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  className="text-xs text-[var(--accent-text)] font-medium flex items-center gap-1"
                >
                  <X className="w-3 h-3" />
                  Clear all
                </button>
              )}
            </div>
            <div>
              <label className="label-field">Division</label>
              <select
                value={filterDivision}
                onChange={(e) => setFilterDivision(e.target.value)}
                className="input-field"
              >
                <option value="">All divisions</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="label-field">Status</label>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input-field"
              >
                <option value="">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="PENDING">Pending</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        )}

        {/* Status summary */}
        <div className="flex gap-2">
          {[
            {
              label: "Active",
              count: schools.filter((s) => s.status === "ACTIVE").length,
              color: "bg-[hsl(var(--success)/0.15)] text-[hsl(var(--success))]",
            },
            {
              label: "Pending",
              count: schools.filter((s) => s.status === "PENDING").length,
              color: "bg-[hsl(var(--accent-soft))] text-[hsl(var(--accent-text))]",
            },
            {
              label: "Suspended",
              count: schools.filter((s) => s.status === "SUSPENDED").length,
              color: "bg-[hsl(var(--danger)/0.15)] text-[hsl(var(--danger))]",
            },
          ].map((item) => (
            <div
              key={item.label}
              className={`flex-1 rounded-xl px-3 py-2 text-center ${item.color}`}
            >
              <p className="text-lg font-bold">{item.count}</p>
              <p className="text-[10px] font-medium uppercase tracking-wide">
                {item.label}
              </p>
            </div>
          ))}
        </div>

        {/* Results count */}
        {(searchQuery || hasActiveFilters) && (
          <p className="text-xs text-[var(--text-tertiary)]">
            Showing {sortedSchools.length} of {schools.length} school
            {schools.length !== 1 ? "s" : ""}
          </p>
        )}

        {/* Schools List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-[var(--skeleton-base)] rounded w-1/2 mb-2" />
                <div className="h-3 bg-[var(--skeleton-base)] rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : sortedSchools.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-10 h-10 text-[var(--text-quaternary)] mx-auto mb-2" />
            <p className="text-[var(--text-tertiary)]">No schools found</p>
            {(searchQuery || hasActiveFilters) && (
              <button
                onClick={clearFilters}
                className="text-sm text-[var(--accent-text)] font-medium mt-2"
              >
                Clear filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSchools.map((school) => (
              <div
                key={school.id}
                className="card overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() =>
                  router.push(`/regional/schools/${school.id}`)
                }
              >
                <div className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-[var(--text-primary)] truncate">
                          {school.name}
                        </h4>
                        <span
                          className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full flex-shrink-0 ${getStatusBadge(
                            school.status
                          )}`}
                        >
                          {school.status}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {school.code} &middot; {school.division}
                        {school.schoolType
                          ? ` \u00b7 ${school.schoolType}`
                          : ""}
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] flex-shrink-0 mt-1" />
                  </div>

                  {/* Quick stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-[var(--text-tertiary)]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      {school.teacherCount} teachers
                    </span>
                    <span className="flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      {school.classCount} classes
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {school.entryCount} entries
                    </span>
                  </div>

                  {/* Action buttons - prevent navigation */}
                  <div className="mt-3 flex gap-2">
                    {school.status === "PENDING" && (
                      <button
                        onClick={(e) =>
                          updateSchoolStatus(e, school.id, "ACTIVE")
                        }
                        disabled={toggling === school.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.15)]"
                      >
                        {toggling === school.id ? (
                          "Approving..."
                        ) : (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />
                            Approve
                          </>
                        )}
                      </button>
                    )}
                    {school.status === "ACTIVE" && (
                      <button
                        onClick={(e) =>
                          updateSchoolStatus(e, school.id, "SUSPENDED")
                        }
                        disabled={toggling === school.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors bg-[hsl(var(--danger)/0.1)] text-[hsl(var(--danger))] hover:bg-[hsl(var(--danger)/0.15)]"
                      >
                        {toggling === school.id ? (
                          "Suspending..."
                        ) : (
                          <>
                            <ToggleRight className="w-3.5 h-3.5" />
                            Suspend
                          </>
                        )}
                      </button>
                    )}
                    {school.status === "SUSPENDED" && (
                      <button
                        onClick={(e) =>
                          updateSchoolStatus(e, school.id, "ACTIVE")
                        }
                        disabled={toggling === school.id}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 text-xs font-medium transition-colors bg-[hsl(var(--success)/0.1)] text-[hsl(var(--success))] hover:bg-[hsl(var(--success)/0.15)]"
                      >
                        {toggling === school.id ? (
                          "Activating..."
                        ) : (
                          <>
                            <ToggleLeft className="w-3.5 h-3.5" />
                            Activate
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
