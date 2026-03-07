"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextValue {
  toast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const iconMap: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle className="h-5 w-5 shrink-0" style={{ color: "var(--success)" }} />,
  error: <XCircle className="h-5 w-5 shrink-0" style={{ color: "var(--warning)" }} />,
  info: <AlertCircle className="h-5 w-5 shrink-0" style={{ color: "var(--accent)" }} />,
};

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string) => {
      const id = crypto.randomUUID();
      setToasts((prev) => [...prev, { id, type, message }]);

      setTimeout(() => {
        removeToast(id);
      }, 3000);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast: addToast }}>
      {children}
      <div className="fixed bottom-20 left-0 right-0 z-[100] flex flex-col items-center gap-2 px-4 pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 w-full max-w-sm px-4 py-3 shadow-elevated animate-slide-up"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-primary)",
              borderRadius: "var(--radius-base)",
            }}
            role="alert"
          >
            {iconMap[t.type]}
            <p className="flex-1 text-sm font-medium text-[var(--text-primary)]">
              {t.message}
            </p>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export { ToastProvider, useToast };
