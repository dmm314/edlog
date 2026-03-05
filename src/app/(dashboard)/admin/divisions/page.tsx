"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DivisionsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/subjects");
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <p className="text-slate-500 text-sm">
        Redirecting to Subjects...
      </p>
    </div>
  );
}
