# Panduan Uji Manual & Demo Responsi — Arisan On-Chain (TR TC789A)

Panduan ini mengikuti **Lembar TR TC789A "Implementasi Blockchain Ethereum pada Aplikasi (DApp)"** Langkah 1–7, ditambah pengujian aplikasi Arisan On-Chain. Setiap bagian berisi: perintah persis, output yang diharapkan, dan **titik ambil bukti** (📷 = wajib FOTO terminal — bukan screenshot — sesuai ketentuan anti-plagiat TR).

**Konvensi terminal:**
- `PS>` = PowerShell Windows
- `$` = terminal WSL Ubuntu 24.04 (`wsl -d Ubuntu-24.04`)
- Semua perintah `forge`/`cast`/`anvil` dijalankan di **WSL**, dari root repo (`/mnt/d/DevSpace/Projects/arisan-on-chain` — sesuaikan dengan path clone kalian)
- Web UI (`npm`) boleh dijalankan dari Windows maupun WSL

**Konstanta yang dipakai di seluruh panduan:**

```
RPC        = http://127.0.0.1:8545          (Anvil, chainId 31337)
ARISAN     = 0x5FbDB2315678afecb367f032d93F642f64180aa3
SIMPLE     = 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
PK_ADMIN   = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80  (akun #0)
PK_A1      = 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d  (akun #1)
PK_A2      = 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a  (akun #2)
PK_A3      = 0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6  (akun #3)
PK_A4      = 0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a  (akun #4)
PK_A5      = 0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba  (akun #5)
```

