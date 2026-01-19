"use client";

import * as React from "react";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "info";

interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (type: ToastType, message: string, duration?: number) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(
  undefined
);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback(
    (type: ToastType, message: string, duration = 4000) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2)}`;
      setToasts((prev) => [...prev, { id, type, message, duration }]);

      // Auto-remove after duration
      if (duration > 0) {
        setTimeout(() => {
          setToasts((prev) => prev.filter((t) => t.id !== id));
        }, duration);
      }
    },
    []
  );

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onClose,
}: {
  toast: Toast;
  onClose: (id: string) => void;
}) {
  const Icon =
    toast.type === "success"
      ? CheckCircle
      : toast.type === "error"
      ? AlertCircle
      : Info;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm animate-in slide-in-from-right-full duration-300",
        toast.type === "success" &&
          "border-[--score-excellent]/30 bg-[--score-excellent]/10 text-[--score-excellent]",
        toast.type === "error" &&
          "border-[--priority-high]/30 bg-[--priority-high]/10 text-[--priority-high]",
        toast.type === "info" &&
          "border-[--accent]/30 bg-[--accent]/10 text-[--accent]"
      )}
    >
      <Icon className="h-5 w-5 flex-shrink-0" />
      <p className="text-sm font-medium text-[--foreground]">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="ml-2 rounded p-1 hover:bg-white/10 transition-colors"
      >
        <X className="h-4 w-4 text-[--foreground-muted]" />
      </button>
    </div>
  );
}

// Simple standalone toast function for quick usage
let globalAddToast: ToastContextType["addToast"] | null = null;

export function setGlobalToast(addToast: ToastContextType["addToast"]) {
  globalAddToast = addToast;
}

export function toast(type: ToastType, message: string, duration?: number) {
  if (globalAddToast) {
    globalAddToast(type, message, duration);
  } else {
    console.warn("Toast provider not initialized");
  }
}
