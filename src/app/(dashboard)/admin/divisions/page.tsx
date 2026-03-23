"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DivisionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/classes");
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "hsl(var(--surface-secondary))" }}>
      <p className="text-[var(--text-tertiary)] text-sm">
        Redirecting to Classes...
      </p>
    </div>
  );
}
