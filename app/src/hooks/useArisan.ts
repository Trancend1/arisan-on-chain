"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { publicClient } from "@/lib/clients";
import { arisanContract, ArisanState, type ArisanStateValue } from "@/lib/contract";

export type ArisanSnapshot = {
  state: ArisanStateValue;
  admin: `0x${string}`;
  contributionAmount: bigint;
  currentRound: bigint;
  totalRounds: bigint;
  pot: bigint;
  members: readonly `0x${string}`[];
  /** roundProgress(): berapa anggota sudah setor ronde berjalan. */
  paid: bigint;
  total: bigint;
  /** recipientOf(currentRound) — hanya saat Active. */
  recipient: `0x${string}` | null;
  /** hasContributed[currentRound][member], sejajar dengan `members`. */
  contributed: readonly boolean[];
};

export const ARISAN_QUERY_KEY = ["arisan"] as const;
export const HISTORY_QUERY_KEY = ["arisan", "history"] as const;

async function fetchSnapshot(): Promise<ArisanSnapshot> {
  // Semua read dipaku ke satu blok supaya snapshot atomik — tanpa ini,
  // closeRound yang masuk di sela read paralel bisa menghasilkan kombinasi
  // state/currentRound tidak konsisten (recipientOf revert ROUND_OUT_OF_RANGE).
  const blockNumber = await publicClient.getBlockNumber({ cacheTime: 0 });
  const [state, admin, contributionAmount, currentRound, totalRounds, pot, members, progress] =
    await Promise.all([
      publicClient.readContract({ ...arisanContract, functionName: "state", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "admin", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "contributionAmount", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "currentRound", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "totalRounds", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "pot", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "getMembers", blockNumber }),
      publicClient.readContract({ ...arisanContract, functionName: "roundProgress", blockNumber }),
    ]);

  const [contributed, recipient] = await Promise.all([
    Promise.all(
      members.map((m) =>
        publicClient.readContract({
          ...arisanContract,
          functionName: "hasContributed",
          args: [currentRound, m],
          blockNumber,
        }),
      ),
    ),
    state === ArisanState.Active
      ? publicClient.readContract({
          ...arisanContract,
          functionName: "recipientOf",
          args: [currentRound],
          blockNumber,
        })
      : Promise.resolve(null),
  ]);

  const [paid, total] = progress;
  return {
    state: state as ArisanStateValue,
    admin,
    contributionAmount,
    currentRound,
    totalRounds,
    pot,
    members,
    paid,
    total,
    recipient,
    contributed,
  };
}

/** Snapshot on-chain lengkap untuk dashboard; refetch dipicu event (F-8). */
export function useArisan() {
  return useQuery({
    queryKey: ARISAN_QUERY_KEY,
    queryFn: fetchSnapshot,
    retry: 1,
    // Fallback bila event watcher mati (node putus): deteksi & pulih otomatis.
    refetchInterval: 15_000,
  });
}

export type RoundHistoryEntry = {
  round: bigint;
  recipient: `0x${string}`;
  payout: bigint;
  txHash: `0x${string}`;
};

/** Riwayat RoundClosed dari genesis — Anvil lokal, getLogs murah (ADR-001). */
export function useRoundHistory() {
  return useQuery({
    queryKey: HISTORY_QUERY_KEY,
    queryFn: async (): Promise<RoundHistoryEntry[]> => {
      const logs = await publicClient.getContractEvents({
        ...arisanContract,
        eventName: "RoundClosed",
        fromBlock: 0n,
      });
      return logs
        .filter((log) => log.args.round !== undefined)
        .map((log) => ({
          round: log.args.round!,
          recipient: log.args.recipient!,
          payout: log.args.payout!,
          txHash: log.transactionHash,
        }));
    },
    retry: 1,
  });
}

/**
 * Pasang watcher semua event kontrak → invalidate query (auto-refetch, F-8).
 * Panggil SEKALI di level halaman; jangan di banyak komponen.
 *
 * @returns `true` bila koneksi ke node terputus (poll watcher gagal).
 *   Deteksi offline sengaja DI LUAR React Query: memaksa refetch gagal lewat
 *   invalidateQueries rawan dibatalkan oleh invalidasi lain yang beruntun
 *   (CancelledError di-swallow query-core → status error tak pernah tercapai).
 */
export function useArisanEvents(): boolean {
  const queryClient = useQueryClient();
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unwatch = publicClient.watchContractEvent({
      ...arisanContract,
      pollingInterval: 1_000,
      onLogs: () => {
        setOffline(false);
        queryClient.invalidateQueries({ queryKey: ARISAN_QUERY_KEY });
      },
      onError: () => setOffline(true),
    });
    return unwatch;
  }, [queryClient]);

  // Selama offline: ping ringan sampai node kembali, lalu segarkan semua data.
  useEffect(() => {
    if (!offline) return;
    const timer = setInterval(async () => {
      try {
        await publicClient.getBlockNumber({ cacheTime: 0 });
        setOffline(false);
        queryClient.invalidateQueries({ queryKey: ARISAN_QUERY_KEY });
      } catch {
        // masih offline — biarkan interval mencoba lagi
      }
    }, 2_000);
    return () => clearInterval(timer);
  }, [offline, queryClient]);

  return offline;
}
