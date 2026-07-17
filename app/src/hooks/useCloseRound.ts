"use client";

import { useMutation } from "@tanstack/react-query";
import { makeWalletClient, publicClient } from "@/lib/clients";
import { arisanContract } from "@/lib/contract";
import { useActiveAccount } from "./useActiveAccount";
import { useTxLifecycle, type TxResult } from "./useTxLifecycle";

/** Tutup ronde penuh — sengaja boleh dipanggil siapa pun (F-6, arisanchain.md). */
export function useCloseRound() {
  const { account } = useActiveAccount();
  const runTx = useTxLifecycle();

  return useMutation<TxResult, Error, void>({
    mutationFn: () =>
      runTx(
        {
          pending: "Menutup ronde…",
          success: "Pot terkirim ke penerima",
          errorTitle: "Tutup ronde gagal",
        },
        async () => {
          const wallet = makeWalletClient(account.privateKey);
          const { request } = await publicClient.simulateContract({
            ...arisanContract,
            functionName: "closeRound",
            account: wallet.account,
          });
          return wallet.writeContract(request);
        },
      ),
  });
}
