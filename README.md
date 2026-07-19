# Arisan On-Chain

DApp arisan (ROSCA — rotating savings) di atas Ethereum lokal, untuk TR Teknologi Blockchain (TC789A). Satu smart contract `ArisanChain.sol` (Foundry) + satu web UI (Next.js + viem). Pemenang tiap ronde ditentukan **rotasi deterministik** (urutan anggota dikunci saat mulai), bukan undian on-chain.

- **Jaringan:** Anvil lokal — RPC `http://127.0.0.1:8545`, chainId `31337`
- **Alamat kontrak (deterministik, deploy pertama di Anvil segar):** `0x5FbDB2315678afecb367f032d93F642f64180aa3`
- **Bukti deploy & tx hash:** lihat [`bukti_deploy.txt`](bukti_deploy.txt)
- **Panduan uji manual / demo responsi:** lihat [`testing.md`](testing.md)

## Prasyarat

| Kebutuhan | Keterangan |
| --- | --- |
| WSL2 Ubuntu 24.04 | Seluruh perintah Foundry dijalankan di terminal WSL |
| Foundry (forge/anvil/cast) | `curl -L https://foundry.paradigm.xyz \| bash` lalu `foundryup` |
| Node.js ≥ 20 + npm | Untuk web UI (`app/`) — dijalankan dari Windows atau WSL |

> `forge-std` sudah di-vendor di `lib/` — **tidak perlu** `forge install` / submodule.

## Menjalankan (3 perintah)

Tiga terminal terpisah, urut:

```bash
# Terminal 1 (WSL) — node lokal; biarkan tetap berjalan
anvil

# Terminal 2 (WSL, dari root repo) — deploy + daftar 5 anggota + start()
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast

# Terminal 3 (dari folder app/) — web UI di http://localhost:3000
cd app && npm install && npm run dev
```

Buka `http://localhost:3000`. Pilih akun lewat dropdown **"Bertindak sebagai"**, lalu jalankan siklus: setor 1 ETH per anggota → **Tutup ronde** saat pot penuh → ulangi 5 ronde sampai status **Selesai**. Setiap transaksi menampilkan **tx hash + gas terpakai** (TxToast).

> **Penting:** alamat kontrak `0x5FbD…0aa3` hanya muncul bila deploy adalah transaksi pertama akun #0 (nonce 0) di Anvil **segar**. Kalau deploy ulang tanpa restart Anvil, alamat berubah — set `NEXT_PUBLIC_ARISAN_ADDRESS=<alamat_baru>` di `app/.env.local`, atau cukup restart `anvil` lalu deploy ulang.

## Verifikasi cepat

```bash
# Unit test kontrak (20 test: happy path, access control, reentrancy)
forge test

# Cek kontrak dari CLI (read, 0 gas)
cast call 0x5FbDB2315678afecb367f032d93F642f64180aa3 "state()(uint8)" --rpc-url http://127.0.0.1:8545
```

## Struktur repo

| Path | Isi | Owner |
| --- | --- | --- |
| `src/ArisanChain.sol` | Kontrak aplikasi (3 state, 4 write, 3 read, 5 event, CEI) | A |
| `src/SimpleStorage.sol` | Kontrak latihan fondasi TR (template Langkah 4) | A |
| `test/` | Unit test Foundry (incl. reentrancy attacker) | A |
| `script/Deploy.s.sol` | Deploy + addMember×5 + start dalam satu broadcast | A |
| `app/` | Web UI Next.js 15 + viem + TanStack Query | B |
| `arisanchain.md` | Spesifikasi kontrak — sumber kebenaran ABI & keamanan | — |
| `PRD.md` / `ARCHITECTURE.md` / `design-system.md` | Dokumen produk, arsitektur, desain | — |
| `bukti_deploy.txt` | Bukti alamat, tx hash, gas, perubahan state | — |
| `testing.md` | Panduan uji manual & demo responsi (Langkah 1–7 TR) | — |

## Dokumen terkait

- Spesifikasi kontrak & analisis keamanan: [`arisanchain.md`](arisanchain.md)
- Kebutuhan produk & user stories: [`PRD.md`](PRD.md)
- Arsitektur & ADR: [`ARCHITECTURE.md`](ARCHITECTURE.md)
