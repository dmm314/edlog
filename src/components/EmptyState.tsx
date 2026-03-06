import React from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href: string;
  };
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-tertiary)] mb-4">
        <Icon className="h-8 w-8 text-[var(--text-tertiary)]" />
      </div>
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h3>
      <p className="mt-1 text-sm text-[var(--text-tertiary)] max-w-xs">{description}</p>
      {action && (
        <Link
          href={action.href}
          className="mt-6 btn-primary inline-block text-center w-auto"
        >
          {action.label}
        </Link>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
