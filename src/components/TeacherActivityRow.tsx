import React from "react";

interface TeacherActivityRowProps {
  name: string;
  initials: string;
  entriesLogged: number;
  entriesExpected: number;
  color?: string;
  onClick?: () => void;
}

function TeacherActivityRow({
  name,
  initials,
  entriesLogged,
  entriesExpected,
  onClick,
}: TeacherActivityRowProps) {
  const rate = entriesExpected > 0 ? (entriesLogged / entriesExpected) * 100 : 0;
  const barColor = rate >= 90 ? "progress-green" : rate >= 70 ? "progress-amber" : "progress-red";

  // Avatar colors based on compliance
  const avatarBg = rate >= 90 ? "#DCFCE7" : rate >= 70 ? "hsl(var(--accent) / 0.1)" : "#FEE2E2";
  const avatarText = rate >= 90 ? "#16A34A" : rate >= 70 ? "hsl(var(--accent-strong))" : "#DC2626";
  const countColor = rate >= 90 ? "#16A34A" : rate >= 70 ? "hsl(var(--accent-strong))" : "#DC2626";

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[var(--bg-secondary)] transition-colors text-left"
    >
      <div
        className="flex items-center justify-center text-[13px] font-bold shrink-0"
        style={{ width: "36px", height: "36px", borderRadius: "12px", backgroundColor: avatarBg, color: avatarText }}
      >
        {initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-semibold text-[var(--text-primary)] truncate">{name}</p>
        <div className="progress-bar mt-1.5">
          <div
            className={`progress-bar-fill ${barColor}`}
            style={{ width: `${Math.min(100, rate)}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-mono tabular-nums font-semibold shrink-0" style={{ color: countColor }}>
        {entriesLogged}/{entriesExpected}
      </span>
    </button>
  );
}

export { TeacherActivityRow };
export type { TeacherActivityRowProps };
