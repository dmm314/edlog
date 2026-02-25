import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

function Card({ children, className = "", padding = true }: CardProps) {
  return (
    <div className={`card ${padding ? "p-4" : ""} ${className}`}>
      {children}
    </div>
  );
}

export { Card };
export type { CardProps };
