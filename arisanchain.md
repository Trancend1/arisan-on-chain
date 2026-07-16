# ArisanChain.sol — Referensi Smart Contract

Kontrak arisan (ROSCA / rotating savings) di atas Ethereum lokal. Satu grup, N anggota,
setoran tetap per ronde, pemenang ronde ditentukan **rotasi deterministik** (giliran urut),
bukan random on-chain. Dokumen ini adalah sumber kebenaran untuk ABI, invariant, dan analisis
keamanan. Frontend (`app/`) dan laporan TR mengacu ke sini.

- Pragma: `^0.8.24` (checked arithmetic aktif secara default)
- Node target: Anvil (`http://127.0.0.1:8545`, chainId `31337`)
- License: MIT

---

## 1. Model & lifecycle

Grup arisan melewati tiga state:

```
Setup  ──addMember()×N──▶  Setup  ──start()──▶  Active  ──closeRound()×N──▶  Finished
```

- **Setup** — admin mendaftarkan anggota. Belum ada uang masuk.
- **Active** — tiap ronde, seluruh anggota `contribute()` sejumlah `contributionAmount`.
  Saat pot penuh, `closeRound()` membayar pot ke `members[currentRound]` dan menaikkan ronde.
- **Finished** — setelah N ronde, setiap anggota sudah menerima pot tepat satu kali.

Penerima ronde ke-`r` selalu `members[r]`. Karena urutan `members[]` dikunci saat `start()`,
seluruh giliran sudah pasti dan transparan sejak awal — tidak ada undian yang bisa dimanipulasi.

---

## 2. State variables

| Variabel | Tipe | Keterangan |
|---|---|---|
| `admin` | `address` | Pembuat grup; satu-satunya yang boleh `addMember` & `start`. |
| `contributionAmount` | `uint256` | Setoran wajib per ronde, dalam Wei. Diset di constructor. |
| `state` | `enum State` | `Setup` / `Active` / `Finished`. |
| `members` | `address[]` | Urutan anggota = urutan giliran. Dikunci saat `start()`. |
| `isMember` | `mapping(address=>bool)` | Cek keanggotaan O(1). |
| `hasReceived` | `mapping(address=>bool)` | Menandai anggota yang sudah menerima pot. |
| `hasContributed` | `mapping(uint256=>mapping(address=>bool))` | `ronde => anggota => sudah setor`. |
| `currentRound` | `uint256` | Indeks ronde berjalan (0-indexed). |
| `totalRounds` | `uint256` | `= members.length`, diset saat `start()`. |
| `pot` | `uint256` | Akumulasi setoran ronde berjalan (Wei). Reset ke 0 tiap `closeRound`. |

---

## 3. Fungsi

### Write

| Fungsi | Akses | Prasyarat | Efek |
|---|---|---|---|
| `constructor(uint256 _contributionAmount)` | — | — | Set `admin=msg.sender`, `contributionAmount`, `state=Setup`. |
| `addMember(address m)` | `onlyAdmin` | state `Setup`, `m` belum terdaftar | Tambah ke `members`, set `isMember`, emit `MemberAdded`. |
| `start()` | `onlyAdmin` | state `Setup`, `members >= 2` | Kunci anggota, `totalRounds=members.length`, `state=Active`, emit `ArisanStarted`. |
| `contribute()` `payable` | `onlyMember` | state `Active`, `msg.value == contributionAmount`, belum setor ronde ini | `pot += msg.value`, tandai `hasContributed`, emit `Contributed`. |
| `closeRound()` | publik | state `Active`, `pot == contributionAmount * members.length` | Bayar pot ke `members[currentRound]`, naikkan ronde, emit `RoundClosed` (+ `ArisanFinished` di ronde terakhir). |

Catatan: `closeRound()` sengaja **publik** (bukan `onlyAdmin`). Penerima & jumlah bayar 100%
ditentukan kontrak, jadi siapa pun boleh memicu penutupan ronde yang sudah penuh tanpa risiko —
ini bahkan lebih desentralis dan menghindari admin sebagai single point of failure.

### Read (`view`)

| Fungsi | Return | Keterangan |
|---|---|---|
| `getMembers()` | `address[]` | Seluruh anggota berurutan (= urutan giliran). |
| `recipientOf(uint256 round)` | `address` | Penerima pot untuk ronde tertentu. |
| `roundProgress()` | `(uint256 paid, uint256 total)` | Berapa anggota sudah setor vs total, untuk progress bar UI. |

Mapping publik (`admin`, `contributionAmount`, `state`, `currentRound`, `totalRounds`, `pot`,
`isMember`, `hasReceived`, `hasContributed`) otomatis punya getter — dipakai frontend untuk polling.

---

## 4. Events

| Event | Signature | Kapan |
|---|---|---|
| `MemberAdded` | `(address indexed member)` | Tiap anggota didaftarkan. |
| `ArisanStarted` | `(uint256 totalRounds, uint256 amount)` | Saat `start()`. |
| `Contributed` | `(address indexed member, uint256 indexed round, uint256 amount)` | Tiap setoran. |
| `RoundClosed` | `(uint256 indexed round, address indexed recipient, uint256 payout)` | Tiap ronde selesai dibayar. |
| `ArisanFinished` | `()` | Setelah ronde terakhir. |

Frontend memakai `watchContractEvent` (viem) atas event-event ini untuk refetch read otomatis
tanpa polling agresif. `Contributed` dan `RoundClosed` adalah bukti transaksi write untuk laporan.

---

## 5. Invariant

Properti yang harus selalu benar (dasar penulisan unit test):

