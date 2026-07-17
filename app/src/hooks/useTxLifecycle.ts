"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";
import { publicClient } from "@/lib/clients";
import { revertMessage } from "@/lib/errors";
import { ARISAN_QUERY_KEY } from "./useArisan";
import { useToasts } from "./useToasts";

export type TxCopy = { pending: string; success: string; errorTitle: string };
export type TxResult = { hash: `0x${string}`; gasUsed: bigint };

/**
 * Siklus hidup satu write tx (F-7): toast pending → isi hash setelah kirim →
 * tunggu receipt → toast success dengan gasUsed, atau toast error dengan
 * revert reason yang sudah diterjemahkan. Selalu invalidate query arisan.
 */
export function useTxLifecycle() {
  const { push, update } = useToasts();
  const queryClient = useQueryClient();

  return useCallback(
    async (copy: TxCopy, send: () => Promise<`0x${string}`>): Promise<TxResult> => {
      const toastId = push({ status: "pending", title: copy.pending });
      try {
        const hash = await send();
        update(toastId, { hash });
        const receipt = await publicClient.waitForTransactionReceipt({ hash });
        if (receipt.status !== "success") throw new Error("TX_REVERTED");
        update(toastId, {
          status: "success",
          title: copy.success,
          gasUsed: receipt.gasUsed,
        });
        return { hash, gasUsed: receipt.gasUsed };
      } catch (err) {
        update(toastId, {
          status: "error",
          title: copy.errorTitle,
          message: revertMessage(err),
        });
        throw err;
      } finally {
        queryClient.invalidateQueries({ queryKey: ARISAN_QUERY_KEY });
      }
    },
    [push, update, queryClient],
  );
}
