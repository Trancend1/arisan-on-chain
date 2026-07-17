"use client";

import { useMutation } from "@tanstack/react-query";
import { makeWalletClient, publicClient } from "@/lib/clients";
import { arisanContract } from "@/lib/contract";
import { useActiveAccount } from "./useActiveAccount";
import { useTxLifecycle, type TxResult } from "./useTxLifecycle";

/** Setor `contributionAmount` sebagai akun aktif (F-4). */
export function useContribute() {
  const { account } = useActiveAccount();
  const runTx = useTxLifecycle();

  return useMutation<TxResult, Error, { amount: bigint }>({
    mutationFn: ({ amount }) =>
      runTx(
        {
          pending: "Menyetor…",
          success: "Setoran tercatat",
          errorTitle: "Setoran gagal",
        },
        async () => {
          const wallet = makeWalletClient(account.privateKey);
          // Simulate dulu agar revert reason terbaca sebelum tx dikirim.
          const { request } = await publicClient.simulateContract({
            ...arisanContract,
            functionName: "contribute",
            account: wallet.account,
            value: amount,
          });
          return wallet.writeContract(request);
        },
      ),
  });
}
