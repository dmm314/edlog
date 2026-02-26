"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Building2,
  Users,
  BookOpen,
  ChevronDown,
  ChevronUp,
  ToggleLeft,
  ToggleRight,
  Search,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SchoolItem {
  id: string;
  name: string;
  code: string;
  schoolType: string | null;
  status: "PENDING" | "ACTIVE" | "SUSPENDED";
  division: string;
  principalName: string | null;
  principalPhone: string | null;
  admin: { name: string; email: string } | null;
  teacherCount: number;
  entryCount: number;
  createdAt: string;
}

export default function RegionalSchoolsPage() {
  const [schools, setSchools] = useState<SchoolItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchSchools();
  }, []);

  async function fetchSchools() {
    try {
      const res = await fetch("/api/regional/schools");
      if (res.ok) {
        setSchools(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  async function toggleStatus(schoolId: string, currentStatus: string) {
    const newStatus = currentStatus === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
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
            s.id === schoolId
              ? { ...s, status: newStatus as SchoolItem["status"] }
              : s
          )
        );
      }
    } catch {
      // silently fail
    } finally {
      setToggling(null);
    }
  }

  const filteredSchools = schools.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.division.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const statusOrder = { PENDING: 0, ACTIVE: 1, SUSPENDED: 2 };
  const sortedSchools = [...filteredSchools].sort(
    (a, b) => statusOrder[a.status] - statusOrder[b.status]
  );

  function getStatusBadge(status: string) {
    switch (status) {
      case "ACTIVE":
        return "bg-green-50 text-green-700";
      case "PENDING":
        return "bg-amber-50 text-amber-700";
      case "SUSPENDED":
        return "bg-red-50 text-red-700";
      default:
        return "bg-slate-50 text-slate-700";
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-950 to-brand-800 px-5 pt-10 pb-6 rounded-b-2xl">
        <div className="max-w-lg mx-auto">
          <Link
            href="/regional"
            className="inline-flex items-center gap-1 text-white/70 hover:text-white text-sm mb-3"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-xl font-bold text-white">Manage Schools</h1>
          <p className="text-brand-400 text-sm mt-0.5">
            {schools.length} school{schools.length !== 1 ? "s" : ""} in your
            region
          </p>
        </div>
      </div>

      <div className="px-5 mt-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search schools..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
          />
        </div>

        {/* Status summary */}
        <div className="flex gap-2">
          {[
            {
              label: "Active",
              count: schools.filter((s) => s.status === "ACTIVE").length,
              color: "bg-green-100 text-green-700",
            },
            {
              label: "Pending",
              count: schools.filter((s) => s.status === "PENDING").length,
              color: "bg-amber-100 text-amber-700",
            },
            {
              label: "Suspended",
              count: schools.filter((s) => s.status === "SUSPENDED").length,
              color: "bg-red-100 text-red-700",
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

        {/* Schools List */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-200 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : sortedSchools.length === 0 ? (
          <div className="text-center py-8">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">No schools found</p>
            {searchQuery && (
              <p className="text-sm text-slate-400 mt-1">
                Try adjusting your search
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {sortedSchools.map((school) => {
              const isExpanded = expandedId === school.id;
              return (
                <div key={school.id} className="card overflow-hidden">
                  {/* School header row */}
                  <button
                    onClick={() =>
                      setExpandedId(isExpanded ? null : school.id)
                    }
                    className="w-full p-4 text-left"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold text-slate-900 truncate">
                            {school.name}
                          </h4>
                          <span
                            className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-full ${getStatusBadge(
                              school.status
                            )}`}
                          >
                            {school.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400">
                          {school.code} &middot; {school.division}
                          {school.schoolType ? ` &middot; ${school.schoolType}` : ""}
                        </p>
                      </div>
                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0 mt-1" />
                      )}
                    </div>

                    {/* Quick stats */}
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        {school.teacherCount} teachers
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {school.entryCount} entries
                      </span>
                    </div>
                  </button>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-slate-100">
                      <div className="mt-3 space-y-2 text-sm">
                        {school.principalName && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Principal</span>
                            <span className="text-slate-700 font-medium">
                              {school.principalName}
                            </span>
                          </div>
                        )}
                        {school.principalPhone && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Phone</span>
                            <span className="text-slate-700">
                              {school.principalPhone}
                            </span>
                          </div>
                        )}
                        {school.admin && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Admin</span>
                            <span className="text-slate-700 text-right">
                              <span className="font-medium">
                                {school.admin.name}
                              </span>
                              <br />
                              <span className="text-xs text-slate-400">
                                {school.admin.email}
                              </span>
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between">
                          <span className="text-slate-400">Registered</span>
                          <span className="text-slate-700">
                            {formatDate(school.createdAt)}
                          </span>
                        </div>

                        {/* Toggle status button */}
                        <div className="pt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleStatus(school.id, school.status);
                            }}
                            disabled={
                              toggling === school.id ||
                              school.status === "PENDING"
                            }
                            className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                              school.status === "PENDING"
                                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                                : school.status === "ACTIVE"
                                ? "bg-red-50 text-red-600 hover:bg-red-100"
                                : "bg-green-50 text-green-600 hover:bg-green-100"
                            }`}
                          >
                            {toggling === school.id ? (
                              <span>Updating...</span>
                            ) : school.status === "PENDING" ? (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                Pending Activation
                              </>
                            ) : school.status === "ACTIVE" ? (
                              <>
                                <ToggleRight className="w-4 h-4" />
                                Suspend School
                              </>
                            ) : (
                              <>
                                <ToggleLeft className="w-4 h-4" />
                                Activate School
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
