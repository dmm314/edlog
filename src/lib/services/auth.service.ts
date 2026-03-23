/**
 * Auth Service — Authorization helpers and permission checks.
 * Thin wrappers around common auth patterns used across API routes.
 */
import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import type { Role } from "@/types";

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  schoolId: string | null;
  regionId: string | null;
  gender: string | null;
  isVerified: boolean;
}

type RouteHandler = (
  req: Request,
  user: AuthenticatedUser,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: any
) => Promise<NextResponse>;

interface WithAuthOptions {
  roles?: Role[];
  requireSchool?: boolean;
  requireRegion?: boolean;
}

/**
 * withAuth — Higher-order function for API route authorization.
 *
 * Wraps an API route handler with:
 * 1. Session validation (401 if not logged in)
 * 2. Role checking (403 if insufficient permissions)
 * 3. School/region requirement checks
 *
 * Usage:
 *   export const GET = withAuth(async (req, user) => {
 *     // user is typed and guaranteed to exist
 *     return NextResponse.json({ data: ... });
 *   }, { roles: ['SCHOOL_ADMIN'] });
 */
export function withAuth(handler: RouteHandler, options: WithAuthOptions = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (req: Request, context?: any) => {
    try {
      const user = await getSessionUser();

      if (!user) {
        return NextResponse.json(
          { error: "Authentication required", code: "AUTH_REQUIRED" },
          { status: 401 }
        );
      }

      // Role check
      if (options.roles && options.roles.length > 0) {
        if (!options.roles.includes(user.role)) {
          return NextResponse.json(
            { error: "Insufficient permissions", code: "FORBIDDEN" },
            { status: 403 }
          );
        }
      }

      // School requirement
      if (options.requireSchool && !user.schoolId) {
        return NextResponse.json(
          { error: "No school associated with this account", code: "NO_SCHOOL" },
          { status: 403 }
        );
      }

      // Region requirement
      if (options.requireRegion && !user.regionId) {
        return NextResponse.json(
          { error: "No region associated with this account", code: "NO_REGION" },
          { status: 403 }
        );
      }

      return handler(req, user as AuthenticatedUser, context);
    } catch (error) {
      console.error("[withAuth] Unexpected error:", error);
      return NextResponse.json(
        { error: "Internal server error", code: "INTERNAL_ERROR" },
        { status: 500 }
      );
    }
  };
}

/**
 * Standard API error response helper.
 */
export function apiError(
  message: string,
  code: string,
  status: number,
  details?: Record<string, string[]>
) {
  return NextResponse.json(
    { error: message, code, ...(details ? { details } : {}) },
    { status }
  );
}

/**
 * Standard API success response helper.
 */
export function apiSuccess<T>(
  data: T,
  meta?: { total?: number; page?: number; pageSize?: number }
) {
  return NextResponse.json({ data, ...(meta ? { meta } : {}) });
}
