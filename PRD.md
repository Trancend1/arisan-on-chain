# PRD — Arisan On-Chain

Product Requirements Document untuk Tugas Rancang Teknologi Blockchain (TC789A).
DApp arisan (rotating savings) di atas Ethereum lokal: satu smart contract + satu web UI.

- Status: draft untuk implementasi
- Tim: 2 orang (pembagian di ARCHITECTURE.md §Ownership)
- Target lingkungan: WSL Ubuntu 24.04, Anvil (Foundry), browser modern

---

## 1. Latar belakang & masalah

Arisan adalah tabungan bergilir komunal: sekelompok orang menyetor jumlah tetap tiap periode,
dan tiap periode satu anggota menerima seluruh pot secara bergiliran sampai semua kebagian.
Masalah pada arisan konvensional:

- **Kepercayaan bendahara** — dana dipegang satu orang; ada risiko disalahgunakan atau hilang.
- **Transparansi** — anggota tidak selalu bisa memverifikasi siapa sudah menyetor dan sisa giliran.
- **Sengketa urutan** — catatan manual rawan perselisihan.

DApp ini memindahkan aturan arisan ke smart contract: dana ditahan kontrak (bukan orang), setoran
dan giliran tercatat permanen dan bisa diaudit siapa saja, dan pembayaran ke penerima berjalan
otomatis sesuai aturan yang tidak bisa diubah sepihak. **Trust pindah dari bendahara ke kode.**

## 2. Tujuan

- Membuktikan sebuah aturan komunal (arisan) bisa dijalankan tanpa pihak tepercaya (trustless).
- Memenuhi seluruh acceptance criteria TR dengan aplikasi yang enak didemokan dalam satu siklus.
- Menjadikan aspek keamanan (reentrancy, access control) sebagai bahan analisis yang konkret.

### Non-goals
- Bukan untuk mainnet/uang riil; ini lab lokal di Anvil.
- Tidak menangani KYC, fiat on-ramp, atau denda keterlambatan.
- Tidak ada backend/database; seluruh state ada di on-chain.
- Undian acak pemenang **di luar cakupan** — giliran deterministik by design (lihat arisanchain.md §6).

## 3. Pengguna & peran

| Persona | Deskripsi | Kebutuhan |
|---|---|---|
| **Admin grup** | Membuat arisan, mendaftarkan anggota, memulai siklus. | Kontrol setup, kepastian aturan terkunci setelah mulai. |
| **Anggota** | Menyetor tiap ronde, menerima pot saat gilirannya. | Tahu kapan gilirannya, bukti setorannya tercatat, dana aman. |
| **Penguji / auditor** | Dosen atau siapa pun yang mengaudit. | Bisa reproduksi & verifikasi tx hash, alamat kontrak, perubahan state. |

Pada demo lokal, ketiga peran diperankan lewat akun-akun deterministik Anvil melalui
**account switcher** di UI (lihat ARCHITECTURE.md ADR-002).

## 4. User stories

1. Sebagai **admin**, saya membuat arisan dengan menetapkan nominal setoran, agar aturan main jelas.
2. Sebagai **admin**, saya menambahkan anggota satu per satu, lalu memulai arisan, agar urutan
   giliran terkunci dan transparan.
3. Sebagai **anggota**, saya menyetor ronde berjalan dengan satu klik, agar kontribusi saya tercatat.
4. Sebagai **anggota**, saya melihat progress setoran ronde (berapa dari total sudah bayar), agar
   tahu kapan pot siap dibayarkan.
5. Sebagai **siapa pun**, saya menutup ronde yang sudah penuh, agar pot otomatis ke penerima giliran.
6. Sebagai **anggota**, saya melihat siapa penerima ronde ini dan riwayat penerima sebelumnya.
7. Sebagai **penguji**, tiap aksi menampilkan tx hash & gas terpakai, agar bisa saya dokumentasikan.

## 5. Kebutuhan fungsional

| ID | Kebutuhan | Prioritas |
|---|---|---|
| F-1 | Admin membuat/deploy grup dengan `contributionAmount`. | Wajib |
| F-2 | Admin mendaftarkan anggota (`addMember`) selama state Setup. | Wajib |
| F-3 | Admin memulai arisan (`start`), mengunci daftar & urutan anggota. | Wajib |
| F-4 | Anggota menyetor (`contribute`) sejumlah tepat `contributionAmount`. | Wajib |
| F-5 | UI menampilkan progress ronde (`roundProgress`) & penerima ronde (`recipientOf`). | Wajib |
| F-6 | Menutup ronde penuh (`closeRound`) → pot dibayar ke penerima giliran. | Wajib |
| F-7 | Tiap transaksi write menampilkan tx hash, status, dan gasUsed. | Wajib |
| F-8 | UI memperbarui data otomatis saat event kontrak terjadi. | Sebaiknya |
| F-9 | Account switcher untuk bertindak sebagai admin/anggota berbeda saat demo. | Sebaiknya |
| F-10 | Halaman ringkasan siklus selesai (semua penerima, total tersalurkan). | Opsional |

## 6. Acceptance criteria (pemetaan ke TR)

| Syarat TR | Dipenuhi oleh |
|---|---|
| 1 kontrak Solidity: ≥1 write, ≥1 read, ≥1 event | ArisanChain: 4 write, 3 read (+ getter), 5 event |
| Deploy ke node lokal + alamat kontrak & tx hash | `forge script` ke Anvil → `bukti_deploy.txt` |
| 1 antarmuka aplikasi memanggil kontrak | Web UI Next.js (F-1..F-7) |
| ≥2 write + 1 read terdokumentasi | `addMember`/`start`/`contribute`/`closeRound` + `roundProgress` |
| Dokumentasi: alamat akun, tx hash, alamat kontrak, gas, perubahan state | `bukti_deploy.txt` + laporan |

Pemetaan ke rubrik: Fondasi (25%) via panduan Bagian F + `Deploy.s.sol` reproducible;
Kebenaran kontrak (25%) via unit test lolos + event/access control; Integrasi (25%) via web UI;
Analisis & keamanan (15%) via arisanchain.md §6–§7; Dokumentasi & tim (10%) via docs + Git history.

## 7. Constraint

- **Lokal-only**: RPC `http://127.0.0.1:8545`, chainId `31337`. Tidak ada deployment publik.
- **Deploy WAJIB di Anvil**, bukan Geth (ketentuan TR). Geth PoA hanya opsi konsep Chapter 12.
- **Tanpa backend**: frontend berbicara langsung ke RPC. Tidak ada server/DB yang perlu di-deploy.
- **Reproducibility**: penguji harus bisa menjalankan hanya dengan `anvil`, `forge script`, `npm run dev`.

## 8. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Reentrancy pada payout | Dana terkuras | CEI + test penyerang (arisanchain.md §6) |
| Demo lambat karena ganti akun berkali-kali | Presentasi berantakan | Account switcher in-app (ADR-002) |
| State anvil hilang saat restart | Alamat kontrak berubah | Anvil deterministik; `Deploy.s.sol` reproduce cepat; catat alamat |
| ABI berubah di tengah jalan | Frontend & kontrak desync | Freeze signature di hari-1 (ARCHITECTURE.md §Ownership) |
| Jejak commit timpang antar anggota | Poin tim (10%) turun | Pembagian folder + cross-review + clean-room reproduce README |

## 9. Referensi silang
- Spesifikasi kontrak: `arisanchain.md`
- Arsitektur, stack, ADR, sequence: `ARCHITECTURE.md`
- Token visual & komponen UI: `design-system.md`
