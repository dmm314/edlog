/**
 * Server-side utility functions for the reports system.
 * Used by API routes to parse params, build queries, and format responses.
 */

export interface ReportParams {
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  cursor?: string;
  limit: number;
  filters: Record<string, string>;
}

/**
 * Parse URL search params into structured report query params.
 * Extracts `filter[xyz]=value` patterns into a filters object.
 */
export function parseReportParams(searchParams: URLSearchParams): ReportParams {
  const filters: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    const match = key.match(/^filter\[(.+)\]$/);
    if (match) {
      filters[match[1]] = value;
    }
  });

  const order = searchParams.get("order");

  return {
    search: searchParams.get("search") || undefined,
    sort: searchParams.get("sort") || undefined,
    order: order === "asc" || order === "desc" ? order : undefined,
    cursor: searchParams.get("cursor") || undefined,
    limit: Math.min(Math.max(parseInt(searchParams.get("limit") || "25", 10) || 25, 1), 100),
    filters,
  };
}

/**
 * Build a Prisma `where` clause from filters.
 *
 * filterMapping maps filter keys to either:
 * - a string: treated as a Prisma field path for exact match or contains
 * - a function: receives the filter value and returns a Prisma where fragment
 *
 * Special keys "dateFrom" and "dateTo" are handled as date range filters
 * and mapped to the field specified in filterMapping (or "date" by default).
 */
export function buildWhereClause(
  filters: Record<string, string>,
  filterMapping: Record<string, string | ((value: string) => object)>
): object {
  const conditions: object[] = [];

  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;

    // Date range handling
    if (key === "dateFrom") {
      const field = typeof filterMapping.dateFrom === "string" ? filterMapping.dateFrom : "date";
      conditions.push({ [field]: { gte: new Date(value) } });
      continue;
    }
    if (key === "dateTo") {
      const field = typeof filterMapping.dateTo === "string" ? filterMapping.dateTo : "date";
      conditions.push({ [field]: { lte: new Date(value) } });
      continue;
    }

    const mapping = filterMapping[key];
    if (!mapping) continue;

    if (typeof mapping === "function") {
      conditions.push(mapping(value));
    } else {
      // String mapping: use contains for search-type fields, equals for exact match
      // If the mapping path contains dots, build nested where
      const parts = mapping.split(".");
      if (parts.length === 1) {
        conditions.push({ [mapping]: value });
      } else {
        // Build nested object: "user.firstName" → { user: { firstName: value } }
        let obj: Record<string, unknown> = {};
        const root = obj;
        for (let i = 0; i < parts.length - 1; i++) {
          obj[parts[i]] = {};
          obj = obj[parts[i]] as Record<string, unknown>;
        }
        obj[parts[parts.length - 1]] = value;
        conditions.push(root);
      }
    }
  }

  if (conditions.length === 0) return {};
  if (conditions.length === 1) return conditions[0];
  return { AND: conditions };
}

/**
 * Build Prisma `orderBy` from sort params.
 * Only allows sorting by columns in the allowedSorts list.
 * Returns a default if sort is not provided or not allowed.
 */
export function buildOrderBy(
  sort: string | undefined,
  order: string | undefined,
  allowedSorts: string[]
): object {
  const direction = order === "asc" || order === "desc" ? order : "asc";

  if (!sort || !allowedSorts.includes(sort)) {
    // Return default: first allowed sort ascending
    if (allowedSorts.length > 0) {
      return { [allowedSorts[0]]: direction };
    }
    return {};
  }

  // Handle nested sorts like "user.firstName"
  const parts = sort.split(".");
  if (parts.length === 1) {
    return { [sort]: direction };
  }

  // Build nested: "user.firstName" → { user: { firstName: "asc" } }
  let obj: Record<string, unknown> = {};
  const root = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    obj[parts[i]] = {};
    obj = obj[parts[i]] as Record<string, unknown>;
  }
  obj[parts[parts.length - 1]] = direction;
  return root;
}

/**
 * Build cursor-based pagination for Prisma.
 * Uses row ID as cursor (not offset) per spec.
 */
export function buildPagination(
  cursor: string | undefined,
  limit: number
): { take: number; skip?: number; cursor?: { id: string } } {
  if (!cursor) {
    return { take: limit + 1 }; // Take one extra to determine hasNext
  }

  return {
    take: limit + 1,
    skip: 1, // Skip the cursor row itself
    cursor: { id: cursor },
  };
}

/**
 * Format a standard report API response.
 * Trims the extra row used for hasNext detection.
 */
export function formatReportResponse<T extends { id?: string }>(
  data: T[],
  total: number,
  params: { cursor?: string; limit: number },
  filters: Record<string, string[]>
): {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    cursor: string | null;
    hasNext: boolean;
    hasPrev: boolean;
  };
  filters: Record<string, string[]>;
} {
  const hasNext = data.length > params.limit;
  const trimmed = hasNext ? data.slice(0, params.limit) : data;
  const lastItem = trimmed[trimmed.length - 1];

  return {
    data: trimmed,
    pagination: {
      total,
      limit: params.limit,
      cursor: lastItem && hasNext ? String((lastItem as Record<string, unknown>).id ?? "") : null,
      hasNext,
      hasPrev: !!params.cursor,
    },
    filters,
  };
}

/**
 * Format a value for CSV output.
 * - Dates → "9 Mar 2026" (en-GB short)
 * - Arrays → semicolon-separated
 * - Other values → stringified
 * - Escapes commas, quotes, and newlines per RFC 4180.
 */
function formatCsvValue(value: unknown): string {
  if (value === null || value === undefined) return "";

  // Date objects
  if (value instanceof Date) {
    return value.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  }

  // ISO date strings (YYYY-MM-DD or full ISO)
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}(T[\d:.Z+-]+)?$/.test(value)) {
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
    }
  }

  // Arrays → semicolon-separated
  if (Array.isArray(value)) {
    return value.map((v) => formatCsvValue(v)).join("; ");
  }

  const str = String(value);
  // Wrap in quotes if field contains commas, quotes, or newlines
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
}

/**
 * Generate a CSV string from data rows and column definitions.
 * Handles proper escaping of commas, quotes, and newlines per RFC 4180.
 * Includes UTF-8 BOM so Excel opens the file correctly.
 */
export function generateCSV<T>(
  data: T[],
  columns: { key: string; label: string }[]
): string {
  const escapeHeader = (label: string): string => {
    if (label.includes(",") || label.includes('"') || label.includes("\n")) {
      return '"' + label.replace(/"/g, '""') + '"';
    }
    return label;
  };

  const header = columns.map((col) => escapeHeader(col.label)).join(",");

  const rows = data.map((row) => {
    return columns
      .map((col) => {
        // Support nested keys like "user.firstName"
        const keys = col.key.split(".");
        let value: unknown = row;
        for (const k of keys) {
          if (value && typeof value === "object") {
            value = (value as Record<string, unknown>)[k];
          } else {
            value = undefined;
            break;
          }
        }
        return formatCsvValue(value);
      })
      .join(",");
  });

  // \uFEFF = UTF-8 BOM so Excel opens with correct encoding
  return "\uFEFF" + [header, ...rows].join("\n");
}

/**
 * Build a Next.js Response for a CSV download.
 * Sets Content-Type and Content-Disposition headers.
 */
export function buildCsvResponse(csv: string, filename: string): Response {
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
