"use client";

import { DEV_ACCOUNTS } from "@/lib/accounts";
import { truncateHex } from "@/lib/format";
import { useActiveAccount } from "@/hooks/useActiveAccount";

/** Dropdown "Bertindak sebagai" (ADR-002) — ganti akun = ganti walletClient. */
export function AccountSwitcher() {
  const { account, index, setIndex } = useActiveAccount();

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="hidden text-paper/80 sm:inline">Bertindak sebagai</span>
      <span className="relative inline-flex items-center">
        <select
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          aria-label="Bertindak sebagai"
          className="appearance-none rounded-[10px] border border-nila-tint/40 bg-surface py-1.5 pl-3 pr-8 text-sm text-ink shadow-[var(--shadow-card)]"
        >
          {DEV_ACCOUNTS.map((acc, i) => (
            <option key={acc.address} value={i}>
              {acc.label} · {truncateHex(acc.address)}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute right-2.5 text-[0.7rem] text-muted"
        >
          ▾
        </span>
      </span>
      {account.role === "admin" && (
        <span className="rounded-full bg-kunyit px-2 py-0.5 text-[0.75rem] font-medium text-ink">
          Admin
        </span>
      )}
    </label>
  );
}
