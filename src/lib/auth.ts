/**
 * ================================================================
 * AUTHENTICATION CONFIGURATION — NextAuth v5 (Auth.js)
 * ================================================================
 *
 * This file configures the entire authentication system for Edlog.
 * It handles:
 *   - Login (email + password via CredentialsProvider)
 *   - JWT session management (tokens stored in cookies)
 *   - Role-based dashboard routing (Teacher, School Admin, Regional Admin)
 *
 * HOW LOGIN WORKS (step by step):
 *   1. User submits email + password on /login
 *   2. LoginForm calls signIn("credentials", { email, password })
 *   3. NextAuth calls the authorize() function below
 *   4. authorize() looks up user in DB by email
 *   5. authorize() compares the submitted password against the stored bcrypt hash
 *   6. If match → returns user object → NextAuth creates a JWT → user is logged in
 *   7. If no match → returns null → NextAuth returns "CredentialsSignin" error
 *   8. LoginForm redirects to the correct dashboard based on user role
 *
 * IMPORTANT: NextAuth silently swallows errors in authorize().
 *   If authorize() throws an exception (e.g. DB connection fails),
 *   NextAuth catches it and returns the SAME "CredentialsSignin" error
 *   as a wrong password. That's why we wrap everything in try/catch
 *   and log errors with [AUTH] prefix — check Vercel function logs!
 *
 * ENVIRONMENT VARIABLES REQUIRED:
 *   - DATABASE_URL: Neon PostgreSQL connection string
 *   - AUTH_SECRET:  Secret key for signing JWT tokens (must be set in Vercel)
 *   - NEXTAUTH_URL: The app's base URL (e.g. https://edlog-psi.vercel.app)
 * ================================================================
 */

import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { compare } from "bcryptjs";
import { db } from "./db";
import type { Role } from "@/types";

