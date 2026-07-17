"use client";

import { createContext, useCallback, useContext, useRef, useState } from "react";

export type TxToastStatus = "pending" | "success" | "error";

export type TxToastData = {
  id: number;
  status: TxToastStatus;
  title: string;
  message?: string;
  hash?: `0x${string}`;
  gasUsed?: bigint;
};

type ToastContextValue = {
  toasts: TxToastData[];
  push: (toast: Omit<TxToastData, "id">) => number;
  update: (id: number, patch: Partial<Omit<TxToastData, "id">>) => void;
  dismiss: (id: number) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

const SUCCESS_AUTO_DISMISS_MS = 10_000;

/** Antrian TxToast (F-7): tiap write menampilkan hash, status, dan gasUsed. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<TxToastData[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((toast: Omit<TxToastData, "id">) => {
    const id = nextId.current++;
    setToasts((prev) => [...prev, { ...toast, id }]);
    return id;
  }, []);

  const update = useCallback(
    (id: number, patch: Partial<Omit<TxToastData, "id">>) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, ...patch } : t)),
      );
      if (patch.status === "success") {
        setTimeout(() => dismiss(id), SUCCESS_AUTO_DISMISS_MS);
      }
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={{ toasts, push, update, dismiss }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToasts(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToasts dipakai di luar ToastProvider");
  return ctx;
}