1. **Konservasi dana** — di state `Active`, `pot` selalu `<= contributionAmount * members.length`.
   Setelah `closeRound`, `pot == 0`.
2. **Sekali terima** — tiap anggota menerima pot tepat sekali sepanjang siklus; saat `Finished`,
   `hasReceived[m] == true` untuk semua `m`.
3. **Rotasi berurutan** — penerima ronde `r` selalu `members[r]`, monoton naik.
4. **Tidak ada dana tersangkut** — saldo kontrak `== pot` (tidak ada ETH masuk selain lewat
   `contribute`; tidak ada `receive()`/`fallback()` yang menerima transfer liar).
5. **Setoran presisi** — tidak ada under/overpayment karena `require(msg.value == contributionAmount)`.

---

## 6. Keamanan (menjawab Bagian G — Pertanyaan 7)

### Ancaman 1 — Reentrancy
`closeRound()` melakukan external call (`recipient.call{value: payout}("")`). Jika penerima adalah
kontrak jahat dengan `receive()` yang memanggil balik `closeRound()`, tanpa proteksi ia bisa
menguras dana.

**Mitigasi — Checks-Effects-Interactions.** Seluruh perubahan state (`pot = 0`,
`hasReceived[recipient] = true`, `currentRound += 1`, transisi `Finished`) dieksekusi **sebelum**
external call. Saat call balik terjadi, `pot` sudah 0 dan `require(pot == ...)` gagal, sehingga
re-entry di-revert. Opsi tambahan: `ReentrancyGuard` OpenZeppelin (`nonReentrant`) sebagai lapis
kedua. Bukti empiris: `test_ReentrancyBlocked` men-deploy kontrak penyerang dan memastikan
serangan gagal.

### Ancaman 2 — Broken access control
Tanpa kontrol, siapa pun bisa mendaftarkan anggota palsu, memulai arisan lebih awal, atau
mengklaim pot orang lain.

**Mitigasi.** Modifier `onlyAdmin` (untuk `addMember`, `start`) dan `onlyMember` (untuk
`contribute`). Yang terpenting: penerima pot **tidak pernah** diambil dari `msg.sender` melainkan
dari `members[currentRound]`, jadi pot tidak bisa dibajak siapa pun. `closeRound` aman untuk
publik karena alasan ini.

### Pertimbangan desain — kenapa TIDAK pakai on-chain randomness
Alternatif "kocok pemenang acak" menggoda, tapi sumber acak on-chain naif (`block.timestamp`,
`blockhash`, `block.prevrandao`) bisa diprediksi/dimanipulasi oleh validator yang memproduksi blok.
Solusi aman (commit-reveal atau Chainlink VRF) berlebihan untuk lab lokal. Rotasi deterministik
menghilangkan permukaan serangan ini sepenuhnya sambil tetap setia pada cara arisan nyata
(urutan disepakati di depan). Ini keputusan sadar, bukan keterbatasan.

### Catatan tambahan
- **Overflow/underflow** — Solidity `^0.8` memakai checked arithmetic; `pot += msg.value` otomatis
  revert bila overflow. Tidak perlu SafeMath.
- **DoS by unbounded loop** — kontrak sengaja menghindari loop atas `members[]` di jalur write;
  `getMembers()` yang me-return array hanyalah `view` (gratis, tidak kena gas transaksi).

---

## 7. Analisis gas (menjawab Bagian G — Pertanyaan 2 & 4)

Ambil angka aktual via `forge test --gas-report`. Yang perlu dibahas di laporan:

| Operasi | Sifat | Catatan biaya |
|---|---|---|
| `contribute()` | write | Dominan 1× `SSTORE` (`hasContributed`) + update `pot`. Storage = mahal. |
| `closeRound()` | write | Beberapa `SSTORE` (reset pot, `hasReceived`, `currentRound`) + external call transfer. |
| `getMembers()` / `roundProgress()` | read (`view`) | 0 gas via `cast call`/`eth_call` — tidak masuk blok. |

Ini bahan langsung untuk Pertanyaan 4: `cast call` (read) dieksekusi lokal oleh node lewat
`eth_call`, tidak mengubah state, tidak masuk blok, tidak butuh tanda tangan → 0 gas. `cast send`
(write) menyiarkan transaksi tertandatangani yang mengubah storage → dieksekusi tiap node
validator → berbayar gas.

---

## 8. Deploy & bukti (Anvil)

`ArisanChain` punya constructor argument, jadi deploy pakai `--constructor-args` atau
`forge script`. Rekomendasi: `script/Deploy.s.sol` yang sekaligus `addMember` + `start`,
supaya reproducible satu perintah (lihat ARCHITECTURE.md §Deployment).

Alur bukti untuk `bukti_deploy.txt`:

1. Deploy → catat **alamat kontrak** + **tx hash deploy**.
2. `addMember` ×N, lalu `start` (write).
3. Tiap akun anvil `contribute --value <amount>` (write, gunakan `--private-key` berbeda).
4. `roundProgress()` (read) sebelum pot penuh.
5. `closeRound()` (write) → catat **tx hash** + **gasUsed**; verifikasi saldo penerima naik.
6. `hasReceived(<addr>)` / `recipientOf(<round>)` (read) sebagai **bukti perubahan state**.

Ini melewati jauh syarat minimum TR (≥2 write + 1 read).

---

## 9. Referensi silang
- Alur produk & user story: `PRD.md`
- Arsitektur sistem, folder, ADR, sequence: `ARCHITECTURE.md`
- Token visual & komponen UI: `design-system.md`
