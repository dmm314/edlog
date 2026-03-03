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
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email || !credentials?.password) {
            console.log("[AUTH] Missing email or password");
            return null;
          }

          const email = credentials.email as string;
          const password = credentials.password as string;
          console.log("[AUTH] Login attempt for:", email);

          const user = await db.user.findUnique({
            where: { email },
          });

          if (!user) {
            console.log("[AUTH] No user found for:", email);
            return null;
          }

          console.log("[AUTH] User found:", { id: user.id, role: user.role, regionId: user.regionId });

          const isPasswordValid = await compare(password, user.passwordHash);
          if (!isPasswordValid) {
            console.log("[AUTH] Invalid password for:", email);
            return null;
          }

          console.log("[AUTH] Login successful for:", email);
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            schoolId: user.schoolId,
            regionId: user.regionId,
          } as unknown as { id: string; email: string; name: string };
        } catch (err) {
          console.error("[AUTH] Unexpected error in authorize:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = user as unknown as Record<string, unknown>;
        token.role = u.role as string;
        token.firstName = u.firstName as string;
        token.lastName = u.lastName as string;
        token.schoolId = u.schoolId as string | null;
        token.regionId = u.regionId as string | null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        const u = session.user as unknown as Record<string, unknown>;
        u.role = token.role;
        u.firstName = token.firstName;
        u.lastName = token.lastName;
        u.schoolId = token.schoolId;
        u.regionId = token.regionId;
      }
      return session;
    },
  },
});

// Helper to get the session user with typed fields
// Re-fetches from DB to ensure schoolId/role are always fresh
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as unknown as Record<string, unknown>;
  const userId = user.id as string;

  // Always re-fetch from DB for fresh schoolId, role, etc.
  // This prevents stale JWT data after DB changes
  const dbUser = await db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
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
    role: dbUser.role as Role,
    schoolId: dbUser.schoolId,
    regionId: dbUser.regionId,
    isVerified: dbUser.isVerified,
  };
}

// Role-based redirect helper
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
