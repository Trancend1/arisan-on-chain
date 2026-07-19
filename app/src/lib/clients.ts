import { createPublicClient, createWalletClient, http } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { foundry } from "viem/chains";

// Anvil lokal — chainId 31337 (PRD.md §7).
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ?? "http://127.0.0.1:8545";

/** Transport lab lokal: gagal cepat, tanpa retry+backoff panjang bawaan viem,
 *  supaya UI segera tahu saat Anvil tidak berjalan. */
const transport = http(RPC_URL, { retryCount: 1, timeout: 3_000 });

/** Client read-only (eth_call, getLogs, receipt) — dipakai semua query. */
export const publicClient = createPublicClient({
  chain: foundry,
  transport,
});

/** Wallet client untuk akun dev aktif; dibuat ulang tiap ganti akun (ADR-002). */
export function makeWalletClient(privateKey: `0x${string}`) {
  return createWalletClient({
    chain: foundry,
    account: privateKeyToAccount(privateKey),
    transport,
  });
}
