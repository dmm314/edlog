export const dynamic = "force-dynamic";
/**
 * ================================================================
 * AUTH DIAGNOSTIC ENDPOINT — /api/auth/check
 * ================================================================
 *
 * PURPOSE:
 *   A temporary diagnostic tool to help debug login issues.
 *   This bypasses NextAuth entirely and tests each step of the
 *   authentication pipeline independently:
 *     1. Can we connect to the database?
 *     2. Do the regional admin accounts exist?
 *     3. Does the password hash match the expected password?
 *
 * USAGE:
 *   GET  /api/auth/check           → Shows DB connection + all regional accounts
 *   POST /api/auth/check           → Tests a specific email/password combination
 *        Body: { "email": "...", "password": "..." }
 *
 * SECURITY NOTE:
 *   This endpoint does NOT expose password hashes.
 *   Remove or protect this endpoint before going to production.
 * ================================================================
 */

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

/**
 * GET /api/auth/check
 * Returns: DB connection status + list of regional admin accounts
 */
export async function GET() {
  try {
    // ── Step 1: Test database connection ──
    // If this fails, the DB is unreachable (wrong URL, Neon paused, etc.)
    const regionCount = await db.region.count();
    const divisionCount = await db.division.count();

    // ── Step 2: Check if regional admin accounts exist ──
    const admins = await db.user.findMany({
      where: { role: "REGIONAL_ADMIN" },
      select: {
        id: true,
        email: true,
        role: true,
        regionId: true,
        isVerified: true,
        createdAt: true,
        // NOTE: passwordHash is intentionally NOT selected for security
      },
    });

    // ── Step 3: Return diagnostic info ──
    return NextResponse.json({
      status: "ok",
      database: "connected",
      counts: {
        regions: regionCount,
        divisions: divisionCount,
        regionalAdmins: admins.length,
      },
      // If no accounts found, this is the problem — the SQL was never run
      regionalAdmins: admins.map((a) => ({
        email: a.email,
        id: a.id,
        regionId: a.regionId,
        isVerified: a.isVerified,
        createdAt: a.createdAt,
      })),
      // Help the user understand what they're seeing
      diagnosis:
        admins.length === 0
          ? "NO REGIONAL ADMIN ACCOUNTS FOUND. You need to run full-sync.sql in Neon SQL Editor."
          : regionCount === 0
            ? "NO REGIONS FOUND. Run full-sync.sql — the Region INSERT section may have failed."
            : `Found ${admins.length} regional admin account(s). Use POST to test a specific login.`,
    });
  } catch (err) {
    // ── Database connection failed ──
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        status: "error",
        database: "UNREACHABLE",
        error: message,
        diagnosis:
          "Cannot connect to the database. Check DATABASE_URL in your Vercel environment variables.",
      },
      { status: 500 },
    );
  }
}

/**
 * POST /api/auth/check
 * Body: { email: string, password: string }
 * Returns: Step-by-step diagnosis of why login fails or succeeds
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body as { email?: string; password?: string };

    // ── Validate input ──
    if (!email || !password) {
      return NextResponse.json(
        { status: "error", diagnosis: "Send { email, password } in the request body." },
        { status: 400 },
      );
    }

    // ── Step 1: Look up user by email ──
    const user = await db.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        role: true,
        regionId: true,
        isVerified: true,
        passwordHash: true, // needed for comparison (not returned to client)
      },
    });

    if (!user) {
      return NextResponse.json({
        status: "fail",
        step: "USER_LOOKUP",
        diagnosis: `No user found with email "${email}". The account does not exist in the database. Run full-sync.sql in Neon SQL Editor.`,
      });
    }

    // ── Step 2: Compare password ──
    const passwordMatches = await compare(password, user.passwordHash);

    if (!passwordMatches) {
      return NextResponse.json({
        status: "fail",
        step: "PASSWORD_COMPARE",
        user: { email: user.email, id: user.id, role: user.role },
        diagnosis: `User "${email}" exists but the password does NOT match. The password hash in the database does not match the password you entered. You may need to re-run full-sync.sql after deleting old accounts.`,
      });
    }

    // ── Step 3: All checks passed ──
    return NextResponse.json({
      status: "ok",
      step: "ALL_PASSED",
      user: {
        email: user.email,
        id: user.id,
        role: user.role,
        regionId: user.regionId,
        isVerified: user.isVerified,
      },
      diagnosis: `Login SHOULD work for "${email}". If it still fails on the login page, the issue is in NextAuth configuration, not the database. Check Vercel function logs for [AUTH] messages.`,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { status: "error", error: message, diagnosis: "Database error during check." },
      { status: 500 },
    );
  }
}
