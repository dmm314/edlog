"use client";

import { Calendar, Check, Clock } from "lucide-react";

interface TimetableSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  periodLabel: string;
  assignment: {
    id: string;
    classId: string;
    className: string;
    classLevel: string;
    subjectId: string;
    subjectName: string;
  };
}

function shortClassName(name: string): string {
  const lower = name.toLowerCase();
  if (lower.startsWith("form ")) {
    return name.replace(/^Form\s+/i, "").replace(/\s+/g, "");
  }
  if (lower.includes("lower sixth")) {
    const section = name.replace(/lower\s+sixth\s*/i, "").trim();
    return `L6${section}`;
  }
  if (lower.includes("upper sixth")) {
    const section = name.replace(/upper\s+sixth\s*/i, "").trim();
    return `U6${section}`;
  }
  return name.length > 4 ? name.slice(-3).trim() : name;
}

interface SlotSelectorProps {
  date: string;
  slots: TimetableSlot[];
  selectedSlotIds: string[];
  filledSlotIds: Set<string>;
  filledPeriods: Set<number>;
  selectedDayName: string;
  loading: boolean;
  onSlotToggle: (slot: TimetableSlot) => void;
}

export function SlotSelector({
  slots,
  selectedSlotIds,
  filledSlotIds,
  filledPeriods,
  selectedDayName,
  loading,
  onSlotToggle,
  date,
}: SlotSelectorProps) {
  if (loading) {
    return (
      <div className="flex gap-2">
        {[1, 2].map((i) => (
          <div key={i} className="flex-shrink-0 w-28 h-20 rounded-xl skeleton" />
        ))}
      </div>
    );
  }

  if (slots.length === 0) return null;

  const selectedSlotsData = selectedSlotIds
    .map((id) => slots.find((s) => s.id === id))
    .filter(Boolean) as TimetableSlot[];

  return (
    <div>
      <label className="label-field flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5" style={{ color: "hsl(var(--accent-text))" }} />
        {selectedDayName} Schedule — Tap to Fill
      </label>
      <p className="text-[11px] text-[hsl(var(--text-tertiary))] mb-2">
        Select up to 4 periods (same subject and level)
      </p>
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
        {slots.map((slot) => {
          const periodMatch = slot.periodLabel.match(/\d+/);
          const periodNum = periodMatch ? parseInt(periodMatch[0]) : null;
          const isAlreadyFilled =
            filledSlotIds.has(slot.id) || (periodNum !== null && filledPeriods.has(periodNum));
          const isToday = date === new Date().toISOString().split("T")[0];
          const now = new Date();
          const [slotEndH, slotEndM] = slot.endTime.split(":").map(Number);
          const periodNotEnded =
            isToday && now.getHours() * 60 + now.getMinutes() < slotEndH * 60 + slotEndM;
          const isSelected = selectedSlotIds.includes(slot.id);
          const canAdd =
            (selectedSlotIds.length < 4 || isSelected) && !isAlreadyFilled && !periodNotEnded;
          const isCompatible =
            selectedSlotIds.length === 0 ||
            isSelected ||
            (selectedSlotsData.length > 0 &&
              slot.assignment.subjectId === selectedSlotsData[0].assignment.subjectId &&
              slot.assignment.classLevel === selectedSlotsData[0].assignment.classLevel);
          const incompatibleReason =
            !isCompatible && selectedSlotsData.length > 0
              ? slot.assignment.subjectId !== selectedSlotsData[0].assignment.subjectId
                ? "Different subject"
                : "Different level"
              : null;

          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => !isAlreadyFilled && !periodNotEnded && onSlotToggle(slot)}
              disabled={isAlreadyFilled || periodNotEnded}
              className={`flex-shrink-0 rounded-2xl border-2 px-3 py-2.5 text-left transition-all relative ${
                isAlreadyFilled || periodNotEnded
                  ? "opacity-60 cursor-not-allowed"
                  : isSelected
                    ? "shadow-sm"
                    : !canAdd || !isCompatible
                      ? "opacity-40"
                      : "hover:border-[hsl(var(--text-tertiary))]"
              }`}
              style={{
                borderColor: isAlreadyFilled
                  ? "hsl(var(--success))"
                  : isSelected
                    ? "hsl(var(--accent))"
                    : "hsl(var(--border-primary))",
                background: isAlreadyFilled
                  ? "hsl(var(--success) / 0.1)"
                  : isSelected
                    ? "hsl(var(--accent-soft))"
                    : "hsl(var(--surface-elevated))",
              }}
            >
              {isAlreadyFilled && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                  style={{ background: "hsl(var(--success))" }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              {isSelected && !isAlreadyFilled && (
                <div
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow-sm"
                  style={{ background: "hsl(var(--accent))" }}
                >
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
              <p className="text-xs font-bold text-[hsl(var(--text-primary))]">{slot.periodLabel}</p>
              <p className="text-[10px] text-[hsl(var(--text-tertiary))] mt-0.5 font-mono">
                {slot.startTime} - {slot.endTime}
              </p>
              <p className="text-[11px] font-semibold mt-1.5 text-[hsl(var(--accent-text))]">
                {slot.assignment.subjectName}
              </p>
              <p className="text-[10px] text-[hsl(var(--text-tertiary))]">
                {shortClassName(slot.assignment.className)}
              </p>
              {isAlreadyFilled && (
                <p className="text-[9px] font-bold mt-1 text-[hsl(var(--success))]">Already filled</p>
              )}
              {periodNotEnded && !isAlreadyFilled && (
                <p className="text-[9px] font-bold mt-1 flex items-center gap-0.5 text-[hsl(var(--accent-text))]">
                  <Clock className="w-2.5 h-2.5" />
                  Available at {slot.endTime}
                </p>
              )}
              {incompatibleReason && !isAlreadyFilled && !periodNotEnded && (
                <p className="text-[9px] font-medium mt-1 text-[hsl(var(--text-tertiary))]">
                  {incompatibleReason}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
