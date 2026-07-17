import { formatEther } from "viem";

/** `0xf39Fd6…2266` — alamat/hash selalu mono + terpangkas (design-system §5). */
export function truncateHex(value: string, head = 6, tail = 4): string {
  if (value.length <= head + tail + 1) return value;
  return `${value.slice(0, head)}…${value.slice(-tail)}`;
}

/** Wei → string ETH ringkas, mis. 3000000000000000000n → "3". */
export function toEth(wei: bigint): string {
  return formatEther(wei);
}

/** Format Wei dengan pemisah ribuan untuk baris konversi mono. */
export function formatWei(wei: bigint): string {
  return wei.toLocaleString("id-ID");
}
