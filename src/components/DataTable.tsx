"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, SearchX, Download, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, Columns3 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { HelpHint } from "@/components/HelpHint";
import { useDataTable, type DataTablePagination } from "@/hooks/useDataTable";

// ── Types ──────────────────────────────────────────────────────────

export interface ColumnDef<T = Record<string, unknown>> {
  key: string;
  label: string;
  sortable?: boolean;
  filterable?: boolean;
  filterKey?: string;
  filterOptions?: string[];
  searchable?: boolean;
  type?: "text" | "number" | "date" | "badge" | "custom";
  render?: (value: unknown, row: T) => React.ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  hideOnMobile?: boolean;
  defaultHidden?: boolean;
}

export interface DataTableProps<T = Record<string, unknown>> {
  columns: ColumnDef<T>[];
  endpoint: string;
  title: string;
  description?: string;
  searchPlaceholder?: string;
  searchable?: boolean;
  filterable?: boolean;
  exportable?: boolean;
  exportFilename?: string;
  defaultSort?: string;
  defaultOrder?: "asc" | "desc";
  pageSize?: number;
  onRowClick?: (row: T) => void;
  emptyTitle?: string;
  emptyDescription?: string;
  onDataLoad?: (data: T[], pagination: DataTablePagination) => void;
  createdAt?: string;
}

// ── Helpers ────────────────────────────────────────────────────────

const STATUS_VARIANT_MAP: Record<string, "verified" | "submitted" | "flagged" | "draft"> = {
  VERIFIED: "verified",
  SUBMITTED: "submitted",
  FLAGGED: "flagged",
  DRAFT: "draft",
  ACTIVE: "verified",
  PENDING: "submitted",
};

