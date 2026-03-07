import React from "react";

interface ChipProps {
  label: string;
  selected?: boolean;
  onToggle?: () => void;
  className?: string;
}

function Chip({ label, selected = false, onToggle, className = "" }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`chip ${selected ? "chip-selected" : ""} ${className}`}
    >
      {label}
    </button>
  );
}

export { Chip };
export type { ChipProps };
