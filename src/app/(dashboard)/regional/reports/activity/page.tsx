"use client";

import { useState } from "react";
import { DataTable } from "@/components/DataTable";
import type { ColumnDef } from "@/components/DataTable";
import {
  X,
  Calendar,
  BookOpen,
  Layers,
  FileText,
  MessageSquare,
  Send,
  Loader2,
} from "lucide-react";

interface ActivityRow {
  id: string;
  date: string;
  teacher: string;
  school: string;
  division: string;
  subject: string;
  class: string;
  level: string;
  moduleName: string;
  topicText: string;
  familyOfSituation: string;
  period: number | null;
  status: string;
  lessonMode: string;
  bilingual: string;
}

interface Remark {
  id: string;
  content: string;
  remarkType: string;
  authorRole: string;
  createdAt: string;
  author: {
    id: string;
    firstName: string;
    lastName: string;
    role: string;
    photoUrl: string | null;
  };
}

const columns: ColumnDef<ActivityRow>[] = [
  {
    key: "date",
    label: "Date",
    type: "date",
    sortable: true,
  },
  {
    key: "teacher",
    label: "Teacher",
    sortable: true,
    searchable: true,
  },
  {
    key: "school",
    label: "School",
    sortable: true,
    filterable: true,
  },
  {
    key: "division",
    label: "Division",
    filterable: true,
  },
  {
    key: "subject",
    label: "Subject",
    sortable: true,
    filterable: true,
  },
  {
    key: "class",
    label: "Class",
    hideOnMobile: true,
  },
  {
    key: "moduleName",
    label: "Module",
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "topicText",
    label: "Topic",
    searchable: true,
    hideOnMobile: true,
  },
  {
    key: "familyOfSituation",
    label: "Family of Situation",
    filterable: true,
    filterKey: "familyOfSituation",
    hideOnMobile: true,
  },
  {
    key: "status",
    label: "Status",
    type: "badge",
    filterable: true,
  },
  {
    key: "lessonMode",
    label: "Lesson Mode",
    filterable: true,
    filterKey: "lessonMode",
    hideOnMobile: true,
  },
  {
    key: "bilingual",
    label: "Bilingual",
    filterable: true,
    filterKey: "bilingual",
    hideOnMobile: true,
  },
];

