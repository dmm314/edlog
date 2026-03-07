import React from "react";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "heading" | "avatar" | "card" | "custom";
  children?: React.ReactNode;
}

function Skeleton({ className = "", variant = "custom", children }: SkeletonProps) {
  if (variant === "card") {
    return (
      <div className="skeleton-card">
        {children || (
          <>
            <div className="skeleton h-5 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-1/2" />
          </>
        )}
      </div>
    );
  }

  const variantClass = {
    text: "skeleton-text",
    heading: "skeleton-heading",
    avatar: "skeleton-avatar",
    custom: "skeleton",
  }[variant];

  return <div className={`${variantClass} ${className}`} />;
}

export { Skeleton };
export type { SkeletonProps };
