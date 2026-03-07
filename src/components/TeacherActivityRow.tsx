import React from "react";

interface TeacherActivityRowProps {
  name: string;
  initials: string;
  entriesLogged: number;
  entriesExpected: number;
  color: string; // hex for avatar bg
  onClick?: () => void;
}

function TeacherActivityRow({
  name,
  initials,
  entriesLogged,
  entriesExpected,
  color,
  onClick,
}: TeacherActivityRowProps) {
  const rate = entriesExpected > 0 ? (entriesLogged / entriesExpected) * 100 : 0;
  const barColor = rate >= 90 ? "progress-green" : rate >= 70 ? "progress-amber" : "progress-red";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors text-left"
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: color }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[var(--text-primary)] truncate">{name}</p>
        <div className="progress-bar mt-1.5">
          <div
            className={`progress-bar-fill ${barColor}`}
            style={{ width: `${Math.min(100, rate)}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-mono tabular-nums font-bold text-[var(--text-tertiary)] shrink-0">
        {entriesLogged}/{entriesExpected}
      </span>
    </button>
  );
}

export { TeacherActivityRow };
export type { TeacherActivityRowProps };
