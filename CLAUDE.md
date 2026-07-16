# Arisan On-Chain

DApp arisan (ROSCA) di Ethereum lokal: **satu** smart contract `ArisanChain.sol` (Foundry/Anvil) + **satu** web UI (Next.js + viem). Ini tugas TR Blockchain (TC789A), lab lokal-only — BUKAN produk mainnet, tanpa backend, tanpa database, tanpa undian acak.

> **Current Orchestrator:** Lead Technical Orchestrator (sesuai `~/.claude/WORKFLOW.md`)
> **Active Sprint/Phase:** Phase 1 — Fondasi Kontrak

---

## 1. Documentation Map

| Topic | Source of Truth |
| --- | --- |
| Kebutuhan produk, user stories, acceptance criteria TR | `PRD.md` |
| Arsitektur, stack, struktur folder, ADR, ownership tim | `ARCHITECTURE.md` |
| Spesifikasi kontrak (ABI, state, invariant, keamanan) | `arisanchain.md` |
| Token visual & komponen UI | `design-system.md` |

**Rule:** Baca dokumen terkait sebelum keputusan produk/UX/implementasi. Jika dok bertentangan dengan kode, flag — jangan diam-diam ikut kode.

---

## 2. Progress — Eksekusi Sprint

### 2.1 Roadmap

```txt
Phase 0: Dokumen & Strategy Lock          [SELESAI]
  → Phase 1: Fondasi Kontrak (Foundry)    [AKTIF]
  → Phase 2: Web UI (app/)
  → Phase 3: Integrasi, Bukti & Demo
  → Phase 4: Laporan & Submit
```

**Phase 0 — Dokumen (selesai)**
- PRD, ARCHITECTURE, arisanchain, design-system tertulis dan konsisten.

**Phase 1 — Fondasi Kontrak** *(Owner A: `src/`, `test/`, `script/`)*
- Scaffold Foundry (`forge init`), `foundry.toml`, `SimpleStorage.sol` + test (wajib TR, jangan dihapus).
- **Freeze ABI hari-1** berdua (signature fungsi + event dari `arisanchain.md` §3–§4) — setelah ini Phase 2 boleh jalan paralel.
- `ArisanChain.sol` sesuai spesifikasi: 3 state (Setup/Active/Finished), 4 write, 3 read, 5 event, CEI pada `closeRound`.
- Unit test `ArisanChain.t.sol` (happy path + access control + reentrancy attacker) hijau; gas report.
- `Deploy.s.sol`: deploy + `addMember`×N + `start()` dalam satu broadcast ke Anvil.

**Phase 2 — Web UI** *(Owner B: `app/`, paralel setelah ABI freeze)*
- Next.js 15 App Router + TypeScript + Tailwind (token dari `design-system.md`).
- `lib/clients.ts` (viem), `lib/contract.ts` (ABI dari `out/`), `lib/accounts.ts` (akun Anvil).
- Hooks TanStack Query: `useArisan`, `useContribute`, `useCloseRound`; refetch via `watchContractEvent`.
- Komponen: ArisanRing (signature), RoundProgress, TxToast (hash + gasUsed), AccountSwitcher (ADR-002).

**Phase 3 — Integrasi, Bukti & Demo**
- Alur penuh F-1..F-7 jalan end-to-end di Anvil: setup → contribute × N → closeRound × N → Finished.
- `bukti_deploy.txt`: alamat akun, tx hash, alamat kontrak, gas, perubahan state.
- Owner B clean-room reproduce README milik Owner A (3 perintah: `anvil` → `forge script` → `npm run dev`).

**Phase 4 — Laporan & Submit**
- Laporan TR (pemetaan rubrik di `PRD.md` §6), jawaban pertanyaan G sesuai pembagian, demo prep, cross-review.

### 2.2 Phase Gate (checklist keluar tiap phase)

- [ ] **Scope:** semua deliverable phase selesai; scope creep dicatat sebagai carry-forward
- [ ] **Build:** `forge build` / `npm run build` nol error nol warning; typecheck bersih
- [ ] **Tests:** `forge test` (Phase 1+) / cek manual alur UI (Phase 2+) lolos
- [ ] **Docs:** CLAUDE.md §2.3 diupdate bila phase aktif berubah
- [ ] **Handoff:** catatan handoff per WORKFLOW.md §8

### 2.3 Active Phase

**Active phase:** Phase 2 — Web UI (`app/`)

**Sprint focus:** Next.js + viem + TanStack Query; hooks & komponen sesuai `design-system.md`; ABI diambil dari `out/ArisanChain.sol/ArisanChain.json`.

**Exit criteria Phase 1 (terpenuhi 2026-07-16):**
- [x] `forge test` hijau (20/20) termasuk `test_ReentrancyBlocked` & access control
- [x] `forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast` sukses — kontrak di `0x5FbDB2315678afecb367f032d93F642f64180aa3`, 7 tx (deploy + addMember×5 + start) di `broadcast/Deploy.s.sol/31337/run-latest.json`
- [x] ABI frozen per `arisanchain.md` §3–§4 — perubahan signature butuh persetujuan kedua owner

