"use client";

import { formatWei, toEth } from "@/lib/format";

type PotCardProps = {
  pot: bigint;
  round: number;
  contributionAmount: bigint;
  memberCount: number;
  finished: boolean;
};

/** Nominal pot ronde berjalan: display-xl Space Grotesk + konversi Wei (§5). */
export function PotCard({
  pot,
  round,
  contributionAmount,
  memberCount,
  finished,
}: PotCardProps) {
  return (
    <div className="rounded-[16px] border border-nila-tint bg-surface p-6 shadow-[var(--shadow-lift)]">
      <p className="text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted">
        {finished ? "Pot terakhir" : `Pot ronde #${round + 1}`}
      </p>
      <p
        className="mt-2 text-[3.052rem] font-semibold leading-none text-ink"
        style={{ fontFamily: "var(--font-space-grotesk), sans-serif" }}
      >
        {toEth(pot)} <span className="text-[1.563rem] text-ink-soft">ETH</span>
      </p>
      <p className="mt-2 font-mono text-[0.875rem] text-muted">
        {formatWei(pot)} wei
      </p>
      <p className="mt-4 border-t border-line pt-3 text-sm text-ink-soft">
        Setoran{" "}
        <span className="font-mono">{toEth(contributionAmount)} ETH</span> ×{" "}
        {memberCount} anggota per ronde
      </p>
    </div>
  );
}