function formatDateCell(value: unknown): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value instanceof Date ? value : null;
  if (!d || isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function getNestedValue(obj: unknown, path: string): unknown {
  const keys = path.split(".");
  let current = obj;
  for (const k of keys) {
    if (current && typeof current === "object") {
      current = (current as Record<string, unknown>)[k];
    } else {
      return undefined;
    }
  }
  return current;
}

// ── Component ──────────────────────────────────────────────────────

export function DataTable<T = Record<string, unknown>>({
  columns,
  endpoint,
  title,
  description,
  searchPlaceholder = "Search...",
  searchable = true,
  filterable = true,
  exportable = true,
  exportFilename,
  defaultSort,
  defaultOrder = "asc",
  pageSize = 25,
  onRowClick,
  emptyTitle = "No results found",
  emptyDescription = "Try adjusting your search or filters.",
  onDataLoad,
  createdAt,
}: DataTableProps<T>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Debounced search
  const [searchInput, setSearchInput] = useState(searchParams.get("search") || "");
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Column visibility
  const [visibleColumns, setVisibleColumns] = useState<Set<string>>(() => {
    const defaults = new Set(columns.filter((c) => !c.defaultHidden).map((c) => c.key));
    if (typeof window === "undefined") return defaults;
    try {
      const stored = localStorage.getItem(`dt-cols-${title}`);
      if (stored) return new Set(JSON.parse(stored) as string[]);
    } catch { /* ignore */ }
    return defaults;
  });
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const columnToggleRef = useRef<HTMLDivElement>(null);

  function toggleColumn(key: string) {
    setVisibleColumns((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      try { localStorage.setItem(`dt-cols-${title}`, JSON.stringify(Array.from(next))); } catch { /* ignore */ }
      return next;
    });
  }

  // Close column dropdown on outside click
  useEffect(() => {
    if (!showColumnToggle) return;
    function handler(e: MouseEvent) {
      if (columnToggleRef.current && !columnToggleRef.current.contains(e.target as Node)) {
        setShowColumnToggle(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showColumnToggle]);

  const displayColumns = columns.filter((c) => visibleColumns.has(c.key));

  // Build endpoint with pageSize
  const endpointWithLimit = endpoint + (endpoint.includes("?") ? "&" : "?") + `limit=${pageSize}`;

  // Ensure defaults are in URL on mount
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    let changed = false;

    if (defaultSort && !params.has("sort")) {
      params.set("sort", defaultSort);
      changed = true;
    }
    if (defaultOrder && !params.has("order")) {
      params.set("order", defaultOrder);
      changed = true;
    }

    if (changed) {
      router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync search input when URL changes externally
  useEffect(() => {
    setSearchInput(searchParams.get("search") || "");
  }, [searchParams]);

  const { data, loading, error, pagination, filters, refetch } = useDataTable<T>(endpointWithLimit);

  useEffect(() => {
    if (!loading && data.length > 0 && onDataLoad) {
      onDataLoad(data, pagination);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, loading]);

  // ── URL update helper ───────────────────────────────────────────

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());

      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === "") {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }

      // Reset cursor when filters/search/sort change (unless cursor is being set)
      if (!("cursor" in updates)) {
        params.delete("cursor");
      }

      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  // ── Search ──────────────────────────────────────────────────────

  const handleSearchChange = (value: string) => {
    setSearchInput(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      updateParams({ search: value || null });
    }, 300);
  };

  const clearSearch = () => {
    setSearchInput("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    updateParams({ search: null });
  };

  // ── Sort ────────────────────────────────────────────────────────

  const currentSort = searchParams.get("sort") || defaultSort;
  const currentOrder = searchParams.get("order") || defaultOrder;

  const handleSort = (columnKey: string) => {
    if (currentSort === columnKey) {
      updateParams({ sort: columnKey, order: currentOrder === "asc" ? "desc" : "asc" });
    } else {
      updateParams({ sort: columnKey, order: "asc" });
    }
  };

  // ── Filters ─────────────────────────────────────────────────────

  const filterableColumns = columns.filter((col) => col.filterable);

  const activeFilters: { key: string; label: string; value: string }[] = [];
  filterableColumns.forEach((col) => {
    const filterKey = col.filterKey || col.key;
    const value = searchParams.get(`filter[${filterKey}]`);
    if (value) {
      activeFilters.push({ key: filterKey, label: col.label, value });
    }
  });

  const handleFilterChange = (filterKey: string, value: string) => {
    updateParams({ [`filter[${filterKey}]`]: value || null });
  };

  const removeFilter = (filterKey: string) => {
    updateParams({ [`filter[${filterKey}]`]: null });
  };

  const clearAllFilters = () => {
    const updates: Record<string, null> = { search: null };
    filterableColumns.forEach((col) => {
      updates[`filter[${col.filterKey || col.key}]`] = null;
    });
    updateParams(updates);
    setSearchInput("");
  };

  const hasActiveFilters = activeFilters.length > 0 || !!searchParams.get("search");

  // ── Pagination ──────────────────────────────────────────────────

  // Track cursor history for "Previous" navigation
  const cursorHistoryRef = useRef<string[]>([]);
  const currentCursor = searchParams.get("cursor");

  const handleNextPage = () => {
    if (pagination.hasNext && pagination.cursor) {
      // Push current cursor (or empty for first page) onto history
      cursorHistoryRef.current.push(currentCursor || "");
      updateParams({ cursor: pagination.cursor });
    }
  };

  const handlePrevPage = () => {
    const history = cursorHistoryRef.current;
    if (history.length > 0) {
      const prevCursor = history.pop()!;
      updateParams({ cursor: prevCursor || null });
    }
  };

  const hasPrev = cursorHistoryRef.current.length > 0 || pagination.hasPrev;

  // Calculate showing range
  const pageIndex = cursorHistoryRef.current.length;
  const start = pageIndex * pageSize + 1;
  const end = Math.min(start + data.length - 1, pagination.total);

  // ── Export ──────────────────────────────────────────────────────

  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams(searchParams.toString());
      params.set("format", "csv");
      params.delete("cursor");
      params.delete("limit");

      const separator = endpoint.includes("?") ? "&" : "?";
      const res = await fetch(`${endpoint}${separator}${params.toString()}`);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = (exportFilename || title.toLowerCase().replace(/\s+/g, "-")) + ".csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  // ── Cell rendering ──────────────────────────────────────────────

  const renderCell = (col: ColumnDef<T>, row: T) => {
    const value = getNestedValue(row, col.key);

    if (col.render) return col.render(value, row);

    switch (col.type) {
      case "number":
        return (
          <span style={{ fontFamily: "var(--font-mono)" }}>
            {value != null ? String(value) : "—"}
          </span>
        );
      case "date":
        return formatDateCell(value);
      case "badge": {
        const str = String(value || "");
        const variant = STATUS_VARIANT_MAP[str.toUpperCase()];
        if (variant) {
          return <Badge variant={variant}>{str}</Badge>;
        }
        return str || "—";
      }
      default:
        return value != null ? String(value) : "—";
    }
  };

  // ── Render ──────────────────────────────────────────────────────

  const isEmpty = !loading && !error && data.length === 0;

  return (
    <div
      style={{
        background: "hsl(var(--surface-elevated))",
        border: "1px solid var(--border-primary)",
        borderRadius: 16,
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div style={{ padding: "20px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 16 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <h2 style={{ fontFamily: "var(--font-body)", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                {title}
              </h2>
              {createdAt && (
                <HelpHint
                  text="Use the search bar to find records, filters to narrow results, and column headers to sort. Data updates as teachers log."
                  position="right"
                  createdAt={createdAt}
                />
              )}
            </div>
            {description && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 14, color: "var(--text-tertiary)", margin: "4px 0 0" }}>
                {description}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
            {/* Column toggle */}
            <div ref={columnToggleRef} style={{ position: "relative" }}>
              <button
                onClick={() => setShowColumnToggle((v) => !v)}
                className="btn-ghost"
                style={{ padding: "8px 14px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 6 }}
              >
                <Columns3 size={16} />
                Columns
              </button>
              {showColumnToggle && (
                <div
                  style={{
                    position: "absolute",
                    right: 0,
                    top: "calc(100% + 4px)",
                    zIndex: 50,
                    background: "hsl(var(--surface-elevated))",
                    border: "1px solid var(--border-primary)",
                    borderRadius: 12,
                    padding: "8px 4px",
                    boxShadow: "var(--shadow-elevated, 0 8px 32px rgba(0,0,0,0.12))",
                    minWidth: 200,
                    maxHeight: 280,
                    overflowY: "auto",
                  }}
                >
                  {columns.map((col) => (
                    <label
                      key={col.key}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        padding: "6px 12px",
                        cursor: "pointer",
                        borderRadius: 8,
                        fontSize: 14,
                        color: "var(--text-secondary)",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLLabelElement).style.background = "hsl(var(--surface-tertiary))"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLLabelElement).style.background = "transparent"; }}
                    >
                      <input
                        type="checkbox"
                        checked={visibleColumns.has(col.key)}
                        onChange={() => toggleColumn(col.key)}
                        style={{ accentColor: "var(--accent)" }}
                      />
                      {col.label}
                    </label>
                  ))}
                </div>
              )}
            </div>

            {exportable && (
              <button
                onClick={handleExport}
                disabled={exporting || loading}
                className="btn-ghost"
                style={{ padding: "8px 16px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}
              >
                <Download size={16} />
                {exporting ? "Exporting..." : "Export CSV"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Search */}
      {searchable && (
        <div style={{ padding: "16px 24px 0" }}>
          <div style={{ position: "relative" }}>
            <Search
              size={18}
              style={{
                position: "absolute",
                left: 14,
                top: "50%",
                transform: "translateY(-50%)",
                color: "var(--text-quaternary)",
                pointerEvents: "none",
              }}
            />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={searchPlaceholder}
              className="input-field"
              style={{
                width: "100%",
                paddingLeft: 42,
                paddingRight: searchInput ? 42 : 14,
                fontSize: 15,
              }}
            />
            {searchInput && (
              <button
                onClick={clearSearch}
                style={{
                  position: "absolute",
                  right: 10,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--text-quaternary)",
                  display: "flex",
                }}
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Filters */}
      {filterable && filterableColumns.length > 0 && (
        <div style={{ padding: "12px 24px 0" }}>
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 10,
            }}
            className="data-table-filters"
          >
            {filterableColumns.map((col) => {
              const filterKey = col.filterKey || col.key;
              const options = col.filterOptions || filters[filterKey] || [];
              const currentValue = searchParams.get(`filter[${filterKey}]`) || "";

              return (
                <select
                  key={filterKey}
                  value={currentValue}
                  onChange={(e) => handleFilterChange(filterKey, e.target.value)}
                  className="input-field"
                  style={{ width: "auto", minWidth: 140, fontSize: 14, padding: "8px 12px" }}
                >
                  <option value="">{col.label}</option>
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              );
            })}
          </div>

          {/* Active filter chips */}
          {activeFilters.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 10, alignItems: "center" }}>
              {activeFilters.map(({ key, label, value }) => (
                <span
                  key={key}
                  className="chip chip-selected"
                  style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
                >
                  {label}: {value}
                  <button
                    onClick={() => removeFilter(key)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, display: "flex", color: "inherit" }}
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
              <button
                onClick={clearAllFilters}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--accent)",
                  fontWeight: 600,
                  padding: "4px 0",
                }}
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error state */}
      {error && (
        <div style={{ padding: "48px 24px", textAlign: "center" }}>
          <AlertCircle size={48} style={{ color: "var(--text-quaternary)", margin: "0 auto 16px" }} />
          <p style={{ color: "var(--text-secondary)", fontSize: 16, margin: "0 0 16px" }}>{error}</p>
          <button onClick={refetch} className="btn-secondary" style={{ padding: "8px 20px", fontSize: 14, display: "inline-flex", alignItems: "center", gap: 8 }}>
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && !error && (
        <div style={{ padding: "16px 24px 24px" }}>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {displayColumns.map((col) => (
                    <th
                      key={col.key}
                      style={{
                        fontFamily: "var(--font-body)",
                        fontSize: 12,
                        fontWeight: 600,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "var(--text-tertiary)",
                        textAlign: (col.align || (col.type === "number" ? "right" : "left")) as React.CSSProperties["textAlign"],
                        padding: "12px 16px",
                        borderBottom: "1px solid var(--border-primary)",
                        whiteSpace: "nowrap",
                        width: col.width,
                      }}
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {displayColumns.map((col) => (
                      <td key={col.key} style={{ padding: "12px 16px" }}>
                        <div className="skeleton" style={{ height: 16, width: col.width || "80%", borderRadius: 6 }} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state */}
      {isEmpty && (
        <div style={{ padding: "64px 24px", textAlign: "center" }}>
          <SearchX size={48} style={{ color: "var(--text-quaternary)", margin: "0 auto 16px" }} />
          <h3 style={{ color: "var(--text-secondary)", fontSize: 16, fontWeight: 600, margin: "0 0 8px" }}>
            {emptyTitle}
          </h3>
          <p style={{ color: "var(--text-tertiary)", fontSize: 14, margin: "0 0 20px" }}>
            {emptyDescription}
          </p>
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="btn-secondary"
              style={{ padding: "8px 20px", fontSize: 14 }}
            >
              Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Table */}
      {!loading && !error && data.length > 0 && (
        <>
          <div style={{ padding: "16px 24px 0", overflowX: "auto" }} className="data-table-scroll">
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  {displayColumns.map((col, colIndex) => {
                    const isActive = currentSort === col.key;
                    const align = col.align || (col.type === "number" ? "right" : "left");

                    return (
                      <th
                        key={col.key}
                        onClick={col.sortable ? () => handleSort(col.key) : undefined}
                        className={col.hideOnMobile ? "data-table-hide-mobile" : ""}
                        style={{
                          fontFamily: "var(--font-body)",
                          fontSize: 12,
                          fontWeight: 600,
                          textTransform: "uppercase",
                          letterSpacing: "0.04em",
                          color: isActive ? "var(--text-primary)" : "var(--text-tertiary)",
                          textAlign: align as React.CSSProperties["textAlign"],
                          padding: "12px 16px",
                          borderBottom: "1px solid var(--border-primary)",
                          whiteSpace: "nowrap",
                          cursor: col.sortable ? "pointer" : "default",
                          userSelect: col.sortable ? "none" : undefined,
                          width: col.width,
                          position: colIndex === 0 ? "sticky" : undefined,
                          left: colIndex === 0 ? 0 : undefined,
                          zIndex: colIndex === 0 ? 2 : 1,
                          background: "hsl(var(--surface-secondary))",
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                          {col.label}
                          {col.sortable && (
                            isActive
                              ? currentOrder === "asc"
                                ? <ArrowUp size={14} />
                                : <ArrowDown size={14} />
                              : <ArrowUpDown size={14} style={{ opacity: 0.4 }} />
                          )}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {data.map((row, rowIndex) => {
                  const rowId = (row as Record<string, unknown>).id;
                  return (
                    <tr
                      key={rowId != null ? String(rowId) : rowIndex}
                      onClick={onRowClick ? () => onRowClick(row) : undefined}
                      style={{
                        background: rowIndex % 2 === 0 ? "hsl(var(--surface-elevated))" : "hsl(var(--surface-secondary))",
                        cursor: onRowClick ? "pointer" : "default",
                        transition: "background var(--transition-fast, 150ms)",
                      }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "hsl(var(--surface-secondary))";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background =
                          rowIndex % 2 === 0 ? "hsl(var(--surface-elevated))" : "hsl(var(--surface-secondary))";
                      }}
                    >
                      {displayColumns.map((col, colIndex) => {
                        const align = col.align || (col.type === "number" ? "right" : "left");

                        return (
                          <td
                            key={col.key}
                            className={col.hideOnMobile ? "data-table-hide-mobile" : ""}
                            style={{
                              fontFamily: col.type === "number" ? "var(--font-mono)" : "var(--font-body)",
                              fontSize: 14,
                              color: "var(--text-primary)",
                              padding: "12px 16px",
                              textAlign: align as React.CSSProperties["textAlign"],
                              borderBottom: "1px solid var(--border-subtle, var(--border-secondary))",
                              whiteSpace: "nowrap",
                              width: col.width,
                              position: colIndex === 0 ? "sticky" : undefined,
                              left: colIndex === 0 ? 0 : undefined,
                              zIndex: colIndex === 0 ? 1 : undefined,
                              background: "inherit",
                            }}
                          >
                            {renderCell(col, row)}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "16px 24px",
              borderTop: "1px solid var(--border-primary)",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            <span style={{ fontSize: 14, color: "var(--text-secondary)" }}>
              Showing{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>{start}</span>
              –
              <span style={{ fontFamily: "var(--font-mono)" }}>{end}</span>
              {" "}of{" "}
              <span style={{ fontFamily: "var(--font-mono)" }}>{pagination.total}</span>
            </span>

            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={handlePrevPage}
                disabled={!hasPrev}
                className="btn-ghost"
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: hasPrev ? 1 : 0.4,
                }}
              >
                <ChevronLeft size={16} />
                Previous
              </button>
              <button
                onClick={handleNextPage}
                disabled={!pagination.hasNext}
                className="btn-ghost"
                style={{
                  padding: "8px 16px",
                  fontSize: 14,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  opacity: pagination.hasNext ? 1 : 0.4,
                }}
              >
                Next
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile + hideOnMobile styles */}
      <style jsx global>{`
        @media (max-width: 639px) {
          .data-table-hide-mobile {
            display: none !important;
          }
          .data-table-filters {
            flex-direction: column;
          }
          .data-table-filters select {
            width: 100% !important;
          }
        }
      `}</style>
    </div>
  );
}