export const {
  handlers: { GET, POST },
  auth,
  signIn,
  signOut,
} = NextAuth({
  /**
   * SESSION STRATEGY: JWT
   * Tokens are stored in the browser cookie — no server-side sessions.
   * maxAge = 30 days before the user needs to log in again.
   */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /**
   * CUSTOM PAGES
   * Redirect unauthenticated users to /login instead of the default NextAuth page.
   */
  pages: {
    signIn: "/login",
  },

  /**
   * PROVIDERS
   * We use CredentialsProvider for email + password login.
   * No OAuth providers (Google, GitHub, etc.) are configured.
   */
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },

      /**
       * AUTHORIZE — The core login function
       *
       * Called every time a user submits the login form.
       * Must return a user object on success, or null on failure.
       *
       * IMPORTANT: This function is wrapped in try/catch because
       * NextAuth silently swallows ALL errors and converts them
       * to the generic "CredentialsSignin" error. Without the
       * try/catch + console.log, you'd have NO idea what went wrong.
       */
      async authorize(credentials) {
        try {
          // ── Step 1: Validate that email and password were provided ──
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] Missing email or password in credentials");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;
          console.log("[AUTH] Login attempt for:", email);

          // ── Step 2: Look up the user by email ──
          // NOTE: We do NOT use include/join here — just fetch the user record.
          // Including relations (school, regionAdmin) is unnecessary for
          // password verification and can cause Prisma errors if relations
          // have schema mismatches. Keep it simple.
          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("[AUTH] No user found with email:", email);
            return null;
          }

          console.log("[AUTH] User found:", {
            id: user.id,
            role: user.role,
            regionId: user.regionId,
          });

          // ── Step 3: Verify the password against the stored bcrypt hash ──
          // bcryptjs.compare() does a constant-time comparison to prevent
          // timing attacks. Returns true if the password matches.
          const isPasswordValid = await compare(password, user.passwordHash);

          if (!isPasswordValid) {
            console.log("[AUTH] Password mismatch for:", email);
            return null;
          }

          // ── Step 4: Return the user object ──
          // These fields are stored in the JWT token via the jwt() callback below.
          // The "as unknown as" cast is needed because NextAuth's default User type
          // only has { id, email, name } but we add custom fields (role, schoolId, etc.)
          console.log("[AUTH] Login successful for:", email, "role:", user.role);
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            schoolId: user.schoolId,
            regionId: user.regionId,
            createdAt: user.createdAt.toISOString(),
          } as unknown as { id: string; email: string; name: string };
        } catch (err) {
          // ── If ANYTHING goes wrong, log it ──
          // Without this, NextAuth would silently swallow the error and
          // the user would just see "Invalid email or password" with no
          // way to know the real cause (DB down? Prisma error? etc.)
          console.error("[AUTH] Unexpected error in authorize():", err);
          return null;
        }
      },
    }),
  ],

  /**
   * CALLBACKS
   * These functions customize what data is stored in the JWT token
   * and what data is available in the session on the client side.
   */
  callbacks: {
    /**
     * JWT CALLBACK — Runs when a token is created or refreshed
     *
     * On login (when `user` is defined), we add custom fields to the token:
     *   - role: "TEACHER" | "SCHOOL_ADMIN" | "REGIONAL_ADMIN"
     *   - firstName, lastName: for display
     *   - schoolId: which school (null for regional admins)
     *   - regionId: which region (null for teachers/school admins)
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role as string;
        token.firstName = u.firstName as string;
        token.lastName = u.lastName as string;
        token.gender = u.gender as string | null;
        token.schoolId = u.schoolId as string | null;
        token.regionId = u.regionId as string | null;
        token.createdAt = u.createdAt as string;
      }
      return token;
    },

    /**
     * SESSION CALLBACK — Runs when session is read on the client
     *
     * Copies the custom fields from the JWT token into the session
     * object so they're available via useSession() in React components.
     */
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const u = session.user as unknown as Record<string, unknown>;
        u.role = token.role;
        u.firstName = token.firstName;
        u.lastName = token.lastName;
        u.gender = token.gender;
        u.schoolId = token.schoolId;
        u.regionId = token.regionId;
        u.createdAt = token.createdAt;
      }
      return session;
    },
  },
});

/**
 * ================================================================
 * getSessionUser() — Server-side session helper
 * ================================================================
 *
 * Use this in API routes and Server Components to get the current user.
 * Always re-fetches from the database to ensure fresh data (e.g. if
 * an admin changes a user's role, the JWT might have stale data).
 *
 * Returns null if the user is not logged in.
 *
 * Example usage in an API route:
 *   const user = await getSessionUser();
 *   if (!user || user.role !== "SCHOOL_ADMIN") {
 *     return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 *   }
 */
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as unknown as Record<string, unknown>;
  const userId = user.id as string;

  // Always re-fetch from DB — the JWT might have stale role/schoolId
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      gender: true,
      role: true,
      schoolId: true,
      regionId: true,
      isVerified: true,
    },
  });

  if (!dbUser) return null;

  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.firstName,
    lastName: dbUser.lastName,
    gender: dbUser.gender as string | null,
    role: dbUser.role as Role,
    schoolId: dbUser.schoolId,
    regionId: dbUser.regionId,
    isVerified: dbUser.isVerified,
  };
}

/**
 * ================================================================
 * getDashboardPath() — Role-based redirect helper
 * ================================================================
 *
 * After login, redirect the user to their role-specific dashboard:
 *   - REGIONAL_ADMIN → /regional  (region-wide stats & school management)
 *   - SCHOOL_ADMIN   → /admin     (school-level teacher & entry management)
 *   - TEACHER        → /logbook   (logbook entry creation)
 */
export function getDashboardPath(role: Role): string {
  switch (role) {
    case "REGIONAL_ADMIN":
      return "/regional";
    case "SCHOOL_ADMIN":
      return "/admin";
    case "TEACHER":
      return "/logbook";
    default:
      return "/logbook";
  }
}
