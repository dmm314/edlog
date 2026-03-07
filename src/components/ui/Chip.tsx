import React from "react";

interface ChipProps {
  children: React.ReactNode;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

function Chip({ children, selected = false, onClick, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`chip ${selected ? "chip-selected" : ""} ${className}`}
    >
      {children}
    </button>
  );
}

export { Chip };
export type { ChipProps };
