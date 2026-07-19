"use client";

import type { RoundHistoryEntry } from "@/hooks/useArisan";
import { labelFor } from "@/lib/accounts";
import { toEth } from "@/lib/format";
import { CopyMono } from "./CopyMono";

type RowStatus = "received" | "active" | "waiting";

type Row = {
  round: number;
  recipient: string;
  status: RowStatus;
  payout?: bigint;
  txHash?: `0x${string}`;
};

function StatusBadge({ status, payout }: { status: RowStatus; payout?: bigint }) {
  if (status === "received")
    return (
      <span className="text-sm font-medium text-jade">
        Menerima{payout !== undefined ? ` ${toEth(payout)} ETH` : ""}
      </span>
    );
  if (status === "active")
    return (
      <span className="text-sm font-medium text-kunyit-deep">
        Giliran ronde ini
      </span>
    );
  return <span className="text-sm text-muted">Menunggu</span>;
}

type HistoryTableProps = {
  members: readonly string[];
  currentRound: number;
  finished: boolean;
  history: RoundHistoryEntry[];
  /** Query log RoundClosed gagal — nominal & tx hash mungkin kosong. */
  historyFailed?: boolean;
};

/**
 * Riwayat penerima per ronde (F-5, F-10). Penerima ronde r = members[r]
 * (rotasi deterministik, ADR-003); tx hash diambil dari event RoundClosed.
 */
export function HistoryTable({
  members,
  currentRound,
  finished,
  history,
  historyFailed = false,
}: HistoryTableProps) {
  const byRound = new Map(history.map((h) => [Number(h.round), h]));
  const rows: Row[] = members.map((recipient, round) => {
    const closed = byRound.get(round);
    const status: RowStatus =
      finished || round < currentRound
        ? "received"
        : round === currentRound
          ? "active"
          : "waiting";
    return {
      round,
      recipient,
      status,
      payout: closed?.payout,
      txHash: closed?.txHash,
    };
  });

  return (
    <div className="rounded-[16px] border border-nila-tint bg-surface p-6 shadow-[var(--shadow-card)]">
      <h2 className="text-[1.25rem] font-semibold text-ink">Giliran penerima</h2>

      {historyFailed && (
        <p className="mt-2 text-[0.8rem] text-rust">
          Riwayat transaksi gagal dimuat — nominal dan tx hash ronde yang sudah
          ditutup mungkin belum tampil.
        </p>
      )}

      {/* Desktop: tabel */}
      <table className="mt-4 hidden w-full text-left md:table">
        <thead>
          <tr className="border-b border-line text-[0.75rem] font-medium uppercase tracking-[0.12em] text-muted">
            <th className="py-2 pr-4">Ronde</th>
            <th className="py-2 pr-4">Penerima</th>
            <th className="py-2 pr-4">Status</th>
            <th className="py-2">Tx hash</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.round}
              className={`border-b border-line last:border-b-0 ${
                row.status === "active"
                  ? "border-l-4 border-l-kunyit bg-kunyit/5"
                  : ""
              }`}
            >
              <td className="py-3 pr-4 font-mono text-[0.875rem]">
                {row.round + 1}
              </td>
              <td className="py-3 pr-4">
                <span className="mr-2 text-sm text-ink">
                  {labelFor(row.recipient)}
                </span>
                <CopyMono value={row.recipient} />
              </td>
              <td className="py-3 pr-4">
                <StatusBadge status={row.status} payout={row.payout} />
              </td>
              <td className="py-3">
                {row.txHash ? (
                  <CopyMono value={row.txHash} />
                ) : (
                  <span className="text-muted">—</span>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Mobile: kartu bertumpuk (quality floor §7) */}
      <ul className="mt-4 space-y-3 md:hidden">
        {rows.map((row) => (
          <li
            key={row.round}
            className={`rounded-[10px] border border-line p-3 ${
              row.status === "active" ? "border-l-4 border-l-kunyit" : ""
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[0.875rem] text-muted">
                Ronde {row.round + 1}
              </span>
              <StatusBadge status={row.status} payout={row.payout} />
            </div>
            <p className="mt-1 text-sm text-ink">{labelFor(row.recipient)}</p>
            <div className="mt-1 flex flex-col gap-0.5">
              <CopyMono value={row.recipient} />
              {row.txHash && <CopyMono value={row.txHash} />}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
