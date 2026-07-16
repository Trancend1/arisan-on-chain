# ARCHITECTURE — Arisan On-Chain

Arsitektur sistem DApp arisan: local Ethereum node + smart contract + web UI Next.js.
Prinsip pemandu: **local-first, tanpa backend, reproducible dalam tiga perintah.**

---

## 1. Gambaran komponen

```
┌───────────────────────────────────────────────────────────────┐
│  Browser (Next.js SPA-ish, App Router)                         │
│                                                                │
│   UI components ──▶ hooks (TanStack Query) ──▶ viem clients    │
│        ▲                                          │            │
│        │  watchContractEvent (auto-refetch)       │ JSON-RPC   │
└────────┼──────────────────────────────────────────┼───────────┘
         │                                           ▼
         │                          ┌────────────────────────────┐
         └──────────────────────────│  Anvil node  :8545 (31337) │
                                    │  ┌──────────────────────┐  │
                                    │  │ ArisanChain (deployed)│ │
                                    │  └──────────────────────┘  │
                                    └────────────────────────────┘
```

Tidak ada server aplikasi, tidak ada database. Seluruh state persist di on-chain (storage EVM).
Frontend adalah satu-satunya "client" dan berbicara langsung ke node lewat JSON-RPC.

## 2. Tech stack & alasan

| Lapis | Pilihan | Alasan |
|---|---|---|
| Contract toolchain | **Foundry** (forge/anvil/cast) | Wajib TR; test cepat, gas report bawaan, deploy scripting. |
| Bahasa kontrak | **Solidity ^0.8.24** | Standar; checked arithmetic default. |
| Framework UI | **Next.js 15 (App Router) + TypeScript** | Familiar, DX bagus, cukup untuk demo lokal. |
| Interaksi chain | **viem** | Type-safe dari ABI, ringan, API modern, dukung `watchContractEvent`. |
| State server | **TanStack Query** | Cache read + refetch on-event, loading/error state rapi. |
| Styling | **Tailwind CSS** | Token dari design-system.md, iterasi cepat. |
| Akun (demo) | **Dev account switcher** (akun deterministik Anvil) | Pindah peran instan tanpa ganti wallet (ADR-002). |

Sengaja **tidak** memakai: backend/API, database, wagmi+RainbowKit (kelebihan untuk lab lokal),
state manager global berat. Tiap dependency harus membayar dirinya sendiri.

## 3. Struktur folder

Root = proyek Foundry; `app/` = deliverable "app/" pada daftar berkas TR (frontend Next.js).

```
arisan-chain/
├── foundry.toml
├── src/
│   ├── SimpleStorage.sol         # latihan fondasi (wajib TR, jangan dihapus)
│   └── ArisanChain.sol
├── test/
│   ├── SimpleStorage.t.sol
│   └── ArisanChain.t.sol
├── script/
│   └── Deploy.s.sol              # deploy + addMember×N + start
├── lib/                          # forge-std dsb.
├── app/                          # = "app/" deliverable TR (Next.js)
│   ├── src/
│   │   ├── app/                  # routes (App Router)
│   │   │   ├── layout.tsx
│   │   │   └── page.tsx          # dashboard arisan
│   │   ├── components/           # ArisanRing, RoundProgress, TxToast, AccountSwitcher, ...
│   │   ├── hooks/                # useArisan(), useContribute(), useCloseRound()
│   │   ├── lib/
│   │   │   ├── clients.ts        # publicClient + walletClient (viem)
│   │   │   ├── contract.ts       # address + ABI (di-import dari out/)
│   │   │   └── accounts.ts       # daftar akun deterministik Anvil (dev)
│   │   └── styles/               # tokens + tailwind config layer
│   ├── package.json
│   └── next.config.ts
├── bukti_deploy.txt
├── README.md
├── docs/
│   ├── arisanchain.md
│   ├── PRD.md
│   ├── ARCHITECTURE.md
│   └── design-system.md
└── laporan_TR_....docx
```

ABI kontrak di-generate `forge build` ke `out/ArisanChain.sol/ArisanChain.json`; frontend meng-import
`abi` dari situ (via script copy sederhana ke `app/src/lib/`), sehingga UI selalu sinkron dengan kontrak.

## 4. Model akun (demo lokal)

Anvil mem-provision 10 akun pre-funded 10000 ETH dengan private key deterministik (dari mnemonic
default). Frontend menyimpan daftar ini di `lib/accounts.ts` (khusus dev). `AccountSwitcher` memilih
akun aktif → `walletClient` viem dibuat dengan `privateKeyAccount(pk)` untuk menandatangani write.

- Akun #0 = admin (deploy & setup).
- Akun #1..#N = anggota.
- Ganti peran = pilih dari dropdown, bukan ganti network di MetaMask.

