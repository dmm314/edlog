import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, subtitle, action, className }: PageHeaderProps) {
  return (
    <div className={cn("mb-6 flex items-start justify-between gap-4", className)}>
      <div>
        <h1 className="text-2xl font-bold text-[hsl(var(--text-primary))]">{title}</h1>
        {subtitle && (
          <p className="mt-1 text-sm text-[hsl(var(--text-tertiary))]">{subtitle}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}
