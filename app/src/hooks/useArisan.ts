"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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
  const [state, admin, contributionAmount, currentRound, totalRounds, pot, members, progress] =
    await Promise.all([
      publicClient.readContract({ ...arisanContract, functionName: "state" }),
      publicClient.readContract({ ...arisanContract, functionName: "admin" }),
      publicClient.readContract({ ...arisanContract, functionName: "contributionAmount" }),
      publicClient.readContract({ ...arisanContract, functionName: "currentRound" }),
      publicClient.readContract({ ...arisanContract, functionName: "totalRounds" }),
      publicClient.readContract({ ...arisanContract, functionName: "pot" }),
      publicClient.readContract({ ...arisanContract, functionName: "getMembers" }),
      publicClient.readContract({ ...arisanContract, functionName: "roundProgress" }),
    ]);

  const [contributed, recipient] = await Promise.all([
    Promise.all(
      members.map((m) =>
        publicClient.readContract({
          ...arisanContract,
          functionName: "hasContributed",
          args: [currentRound, m],
        }),
      ),
    ),
    state === ArisanState.Active
      ? publicClient.readContract({
          ...arisanContract,
          functionName: "recipientOf",
          args: [currentRound],
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
 */
export function useArisanEvents() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const unwatch = publicClient.watchContractEvent({
      ...arisanContract,
      pollingInterval: 1_000,
      onLogs: () => {
        queryClient.invalidateQueries({ queryKey: ARISAN_QUERY_KEY });
      },
    });
    return unwatch;
  }, [queryClient]);
}
