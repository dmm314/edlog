"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { SideNav } from "@/components/SideNav";
import { CoordinatorModeContext, type PortalMode } from "@/contexts/CoordinatorModeContext";

const PORTAL_MODE_KEY = "edlog-portal-mode";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [isCoordinator, setIsCoordinator] = useState(false);
  const [coordinatorTitle, setCoordinatorTitle] = useState<string | null>(null);
  const [hasTeachingAssignments, setHasTeachingAssignments] = useState(true);
  const [activeMode, setActiveMode] = useState<PortalMode>("teacher");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    const role = (session?.user as Record<string, unknown>)?.role as string | undefined;
    if (status !== "authenticated" || role !== "TEACHER") return;

    fetch("/api/coordinator/check")
      .then((res) => res.ok ? res.json() : { isCoordinator: false, hasTeachingAssignments: true })
      .then((data) => {
        setIsCoordinator(!!data.isCoordinator);
        setCoordinatorTitle(data.title ?? null);
        const hasAssignments = data.hasTeachingAssignments !== false;
        setHasTeachingAssignments(hasAssignments);

        if (data.isCoordinator) {
          if (!hasAssignments) {
            setActiveMode("coordinator");
          } else {
            const saved = typeof window !== "undefined"
              ? localStorage.getItem(PORTAL_MODE_KEY)
              : null;
            if (saved === "coordinator") setActiveMode("coordinator");
          }
        }
      })
      .catch(() => {});
  }, [status, session]);

  const switchMode = useCallback((mode: PortalMode) => {
    setActiveMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem(PORTAL_MODE_KEY, mode);
    }
    if (mode === "coordinator") {
      router.push("/coordinator");
    } else {
      router.push("/logbook");
    }
  }, [router]);

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface-canvas))]">
        <div className="text-center">
          <svg
            className="mx-auto h-8 w-8 animate-spin text-[hsl(var(--accent))]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="mt-3 text-sm text-[hsl(var(--text-tertiary))]">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const role = (session.user as Record<string, unknown>)?.role as string;
  const userName = (session.user as Record<string, unknown>)?.name as string | undefined;

  return (
    <CoordinatorModeContext.Provider
      value={{ activeMode, isCoordinator, coordinatorTitle, hasTeachingAssignments, switchMode }}
    >
      <div className="dashboard-shell min-h-screen bg-[hsl(var(--surface-canvas))]">
        <SideNav role={role} userName={userName} isCoordinator={isCoordinator} activeMode={activeMode} switchMode={switchMode} />
        <div className="dashboard-content">
          {children}
        </div>
        <BottomNav role={role} isCoordinator={isCoordinator} activeMode={activeMode} />
      </div>
    </CoordinatorModeContext.Provider>
  );
}
