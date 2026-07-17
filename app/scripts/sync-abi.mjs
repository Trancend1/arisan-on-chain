// Salin ABI ArisanChain dari artifact Foundry (out/) ke src/lib/abi.ts
// supaya frontend selalu sinkron dengan kontrak (ARCHITECTURE.md §3).
// Dijalankan otomatis lewat predev/prebuild.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const artifact = join(here, "..", "..", "out", "ArisanChain.sol", "ArisanChain.json");
const target = join(here, "..", "src", "lib", "abi.ts");

if (!existsSync(artifact)) {
  if (existsSync(target)) {
    console.log("[sync-abi] out/ tidak ditemukan; memakai src/lib/abi.ts yang sudah ada.");
    process.exit(0);
  }
  console.error("[sync-abi] Artifact tidak ditemukan. Jalankan `forge build` di root repo dulu.");
  process.exit(1);
}

mkdirSync(dirname(target), { recursive: true });
const { abi } = JSON.parse(readFileSync(artifact, "utf8"));
const banner =
  "// AUTO-GENERATED oleh scripts/sync-abi.mjs dari out/ArisanChain.sol/ArisanChain.json.\n" +
  "// Jangan edit manual — jalankan `npm run sync-abi` setelah `forge build`.\n";
writeFileSync(target, `${banner}export const arisanChainAbi = ${JSON.stringify(abi, null, 2)} as const;\n`);
console.log("[sync-abi] src/lib/abi.ts diperbarui dari artifact Foundry.");
