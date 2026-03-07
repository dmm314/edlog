import React from "react";

type BadgeVariant = "success" | "info" | "warning" | "danger" | "default" | "submitted" | "verified" | "flagged" | "draft";

interface BadgeProps {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: "bg-[var(--badge-verified-bg)] text-[var(--badge-verified-text)]",
  info: "bg-[var(--accent-light)] text-[var(--accent-text)]",
  warning: "bg-[var(--badge-flagged-bg)] text-[var(--badge-flagged-text)]",
  danger: "bg-[var(--badge-flagged-bg)] text-[var(--badge-flagged-text)]",
  default: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  submitted: "badge-submitted",
  verified: "badge-verified",
  flagged: "badge-flagged",
  draft: "badge-draft",
};

const isStatusBadge = (variant: BadgeVariant) =>
  variant === "submitted" || variant === "verified" || variant === "flagged" || variant === "draft";

function Badge({ variant = "default", children, className = "" }: BadgeProps) {
  if (isStatusBadge(variant)) {
    return (
      <span className={`${variantClasses[variant]} ${className}`}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 text-xs font-semibold ${variantClasses[variant]} ${className}`}
      style={{ borderRadius: "var(--radius-sm)" }}
    >
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant };
