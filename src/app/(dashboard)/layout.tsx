"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isCoordinator, setIsCoordinator] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Check coordinator status for TEACHER role users
  useEffect(() => {
    const role = (session?.user as Record<string, unknown>)?.role as string | undefined;
    if (status !== "authenticated" || role !== "TEACHER") return;

    fetch("/api/coordinator/check")
      .then((res) => res.ok ? res.json() : { isCoordinator: false })
      .then((data) => setIsCoordinator(!!data.isCoordinator))
      .catch(() => {});
  }, [status, session]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto"
            style={{ color: "var(--accent)" }}
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm mt-3" style={{ color: "var(--text-tertiary)" }}>Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const role = (session.user as Record<string, unknown>)?.role as string;
  const userName = (session.user as Record<string, unknown>)?.name as string | undefined;

  return (
    <div className="min-h-screen dashboard-shell" style={{ backgroundColor: "var(--bg-primary)" }}>
      <SideNav role={role} userName={userName} isCoordinator={isCoordinator} />
      <div className="dashboard-content">
        {children}
      </div>
      <BottomNav role={role} isCoordinator={isCoordinator} />
    </div>
  );
}
