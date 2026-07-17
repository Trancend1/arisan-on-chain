"use client";

import { useState } from "react";
import { truncateHex } from "@/lib/format";

/** Alamat/hash: selalu mono, terpangkas, dan punya aksi salin (design-system §7). */
export function CopyMono({
  value,
  className = "",
}: {
  value: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard tidak tersedia (mis. non-secure context) — abaikan diam-diam
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      title={`Salin ${value}`}
      className={`inline-flex items-center gap-1 font-mono text-[0.875rem] text-ink-soft hover:text-nila ${className}`}
    >
      <span>{truncateHex(value)}</span>
      <span aria-hidden className="text-[0.7rem] text-muted">
        {copied ? "✓" : "⧉"}
      </span>
      <span className="sr-only">{copied ? "Tersalin" : "Salin"}</span>
    </button>
  );
}
