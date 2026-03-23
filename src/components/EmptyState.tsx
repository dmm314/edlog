import React from "react";
import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[hsl(var(--surface-tertiary))] mb-4">
        <Icon className="h-8 w-8 text-[hsl(var(--text-tertiary))]" />
      </div>
      <h3 className="text-lg font-semibold text-[hsl(var(--text-primary))]">{title}</h3>
      <p className="mt-1 text-sm text-[hsl(var(--text-tertiary))] max-w-xs">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
