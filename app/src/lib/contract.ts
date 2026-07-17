import { arisanChainAbi } from "./abi";

// Alamat hasil deploy pertama Anvil deterministik (broadcast/…/run-latest.json).
// Bisa dioverride via env bila deploy ulang menghasilkan alamat berbeda.
export const ARISAN_ADDRESS = (process.env.NEXT_PUBLIC_ARISAN_ADDRESS ??
  "0x5FbDB2315678afecb367f032d93F642f64180aa3") as `0x${string}`;

/** Pasangan address+abi siap spread ke readContract/writeContract viem. */
export const arisanContract = {
  address: ARISAN_ADDRESS,
  abi: arisanChainAbi,
} as const;

export { arisanChainAbi };

export const ArisanState = {
  Setup: 0,
  Active: 1,
  Finished: 2,
} as const;
export type ArisanStateValue = (typeof ArisanState)[keyof typeof ArisanState];
