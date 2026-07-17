"use client";

import { useToasts, type TxToastData } from "@/hooks/useToasts";
import { CopyMono } from "./CopyMono";

const ACCENT: Record<TxToastData["status"], string> = {
  pending: "border-l-amber",
  success: "border-l-jade",
  error: "border-l-rust",
};

const STATUS_TEXT: Record<TxToastData["status"], string> = {
  pending: "text-amber",
  success: "text-jade",
  error: "text-rust",
};

function ToastCard({ toast }: { toast: TxToastData }) {
  const { dismiss } = useToasts();

  return (
    <div
      role="status"
      className={`w-80 max-w-[calc(100vw-2rem)] rounded-[10px] border border-line ${ACCENT[toast.status]} border-l-4 bg-surface p-4 shadow-[var(--shadow-lift)]`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className={`text-sm font-semibold ${STATUS_TEXT[toast.status]}`}>
          {toast.status === "pending" ? "Menunggu konfirmasi…" : toast.title}
        </p>
        <button
          type="button"
          onClick={() => dismiss(toast.id)}
          aria-label="Tutup notifikasi"
          className="text-muted hover:text-ink"
        >
          ✕
        </button>
      </div>

      {toast.status === "pending" && (
        <p className="mt-1 text-[0.8rem] text-ink-soft">{toast.title}</p>
      )}
      {toast.message && (
        <p className="mt-1 text-[0.8rem] text-ink-soft">{toast.message}</p>
      )}

      {(toast.hash || toast.gasUsed !== undefined) && (
        <dl className="mt-2 space-y-1 border-t border-line pt-2 text-[0.8rem]">
          {toast.hash && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Tx hash</dt>
              <dd>
                <CopyMono value={toast.hash} />
              </dd>
            </div>
          )}
          {toast.gasUsed !== undefined && (
            <div className="flex items-center justify-between gap-2">
              <dt className="text-muted">Gas terpakai</dt>
              <dd className="font-mono text-[0.875rem] text-ink">
                {toast.gasUsed.toLocaleString("id-ID")}
              </dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}

/** Tumpukan TxToast (F-7): tiap write menampilkan hash, status, gasUsed. */
export function TxToastStack() {
  const { toasts } = useToasts();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3">
      {toasts.map((t) => (
        <ToastCard key={t.id} toast={t} />
      ))}
    </div>
  );
}
