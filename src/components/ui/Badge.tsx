import React from "react";

type BadgeStatus = "VERIFIED" | "SUBMITTED" | "FLAGGED" | "DRAFT";
type BadgeVariant = "success" | "info" | "warning" | "danger" | "default" | "submitted" | "verified" | "flagged" | "draft";

interface BadgeProps {
  variant?: BadgeVariant;
  status?: BadgeStatus;
  children: React.ReactNode;
  className?: string;
}

const statusToVariant: Record<BadgeStatus, BadgeVariant> = {
  VERIFIED: "verified",
  SUBMITTED: "submitted",
  FLAGGED: "flagged",
  DRAFT: "draft",
};

const variantClasses: Record<BadgeVariant, string> = {
  success: "badge-verified",
  info: "badge-submitted",
  warning: "badge-flagged",
  danger: "badge-flagged",
  default: "badge-draft",
  submitted: "badge-submitted",
  verified: "badge-verified",
  flagged: "badge-flagged",
  draft: "badge-draft",
};

function Badge({ variant, status, children, className = "" }: BadgeProps) {
  const resolvedVariant = status ? statusToVariant[status] : (variant ?? "default");

  return (
    <span className={`${variantClasses[resolvedVariant]} ${className}`}>
      {children}
    </span>
  );
}

export { Badge };
export type { BadgeProps, BadgeVariant, BadgeStatus };
