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
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const email = credentials.email as string;
        const password = credentials.password as string;

        const user = await db.user.findUnique({
          where: { email },
          include: { school: true, regionAdmin: true },
        });

        if (!user) {
          return null;
        }

        const isPasswordValid = await compare(password, user.passwordHash);
        if (!isPasswordValid) {
          return null;
        }

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
export async function getSessionUser() {
  const session = await auth();
  if (!session?.user) return null;

  const user = session.user as unknown as Record<string, unknown>;
  return {
    id: user.id as string,
    email: user.email as string,
    firstName: user.firstName as string,
    lastName: user.lastName as string,
    role: user.role as Role,
    schoolId: user.schoolId as string | null,
    regionId: user.regionId as string | null,
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