const REMARK_COLORS: Record<string, { bg: string; text: string; border: string; bar: string; label: string }> = {
  self_reflection: { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", bar: "bg-emerald-500", label: "Teacher" },
  hod_review: { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500", label: "HOD" },
  admin_verification: { bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-500", label: "Admin" },
  inspector_note: { bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-500", label: "Inspector" },
};

export default function RegionalActivityReportPage() {
  const [selectedEntry, setSelectedEntry] = useState<ActivityRow | null>(null);
  const [remarks, setRemarks] = useState<Remark[]>([]);
  const [loadingRemarks, setLoadingRemarks] = useState(false);
  const [remarkText, setRemarkText] = useState("");
  const [sendingRemark, setSendingRemark] = useState(false);
  const [remarkError, setRemarkError] = useState("");

  async function openEntryDetail(entry: ActivityRow) {
    setSelectedEntry(entry);
    setRemarkText("");
    setRemarkError("");
    setLoadingRemarks(true);
    try {
      const res = await fetch(`/api/entries/${entry.id}/remarks`);
      if (res.ok) {
        setRemarks(await res.json());
      }
    } catch {
      // silently fail
    } finally {
      setLoadingRemarks(false);
    }
  }

  function closeModal() {
    setSelectedEntry(null);
    setRemarks([]);
    setRemarkText("");
    setRemarkError("");
  }

  async function sendRemark() {
    if (!remarkText.trim() || !selectedEntry) return;
    setSendingRemark(true);
    setRemarkError("");
    try {
      const res = await fetch(`/api/entries/${selectedEntry.id}/remarks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: remarkText.trim() }),
      });
      if (res.ok) {
        const newRemark = await res.json();
        setRemarks((prev) => [...prev, newRemark]);
        setRemarkText("");
      } else {
        const err = await res.json();
        setRemarkError(err.error || "Failed to send remark");
      }
    } catch {
      setRemarkError("Failed to connect to server");
    } finally {
      setSendingRemark(false);
    }
  }

  return (
    <>
      <DataTable<ActivityRow>
        columns={columns}
        endpoint="/api/regional/reports/activity"
        title="Teaching Activity"
        description="All logbook entries across your region. Click a row to view details and leave remarks."
        searchPlaceholder="Search by teacher, module, or topic..."
        defaultSort="date"
        defaultOrder="desc"
        exportFilename="regional-activity-report"
        emptyTitle="No entries found"
        emptyDescription="No logbook entries match your current filters."
        onRowClick={openEntryDetail}
      />

      {/* Entry Detail Modal */}
      {selectedEntry && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeModal}
          />
          <div className="relative w-full max-w-lg bg-[var(--bg-elevated)] rounded-t-2xl sm:rounded-2xl shadow-2xl max-h-[85vh] overflow-y-auto animate-slide-up">
            {/* Close button */}
            <button
              onClick={closeModal}
              className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>

            {/* Entry header */}
            <div className="px-5 pt-5 pb-4 bg-gradient-to-br from-purple-900 to-purple-800 rounded-t-2xl sm:rounded-t-2xl">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <span className="text-[10px] font-bold bg-white/15 text-white px-2 py-0.5 rounded-md">
                  {selectedEntry.subject}
                </span>
                <span className="text-[10px] font-semibold bg-white/10 text-white/80 px-2 py-0.5 rounded-md">
                  {selectedEntry.class}
                </span>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    selectedEntry.status === "VERIFIED"
                      ? "bg-emerald-500/20 text-emerald-300"
                      : selectedEntry.status === "FLAGGED"
                      ? "bg-red-500/20 text-red-300"
                      : "bg-blue-500/20 text-blue-300"
                  }`}
                >
                  {selectedEntry.status.charAt(0) +
                    selectedEntry.status.slice(1).toLowerCase()}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white mt-2">
                {selectedEntry.topicText || "No topic"}
              </h3>
              <div className="flex items-center gap-3 text-white/60 text-xs mt-2">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(selectedEntry.date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
                <span>{selectedEntry.teacher}</span>
              </div>
              <p className="text-white/50 text-xs mt-1">
                {selectedEntry.school} &middot; {selectedEntry.division}
              </p>
            </div>

            {/* Entry details */}
            <div className="p-5 space-y-3 border-b border-[var(--border-secondary)]">
              {selectedEntry.moduleName && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                      Module
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                      {selectedEntry.moduleName}
                    </p>
                  </div>
                </div>
              )}
              {selectedEntry.familyOfSituation && (
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <BookOpen className="w-3.5 h-3.5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--text-tertiary)]">
                      Family of Situation
                    </p>
                    <p className="text-sm text-[var(--text-secondary)] font-medium">
                      {selectedEntry.familyOfSituation}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                {selectedEntry.period && (
                  <div className="rounded-lg py-1.5 px-2.5 bg-[var(--bg-tertiary)]">
                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium">
                      Period
                    </p>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      P{selectedEntry.period}
                    </p>
                  </div>
                )}
                {selectedEntry.lessonMode && (
                  <div className="rounded-lg py-1.5 px-2.5 bg-[var(--bg-tertiary)]">
                    <p className="text-[9px] text-[var(--text-tertiary)] font-medium">
                      Lesson Mode
                    </p>
                    <p className="text-xs font-bold text-[var(--text-primary)]">
                      {selectedEntry.lessonMode.charAt(0).toUpperCase() +
                        selectedEntry.lessonMode.slice(1)}
                    </p>
                  </div>
                )}
                {selectedEntry.bilingual && selectedEntry.bilingual !== "No" && (
                  <div className="rounded-lg py-1.5 px-2.5 bg-amber-50">
                    <p className="text-[9px] text-amber-600 font-medium">
                      Bilingual
                    </p>
                    <p className="text-xs font-bold text-amber-700">
                      {selectedEntry.bilingual}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Remarks Section */}
            <div>
              <div className="px-5 py-3 border-b border-[var(--border-secondary)] flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                  Remarks
                </h3>
                {remarks.length > 0 && (
                  <span className="text-[10px] font-bold bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] px-1.5 py-0.5 rounded-full">
                    {remarks.length}
                  </span>
                )}
              </div>

              {loadingRemarks ? (
                <div className="p-5 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 animate-spin text-[var(--text-tertiary)]" />
                </div>
              ) : remarks.length === 0 ? (
                <div className="p-5 text-center">
                  <MessageSquare className="w-6 h-6 text-[var(--text-quaternary)] mx-auto mb-1" />
                  <p className="text-xs text-[var(--text-tertiary)]">
                    No remarks yet
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-[var(--border-secondary)]">
                  {remarks.map((remark) => {
                    const rc =
                      REMARK_COLORS[remark.remarkType] ||
                      REMARK_COLORS.self_reflection;
                    return (
                      <div key={remark.id} className="px-5 py-3 flex gap-3">
                        <div
                          className={`w-1 rounded-full self-stretch flex-shrink-0 ${rc.bar}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-semibold text-[var(--text-primary)]">
                              {remark.author.firstName} {remark.author.lastName}
                            </span>
                            <span
                              className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${rc.bg} ${rc.text} border ${rc.border}`}
                            >
                              {rc.label}
                            </span>
                            <span className="text-[10px] text-[var(--text-quaternary)]">
                              {new Date(remark.createdAt).toLocaleDateString(
                                "en-GB",
                                { day: "numeric", month: "short" }
                              )}{" "}
                              {new Date(remark.createdAt).toLocaleTimeString(
                                "en-GB",
                                { hour: "2-digit", minute: "2-digit" }
                              )}
                            </span>
                          </div>
                          <p className="text-sm text-[var(--text-secondary)] mt-1 whitespace-pre-wrap">
                            {remark.content}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Add inspector note */}
              <div className="px-5 py-3 border-t border-[var(--border-secondary)] bg-[var(--bg-tertiary)]">
                <label className="text-[10px] font-bold uppercase tracking-widest text-purple-600 flex items-center gap-1 mb-2">
                  <FileText className="w-3 h-3" />
                  Inspector Note
                </label>
                {remarkError && (
                  <p className="text-xs text-red-600 mb-2">{remarkError}</p>
                )}
                <div className="flex gap-2">
                  <textarea
                    value={remarkText}
                    onChange={(e) => setRemarkText(e.target.value)}
                    placeholder="Leave an observation on this entry..."
                    maxLength={1000}
                    rows={2}
                    className="flex-1 bg-[var(--bg-elevated)] border border-[var(--border-primary)] rounded-xl px-3 py-2 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-quaternary)] focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                  />
                  <button
                    onClick={sendRemark}
                    disabled={!remarkText.trim() || sendingRemark}
                    className="self-end w-10 h-10 bg-purple-600 text-white rounded-xl flex items-center justify-center shadow-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                  >
                    {sendingRemark ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--text-quaternary)] mt-1 text-right">
                  {remarkText.length}/1000
                </p>
              </div>
            </div>

            {/* Bottom safe area */}
            <div className="h-6" />
          </div>
        </div>
      )}
    </>
  );
}