Alamat `ARISAN` dan `SIMPLE` **deterministik** selama urutan Bagian 4 diikuti pada Anvil segar (deploy ArisanChain = nonce 0 akun #0; SimpleStorage = nonce 7). Private key di atas adalah akun default Anvil — publik dan hanya untuk lab lokal.

---

## Bagian 1 — Verifikasi Lingkungan (TR Langkah 1–2)

| # | Perintah | Output diharapkan |
| --- | --- | --- |
| 1 | `PS> wsl --version` | WSL versi 2.x |
| 2 | `PS> wsl -d Ubuntu-24.04` | Masuk shell Ubuntu |
| 3 | `$ cat /etc/os-release` | `VERSION="24.04.x LTS (Noble Numbat)"` |
| 4 | `$ forge --version && cast --version && anvil --version` | Versi Foundry (1.x) untuk ketiganya |
| 5 | `$ git --version && node --version` | Versi git & Node ≥ 20 |


> Kalau `forge: command not found`: jalankan `source ~/.bashrc`, atau tambah PATH manual: `export PATH=$PATH:~/.foundry/bin`. Belum terinstal? `curl -L https://foundry.paradigm.xyz | bash && source ~/.bashrc && foundryup`.

---

## Bagian 2 — Node Lokal Anvil (TR Langkah 3)

**Terminal 1 (WSL) — biarkan berjalan selama seluruh pengujian:**

```bash
anvil
```

Output diharapkan: 10 akun + private key masing-masing 10000 ETH, `Listening on 127.0.0.1:8545`, Chain ID `31337`.

**Terminal 2 (WSL) — verifikasi node:**

```bash
cast rpc eth_blockNumber --rpc-url http://127.0.0.1:8545
# → "0x0"  (blok genesis)

cast balance 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 --rpc-url http://127.0.0.1:8545
# → 10000000000000000000000  (10000 ETH dalam Wei = 10^22)

cast chain-id --rpc-url http://127.0.0.1:8545
# → 31337
```

---

## Bagian 3 — Kompilasi & Unit Test (TR Langkah 4)

Dari root repo (Terminal 2):

```bash
forge build
# → "Compiler run successful!"

forge test
# → 20 test PASS, 0 fail:
#   - SimpleStorageTest (2): initial value 0, store+event
#   - ArisanChainTest (18): constructor, access control (NOT_ADMIN/NOT_MEMBER),
#     state guard (NOT_SETUP/NOT_ACTIVE), WRONG_AMOUNT, ALREADY_CONTRIBUTED,
#     POT_NOT_FULL, siklus penuh, ArisanFinished, test_ReentrancyBlocked

forge test --gas-report
# → tabel gas per fungsi (bahan analisis Pertanyaan G2)
```

---

## Bagian 4 — Deploy (TR Langkah 5)

> **PENTING — urutan menentukan alamat.** Selalu mulai dari Anvil **segar** (restart Terminal 1 bila node sudah pernah dipakai), lalu deploy ArisanChain **dulu**, baru SimpleStorage. Dengan urutan ini alamat selalu sama dengan konstanta di atas.

### 4a. Deploy kontrak aplikasi ArisanChain (satu broadcast: deploy + addMember×5 + start)

```bash
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
```

Output diharapkan:
```
ArisanChain deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
contributionAmount (wei): 1000000000000000000
totalRounds: 5
ONCHAIN EXECUTION COMPLETE & SUCCESSFUL.
```

Tx hash 7 transaksi tercatat otomatis di `broadcast/Deploy.s.sol/31337/run-latest.json` (deploy gas 810175; addMember 76885–93997; start 73456 — rincian di `bukti_deploy.txt` §2).

### 4b. Deploy kontrak latihan SimpleStorage (persis perintah TR Langkah 5)

```bash
PK=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

forge create src/SimpleStorage.sol:SimpleStorage \
  --rpc-url http://127.0.0.1:8545 --private-key $PK --broadcast
# → Deployed to: 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853
# → Transaction hash: 0x...

cast call 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 "retrieve()(uint256)" --rpc-url http://127.0.0.1:8545
# → 0        (read SEBELUM write)

cast send 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 "store(uint256)" 42 \
  --rpc-url http://127.0.0.1:8545 --private-key $PK
# → status 1 (success), gasUsed 44970

cast call 0xa513E6E4b8f2a923D98304ec87F64353C4D5C853 "retrieve()(uint256)" --rpc-url http://127.0.0.1:8545
# → 42       (read SESUDAH write — bukti perubahan state)

cast block-number --rpc-url http://127.0.0.1:8545
# → nomor blok bertambah (transaksi terinklusi)
```

**Catat untuk laporan:** alamat kedua kontrak, tx hash deploy, tx hash store, gasUsed, nilai retrieve sebelum/sesudah.

---

## Bagian 5 — Interaksi Kontrak Aplikasi via CLI (cast)

Memenuhi kriteria minimum TR: **≥2 write + ≥1 read** terdokumentasi. Set dulu variabel di Terminal 2:

```bash
RPC=http://127.0.0.1:8545
ARISAN=0x5FbDB2315678afecb367f032d93F642f64180aa3
```

### 5a. Read state awal (0 gas — `eth_call`, tidak masuk blok)

```bash
cast call $ARISAN "state()(uint8)" --rpc-url $RPC                 # → 1 (Active)
cast call $ARISAN "contributionAmount()(uint256)" --rpc-url $RPC  # → 1000000000000000000
cast call $ARISAN "totalRounds()(uint256)" --rpc-url $RPC         # → 5
cast call $ARISAN "getMembers()(address[])" --rpc-url $RPC        # → 5 alamat urut giliran
cast call $ARISAN "roundProgress()(uint256,uint256)" --rpc-url $RPC   # → 0, 5
cast call $ARISAN "recipientOf(uint256)(address)" 0 --rpc-url $RPC    # → 0x7099... (Anggota 1)
```

### 5b. Write — satu ronde penuh

```bash
# Saldo penerima ronde 0 SEBELUM (pembanding perubahan state):
cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url $RPC --ether

# Setoran 5 anggota (write; catat tx hash + gasUsed dari tiap output):
cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key <PK_A1>
cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key <PK_A2>
cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key <PK_A3>
cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key <PK_A4>
cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key <PK_A5>
# gasUsed ≈ 76519 (pertama) / 59419 (berikutnya)

cast call $ARISAN "roundProgress()(uint256,uint256)" --rpc-url $RPC   # → 5, 5
cast call $ARISAN "pot()(uint256)" --rpc-url $RPC                     # → 5000000000000000000

# Tutup ronde — SENGAJA dikirim admin yang BUKAN anggota (bukti closeRound publik):
cast send $ARISAN "closeRound()" --rpc-url $RPC --private-key $PK
# gasUsed ≈ 88373

# Bukti perubahan state:
cast balance 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url $RPC --ether
# → naik ±4 ETH (terima pot 5, setor 1, minus gas)
cast call $ARISAN "hasReceived(address)(bool)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 --rpc-url $RPC
# → true
cast call $ARISAN "currentRound()(uint256)" --rpc-url $RPC            # → 1
cast call $ARISAN "pot()(uint256)" --rpc-url $RPC                     # → 0
```


### 5c. Uji negatif — semua revert HARUS terjadi (bukti access control & validasi)

| Uji | Perintah | Revert diharapkan |
| --- | --- | --- |
| Non-anggota setor | `cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key 0x92db14e403b83dfe3df233f83dfa3a0d7096f21ca9b0d6d6b8d88b2b4ec1564e` (akun #6, bukan anggota) | `NOT_MEMBER` |
| Nominal salah | `cast send $ARISAN "contribute()" --value 0.5ether --rpc-url $RPC --private-key <PK_A2>` | `WRONG_AMOUNT` |
| Setor dobel | setor 1 ETH dengan `<PK_A2>` lalu ulangi persis | `ALREADY_CONTRIBUTED` |
| Tutup ronde prematur | `cast send $ARISAN "closeRound()" --rpc-url $RPC --private-key $PK` saat pot belum penuh | `POT_NOT_FULL` |
| Non-admin tambah anggota | `cast send $ARISAN "addMember(address)" 0x976EA74026E726554dB657fA54763abd0C3a0aa9 --rpc-url $RPC --private-key <PK_A1>` | `NOT_ADMIN` |
| Tambah anggota setelah start | perintah addMember di atas dengan `$PK` (admin) | `NOT_SETUP` |

Output error cast akan memuat string revert, contoh: `execution reverted: WRONG_AMOUNT`.


### 5d. Bukti event (bahan laporan)

```bash
cast logs --address $ARISAN "Contributed(address,uint256,uint256)" --from-block 0 --rpc-url $RPC
cast logs --address $ARISAN "RoundClosed(uint256,address,uint256)" --from-block 0 --rpc-url $RPC
```

Setelah 1 ronde: 5 entri `Contributed` (+1 gagal tidak tercatat — event hanya untuk tx sukses), 1 entri `RoundClosed`.

---

## Bagian 6 — Uji Web UI (Integrasi Aplikasi, TR Langkah 7 / Bagian E)

**Terminal 3** (root repo, Windows atau WSL):

```bash
cd app
npm install        # sekali saja
npm run dev        # → http://localhost:3000  (ABI auto-sync dari out/ via predev)
```

> Bagian 5 di atas sudah memakai ronde 1 (+ ronde berjalan dari uji negatif). UI melanjutkan state on-chain yang sama — justru bukti bagus bahwa UI membaca chain sungguhan. Untuk demo bersih dari ronde 1: restart Anvil lalu ulangi Bagian 4a saja.

Checklist manual (buka `http://localhost:3000`):

| # | Langkah | Hasil diharapkan | Fitur |
| --- | --- | --- | --- |
| 1 | Muat halaman | Cincin anggota (ArisanRing) tampil; teks "Ronde X/5"; giliran penerima disorot kunyit; progress "n dari 5 sudah setor"; alamat kontrak di footer | F-1, F-2 |
| 2 | Dropdown "Bertindak sebagai" → pilih **Admin** | Tombol "Setor 1 ETH" **nonaktif** + hint "Akun aktif bukan anggota" | Guard |
| 3 | Pilih **Anggota** yang belum setor → klik **Setor 1 ETH** | TxToast muncul: pending → sukses dengan **tx hash + gas ±59k**; progress bar bertambah; segmen anggota di tabel berubah | F-4, F-7 |
| 4 | Klik **Setor** lagi dengan akun yang sama | Tombol nonaktif + hint "sudah setor untuk ronde berjalan" | Guard |
| 5 | Setor dengan semua anggota tersisa | Progress "5 dari 5"; label "Pot penuh — ronde siap ditutup"; pot card 5 ETH; tombol **Tutup ronde** aktif (kunyit) | F-5 |
| 6 | (Boleh dengan akun Admin/non-anggota) klik **Tutup ronde** | TxToast hash + gas ±88k; cincin berotasi ke penerima berikut; riwayat menampilkan "Menerima 5 ETH" + tx hash; pot reset 0 | F-6, F-7 |
| 7 | Ulangi baris 3–6 sampai 5 ronde selesai | Banner hijau "Arisan selesai — total tersalurkan 25 ETH"; semua baris riwayat "Menerima 5 ETH" + hash; panel Aksi hilang | F-3 |
| 8 | **Uji ketahanan:** matikan Anvil (Ctrl+C di Terminal 1) saat UI terbuka | Banner merah "Koneksi ke chain lokal terputus — menampilkan data terakhir" muncul ≤ 2 detik; data terakhir tetap terlihat | Failure path |
| 9 | Nyalakan lagi `anvil` + deploy ulang (Bagian 4a) | UI pulih otomatis tanpa reload dalam beberapa detik | Recovery |
| 10 | **Sinkronisasi eksternal:** kirim 1 `cast send contribute()` dari terminal saat UI terbuka | Progress bar di UI bertambah otomatis ≤ 2 detik tanpa reload (event watcher) | F-8 |

📷 **Bukti 7:** foto layar berisi TxToast dengan tx hash + gasUsed terlihat (baris 3 dan 6), dan banner "Arisan selesai" (baris 7).

---

## Bagian 7 — Analisis Read vs Write & Gas (bahan Pertanyaan G2 & G4)

Demonstrasi langsung perbedaan `cast call` vs `cast send`:

```bash
# READ — eth_call: dieksekusi lokal oleh node, tanpa tanda tangan, tanpa blok, 0 gas
cast call $ARISAN "pot()(uint256)" --rpc-url $RPC
cast block-number --rpc-url $RPC        # catat: nomor blok TIDAK berubah

# WRITE — transaksi bertanda tangan: masuk blok, mengubah storage, bayar gas
cast send $ARISAN "contribute()" --value 1ether --rpc-url $RPC --private-key <PK_anggota>
cast block-number --rpc-url $RPC        # catat: nomor blok BERTAMBAH
```

Angka gas aktual proyek ini (dari `bukti_deploy.txt` §7): deploy 810k; addMember ±77–94k; contribute 59–77k; closeRound 71–88k; store(42) 45k; semua fungsi read 0 gas. Keamanan (Pertanyaan G7): lihat `arisanchain.md` §6 — reentrancy (mitigasi CEI, bukti `test_ReentrancyBlocked`) dan broken access control (mitigasi `onlyAdmin`/`onlyMember`, penerima tidak pernah dari `msg.sender`).

---

## Bagian 8 — Reset Cepat & Skrip Demo Responsi

**Reset total (state demo bersih) — 3 perintah:**

```bash
# Terminal 1: Ctrl+C lalu
anvil
# Terminal 2:
forge script script/Deploy.s.sol --rpc-url http://127.0.0.1:8545 --broadcast
# Terminal 3 (bila belum jalan):
cd app && npm run dev
```

Anvil in-memory: restart = chain hilang, alamat kontrak kembali deterministik ke `0x5FbD…0aa3` (UI langsung cocok tanpa konfigurasi).

**Alur demo yang disarankan (±10 menit):**
1. Tunjukkan `anvil` berjalan + `forge test` hijau (20/20). *(2 menit)*
2. Deploy via `forge script`, tunjukkan alamat + 7 tx. *(1 menit)*
3. Di UI: satu ronde penuh — ganti-ganti akun, setor 5×, tunjukkan TxToast (hash+gas), tutup ronde, tunjukkan riwayat + rotasi cincin. *(4 menit)*
4. Satu uji negatif dari CLI (mis. `WRONG_AMOUNT`) + satu `cast call` read 0 gas. *(2 menit)*
5. Percepat ronde 2–5 via UI atau `cast`, tunjukkan banner "Arisan selesai" + `bukti_deploy.txt`. *(1 menit)*

**Troubleshooting:**

| Gejala | Penyebab & solusi |
| --- | --- |
| `forge: command not found` | `export PATH=$PATH:~/.foundry/bin` atau `source ~/.bashrc` |
| UI: "Tidak bisa memuat data on-chain" | Anvil belum jalan / kontrak belum di-deploy — jalankan Bagian 8 reset |
| Alamat kontrak bukan `0x5FbD…0aa3` | Deploy bukan nonce 0 — restart Anvil lalu deploy ulang, ATAU set `NEXT_PUBLIC_ARISAN_ADDRESS` di `app/.env.local` |
| `Address already in use` saat `anvil` | Ada anvil lama: `pkill -x anvil` di WSL |
| Port 3000 terpakai | `npm run dev -- -p 3001` (buka port tsb.) |
| Tx revert tak terduga di UI | Baca pesan toast (sudah diterjemahkan per revert reason); cek log Anvil di Terminal 1 |
| `cast logs` kosong | Pastikan `--from-block 0` dan alamat kontrak benar |

---

## Pemetaan ke Kriteria & Rubrik TR

**Kriteria penerimaan minimum (TR Bagian E):**

| Kriteria | Pemenuhan | Bukti |
| --- | --- | --- |
| 1 kontrak Solidity, ≥1 write, ≥1 read, ≥1 event | `ArisanChain.sol`: 4 write, 3 read + 9 getter publik, 5 event | `src/ArisanChain.sol`, `arisanchain.md` §3–4 |
| Deploy ke node lokal + alamat & tx hash | Anvil, `0x5FbD…0aa3`, 7 tx | `bukti_deploy.txt` §2, Bagian 4 |
| Antarmuka aplikasi memanggil kontrak | Web UI Next.js + viem (juga CLI cast) | Bagian 5–6 |
| ≥2 write + ≥1 read terdokumentasi | 30 write (25 contribute + 5 closeRound) + read lengkap | `bukti_deploy.txt` §4–6 |
| Dokumentasi akun, tx hash, kontrak, gas, perubahan state | Lengkap | `bukti_deploy.txt` |

**Rubrik penilaian (TR Bagian H):**

| Aspek (bobot) | Dibuktikan lewat |
| --- | --- |
| Fondasi & reproduksibilitas (25%) | Bagian 1–4 + reset 3 perintah (Bagian 8); alamat deterministik |
| Kebenaran smart contract (25%) | Bagian 3 (`forge test` 20/20, gas report) + uji negatif Bagian 5c |
| Integrasi aplikasi (25%) | Bagian 6 (checklist UI 10 langkah, ≥2 write + read via UI) |
| Analisis & keamanan (15%) | Bagian 7 + `arisanchain.md` §6–7 (reentrancy, access control, gas) |
| Tim & dokumentasi (10%) | README, bukti_deploy.txt, riwayat commit kedua anggota |

**Rekap titik foto (wajib FOTO terminal, bukan screenshot):** Bukti 1 (versi WSL+Foundry) · Bukti 2 (anvil+cast) · Bukti 3 (forge test) · Bukti 4 (deploy) · Bukti 5 (write+read cast) · Bukti 6 (uji negatif) · Bukti 7 (UI TxToast & selesai — layar penuh).
