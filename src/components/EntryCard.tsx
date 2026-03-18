import React from "react";
import type { EntryWithRelations } from "@/types";
import { DynamicEntryCard } from "@/components/DynamicEntryCard";

interface EntryCardProps {
  entry: EntryWithRelations;
  onClick?: () => void;
}

function EntryCard({ entry, onClick }: EntryCardProps) {
  return <DynamicEntryCard entry={entry} onClick={onClick} />;
}

export { EntryCard };
export type { EntryCardProps };
