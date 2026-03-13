"use client";

import React, { createContext, useContext } from "react";

export type PortalMode = "teacher" | "coordinator";

interface CoordinatorModeContextValue {
  activeMode: PortalMode;
  isCoordinator: boolean;
  coordinatorTitle: string | null;
  hasTeachingAssignments: boolean;
  switchMode: (mode: PortalMode) => void;
}

export const CoordinatorModeContext = createContext<CoordinatorModeContextValue>({
  activeMode: "teacher",
  isCoordinator: false,
  coordinatorTitle: null,
  hasTeachingAssignments: true,
  switchMode: () => {},
});

export function useCoordinatorMode() {
  return useContext(CoordinatorModeContext);
}
