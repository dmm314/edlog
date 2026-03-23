"use client";

import { CheckCircle, Save } from "lucide-react";

interface EntrySubmitBarProps {
  isFormValid: boolean;
  isDraftValid: boolean;
  submitting: boolean;
  savingDraft: boolean;
  selectedPeriodNotEnded: boolean;
  hasMultiSlots: boolean;
  hasMultiClass: boolean;
  slotCount: number;
  classCount: number;
  onSaveDraft: (e: React.MouseEvent) => void;
}

export function EntrySubmitBar({
  isFormValid,
  isDraftValid,
  submitting,
  savingDraft,
  selectedPeriodNotEnded,
  hasMultiSlots,
  hasMultiClass,
  slotCount,
  classCount,
  onSaveDraft,
}: EntrySubmitBarProps) {
  return (
    <div className="space-y-3">
      <button
        type="submit"
        disabled={!isFormValid || submitting || savingDraft || selectedPeriodNotEnded}
        className="w-full font-bold text-base text-white flex items-center justify-center gap-2 transition-all active:scale-[0.97] disabled:opacity-50 py-[18px] rounded-2xl"
        style={{
          background: "hsl(var(--success))",
          boxShadow: "0 4px 16px -4px hsl(var(--success) / 0.4)",
        }}
      >
        {submitting ? (
          <>
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </>
        ) : (
          <>
            <CheckCircle className="w-5 h-5" />
            {hasMultiSlots || hasMultiClass
              ? `Submit ${Math.max(slotCount, 1) * classCount} Entries`
              : "Submit Entry"}
          </>
        )}
      </button>

      {isDraftValid && (
        <button
          type="button"
          onClick={onSaveDraft}
          disabled={savingDraft || submitting}
          className="w-full flex items-center justify-center gap-2 font-bold py-3.5 px-6 active:scale-[0.97] transition-all border-2 rounded-2xl"
          style={{
            borderColor: "hsl(var(--accent))",
            background: "hsl(var(--surface-elevated))",
            color: "hsl(var(--accent-text))",
          }}
        >
          {savingDraft ? "Saving Draft..." : <><Save className="w-5 h-5" />Save as Draft</>}
        </button>
      )}
    </div>
  );
}