MetaMask tetap didukung sebagai jalur opsional ("connect real wallet") untuk menunjukkan pemahaman
pola DApp sebenarnya, tapi bukan jalur demo utama. Lihat ADR-002.

## 5. Alur interaksi (sequence)

### Contribute
```
Anggota klik "Setor" 
  └▶ useContribute(): walletClient.writeContract(contribute, value=amount)
       └▶ Anvil eksekusi tx ─▶ storage update ─▶ emit Contributed
            └▶ viem watchContractEvent(Contributed) trigger
                 └▶ TanStack Query invalidate roundProgress ─▶ UI refetch
                      └▶ TxToast tampilkan hash + gasUsed dari receipt
```

### Close round
```
Siapa pun klik "Tutup ronde" (aktif hanya jika pot penuh)
  └▶ useCloseRound(): writeContract(closeRound)
       └▶ Anvil: CEI (reset pot, hasReceived, round++) lalu transfer pot ke members[round]
            └▶ emit RoundClosed (+ ArisanFinished bila ronde terakhir)
                 └▶ watch ─▶ invalidate currentRound/recipient/pot ─▶ UI advance ke ronde berikut
```

Read (`getMembers`, `roundProgress`, `recipientOf`) dijalankan via `publicClient.readContract`
(eth_call, 0 gas) dan di-cache TanStack Query; refetch dipicu event, bukan polling ketat.

## 6. Deployment flow (reproducible)

`script/Deploy.s.sol` melakukan deploy + `addMember` untuk tiap akun anvil + `start()` dalam satu
`vm.startBroadcast()`, sehingga penguji cukup:

```bash
anvil                                   # terminal 1
forge script script/Deploy.s.sol \      # terminal 2
  --rpc-url http://127.0.0.1:8545 --broadcast
cd app && npm run dev                    # terminal 3
```

Karena Anvil deterministik, alamat kontrak hasil deploy juga predictable — frontend bisa membaca
alamat dari output broadcast (`broadcast/…/run-latest.json`) atau di-hardcode dari deploy pertama.
Ini yang mengangkat poin **reproducibility (rubrik Fondasi 25%)**.

## 7. Keputusan arsitektur (ADR)

### ADR-001 — Tanpa backend, frontend langsung ke RPC
**Konteks.** Data arisan seluruhnya on-chain; tidak ada kebutuhan penyimpanan off-chain.
**Keputusan.** Frontend memanggil node langsung via viem. Tidak ada API/DB.
**Konsekuensi.** Permukaan lebih kecil, reproduksi lebih mudah, tidak ada state ganda yang bisa
desync. Trade-off: query historis kompleks (indexing) tidak tersedia, tapi tidak dibutuhkan di sini.

### ADR-002 — Dev account switcher sebagai jalur demo utama (bukan wallet-only)
**Konteks.** Arisan butuh bertindak sebagai N anggota untuk `contribute`. Wallet-only memaksa ganti
akun MetaMask berkali-kali tiap ronde — lambat dan rawan salah saat presentasi.
**Keputusan.** UI menyediakan account switcher berbasis akun deterministik Anvil; MetaMask opsional.
**Konsekuensi.** Demo satu siklus penuh jadi cepat dan mulus. Jujur sebagai tool lab (private key dev
memang publik & di-hardcode khusus lokal). Untuk produksi ini tidak boleh — dicatat eksplisit.

### ADR-003 — Rotasi deterministik, bukan undian acak
**Konteks.** Randomness on-chain naif bisa dimanipulasi validator.
**Keputusan.** Penerima ronde = `members[round]`, urutan dikunci saat `start()`.
**Konsekuensi.** Nol permukaan serangan randomness; setia pada arisan nyata; bahan analisis keamanan
yang kuat. Detail di arisanchain.md §6.

## 8. Ownership tim (pembagian A/B)

Freeze ABI (signature fungsi + event pada arisanchain.md §3–§4) berdua di hari-1. Setelahnya paralel:

| Area | Owner A (contract) | Owner B (interface) |
|---|---|---|
| Folder | `src/`, `test/`, `script/` | `app/` |
| Output | ArisanChain.sol, unit test, Deploy.s.sol, gas report | Web UI, hooks viem, README setup |
| Bukti | tx hash & gas dari sisi kontrak | perubahan state & tx hash dari sisi app |
| Pertanyaan G | Q2, Q4, Q7 (+ Q5 jika Geth) | Q1, Q3, Q6 |

Titik sinkron: (1) freeze ABI, (2) B clean-room reproduce README milik A untuk verifikasi fondasi,
(3) cross-review + demo prep sebelum submit. Beda folder = minim merge conflict; cross-commit =
bukti kolaborasi untuk poin tim.

## 9. Referensi silang
- Spesifikasi kontrak: `arisanchain.md`
- Kebutuhan produk & acceptance criteria: `PRD.md`
- Token visual & komponen UI: `design-system.md`
