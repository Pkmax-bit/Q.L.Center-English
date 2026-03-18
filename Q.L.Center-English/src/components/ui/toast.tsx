"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Toast {
  id: string;
  title: string;
  description?: string;
  variant?: "default" | "destructive";
}

interface ToastContextType {
  toasts: Toast[];
  toast: (toast: Omit<Toast, "id">) => void;
  dismiss: (id: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  toasts: [],
  toast: () => {},
  dismiss: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-md">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={cn(
              "rounded-lg border p-4 shadow-lg bg-background animate-in slide-in-from-bottom-5",
              t.variant === "destructive" && "border-destructive bg-destructive text-destructive-foreground"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-sm">{t.title}</p>
                {t.description && <p className="text-sm mt-1 opacity-80">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="shrink-0">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
