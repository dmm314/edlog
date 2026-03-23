/**
 * Type-safe NextAuth session extension.
 * Eliminates all Record<string, unknown> casts throughout the codebase.
 */
import type { DefaultSession, DefaultUser } from "next-auth";
import type { DefaultJWT } from "next-auth/jwt";

declare module "next-auth" {
  interface User extends DefaultUser {
    firstName: string;
    lastName: string;
    role: string;
    schoolId: string | null;
    regionId: string | null;
    gender: string | null;
    createdAt: string;
  }

  interface Session extends DefaultSession {
    user: {
      id: string;
      email: string;
      name: string;
      firstName: string;
      lastName: string;
      role: string;
      gender: string | null;
      schoolId: string | null;
      regionId: string | null;
      createdAt: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT extends DefaultJWT {
    id: string;
    role: string;
    firstName: string;
    lastName: string;
    gender: string | null;
    schoolId: string | null;
    regionId: string | null;
    createdAt: string;
  }
}