**Next:** Phase 3 (Integrasi & bukti) setelah UI satu siklus penuh jalan.

### 2.4 Phase Log

| Phase | Status | Lesson | Carry-forward |
| --- | --- | --- | --- |
| Phase 0 | Complete | Spesifikasi rinci di depan mempermudah paralelisasi A/B | ABI di `arisanchain.md` §3–§4 adalah kontrak antar-owner |
| Phase 1 | Complete | Foundry hanya di WSL (bukan Windows PATH) — semua perintah forge/anvil lewat `wsl` | Anvil harus jalan sebelum deploy; forge-std di-vendor di `lib/` (tanpa submodule) supaya reproduce tanpa `forge install` |
| Phase 2 | Active | — | — |

---

## 3. Stack (Locked)

- **Contract:** Foundry (forge/anvil/cast), Solidity `^0.8.24`
- **Web:** Next.js 15 (App Router) + TypeScript, viem, TanStack Query, Tailwind CSS
- **Node:** Anvil `http://127.0.0.1:8545`, chainId `31337` (WAJIB Anvil, bukan Geth)

**Deferred / out of scope:** mainnet/testnet publik, backend/API/DB, wagmi + RainbowKit, KYC, denda keterlambatan, undian acak on-chain (ADR-003).

**Banned tanpa override eksplisit:** dependency baru di luar daftar di atas, randomness on-chain, state manager global berat.

---

## 4. AI Instructions

### 4.1 Before Coding
1. Baca file ini, lalu dokumen §1 yang relevan dengan track-mu.
2. Cek phase aktif (§2.3). Jangan kerjakan phase yang belum dibuka.
3. `rtk git status --short --branch` — kalau ada WIP overlap, lapor dulu.
4. Hormati ownership folder: Owner A = `src/`, `test/`, `script/`; Owner B = `app/`. Isu lintas-batas → flag di handoff, jangan langsung fix.

### 4.2 Code Rules
- Prefix shell command dengan `rtk` bila wrapper tersedia.
- Kontrak: ikuti spesifikasi `arisanchain.md` persis (nama fungsi, event, invariant, CEI). Perubahan ABI = keputusan berdua.
- Frontend: warna & tipografi hanya dari token `design-system.md`; kunyit hanya untuk aksi primer/penerima aktif.
- TypeScript: tanpa `any` kecuali didokumentasikan inline; write via hooks, bukan panggilan viem langsung dari komponen.
- Tiap write transaction wajib menampilkan tx hash + gasUsed (F-7 — ini kriteria nilai).

### 4.3 Anti-Slop
- Jangan klaim selesai tanpa bukti verifikasi (`forge test`, alur UI jalan).
- Jangan tambah layer/dependency baru tanpa persetujuan orchestrator.
- Jangan scaffold kode kalau user hanya minta dokumen/strategi.
- Jangan hapus `SimpleStorage.sol` — deliverable wajib TR.

### 4.4 Scope Discipline
Build vertikal: kontrak teruji dulu → UI satu alur penuh → bukti & laporan. Satu siklus arisan yang demo-able mengalahkan sepuluh fitur setengah jadi. Ragu antara spectacle dan correctness → pilih correctness.

### 4.5 Communication
- Bahasa Indonesia ringkas (default user).
- Rujuk file & section persis saat menjelaskan keputusan.
- Konflik (stack change, phase jump, scope creep) → flag lebih awal.

### 4.6 Contribution Identity

> **Copy this section verbatim into every project AGENTS.md / CLAUDE.md. Do not modify.**

AI is a ghostwriter. Repository accountability remains with the human owner.

- Do not add `Co-Authored-By: Claude` or any AI/model co-author trailer to commits.
- Do not add "Generated with Claude Code" or equivalent tags to commit messages or PR bodies.
- Do not push commits with AI or bot author identity.
- Do not make AI appear in the GitHub contributor graph.
- Author and committer identity must be the repo owner's human identity configured for the project.
- If AI assistance needs to be disclosed, mention it only in normal prose in a PR description or changelog, never in git metadata.

---

## 5. Tracks Aktif (ringkas)

Model agent & track lengkap ada di `~/.claude/WORKFLOW.md` §5–§6. Untuk proyek ini cukup:

| Track | Scope | Owner | Phase |
| --- | --- | --- | --- |
| T3/T4 | Kontrak + test + deploy script (`src/`, `test/`, `script/`) | Owner A | 1 |
| T1/T2 | Web UI + hooks + design system (`app/`) | Owner B | 2 |
| T6 | Validasi end-to-end + clean-room reproduce | Berdua (cross) | 3 |
| T0/T9 | Bukti, laporan, release gate | Berdua | 3–4 |

**Titik sinkron wajib:** (1) freeze ABI hari-1, (2) clean-room reproduce README, (3) cross-review sebelum submit.
