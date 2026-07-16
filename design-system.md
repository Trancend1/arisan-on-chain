# Design System — Arisan On-Chain

Sistem desain untuk web UI (Next.js + Tailwind). Satu halaman dashboard yang harus terasa
**komunal, hangat, dan tepercaya** (arisan itu kumpul-kumpul yang menyenangkan) sekaligus
**presisi dan transparan** (ini berjalan on-chain). Dokumen ini menetapkan token dan komponen;
semua warna & tipografi diturunkan dari sini, bukan default framework.

---

## 1. Arah visual

**Tesis:** *"Buku catatan sebagai ritual."* Transparansi ledger blockchain bertemu giliran bergilir
arisan. Elemen dunia arisan yang dipakai sebagai bahan desain: **giliran yang berputar**, **pot yang
terisi**, **nama-nama dalam urutan**, dan angka-angka yang harus bisa diaudit (Wei, gas, tx hash).

**Palet** berakar pada tekstil Indonesia (batik nila/soga) — sengaja menghindari look default
AI (cream + terracotta + serif kontras-tinggi). Pasangan **kunyit (gold) × nila (indigo)** khas
dan legibel.

**Signature element — Arisan Ring.** Cincin melingkar berisi seluruh anggota berurutan; segmen
**penerima ronde ini** menyala kunyit, yang sudah menerima meredup, dan indikator giliran bergerak
satu langkah tiap `RoundClosed`. Ini menerjemahkan sifat *rotating* arisan menjadi satu objek yang
langsung dimengerti. Semua kejutan visual dibelanjakan di sini; sisanya tenang.

---

## 2. Warna (token)

```
--ink:        #17161C   /* teks utama, near-black kebiruan */
--ink-soft:   #4A4954   /* teks sekunder */
--muted:      #8A8896   /* caption, label, disabled text */

--nila:       #2C3A78   /* indigo batik — brand primer, header, chain/ledger */
--nila-tint:  #E7EAF4   /* latar lembut, border kartu */

--kunyit:     #E39A0C   /* gold kunyit — aksi utama, penerima aktif, highlight */
--kunyit-deep:#B8790A   /* hover/pressed gold */

--jade:       #1F8F63   /* sukses / payout terkirim */
--rust:       #C0492E   /* error / transaksi gagal */
--amber:      #D98A1F   /* pending / menunggu konfirmasi */

--paper:      #FBFAF6   /* latar halaman, hangat tapi bukan cream #F4F1EA */
--surface:    #FFFFFF   /* kartu */
--line:       #E3E1D9   /* garis pemisah tipis */
```

Aturan pakai:
- **Kunyit** hanya untuk aksi primer & penerima ronde aktif. Jangan ditebar; kekuatannya dari kelangkaan.
- **Nila** untuk struktur & identitas (header, tab aktif, tautan).
- Warna status (jade/rust/amber) **hanya** untuk state transaksi, tidak untuk dekorasi.
- Kontras teks minimal WCAG AA: `--ink` di atas `--paper`/`--surface` lolos AAA; teks di atas kunyit
  pakai `--ink` (bukan putih) agar kontras cukup.

## 3. Tipografi

Tiga peran, dipilih sengaja — bukan Inter untuk segalanya:

| Peran | Typeface | Pakai untuk |
|---|---|---|
| Display | **Space Grotesk** | Judul, angka besar (nominal pot, ronde). Teknis tapi ramah. |
| Body | **IBM Plex Sans** | Teks umum, label, tombol. |
| Data/Mono | **IBM Plex Mono** | Alamat, tx hash, nilai Wei, gasUsed — apa pun yang harus dibaca persis. |

Mono di sini fungsional, bukan gaya: alamat & hash butuh lebar karakter tetap agar tidak salah baca.

Type scale (rem, rasio ~1.25):
```
display-xl  3.052   Space Grotesk 600   /* nominal pot / hero */
display-l   2.441   Space Grotesk 600
h1          1.953   Space Grotesk 600
h2          1.563   Space Grotesk 500
h3          1.25    IBM Plex Sans 600
body        1.00    IBM Plex Sans 400
small       0.80    IBM Plex Sans 400
mono        0.875   IBM Plex Mono 400   /* address/hash/wei */
caption     0.75    IBM Plex Sans 500   /* eyebrow, label uppercase */
```

## 4. Spasi, radius, elevasi

```
space scale: 4 · 8 · 12 · 16 · 24 · 32 · 48 · 64 (px)
radius:      sm 6 · md 10 · lg 16 · pill 999
border:      1px solid var(--line)   (kartu: var(--nila-tint))
shadow-sm:   0 1px 2px rgba(23,22,28,.06)
shadow-md:   0 6px 20px rgba(44,58,120,.08)   /* nila-tinted, halus */
```

Grid: kolom tunggal berpusat, `max-width 960px`, gutter 24px. Arisan Ring dominan di atas,
panel aksi & progress di bawahnya.

## 5. Komponen inti

### AccountSwitcher
Dropdown "Bertindak sebagai" (dev). Menampilkan label peran + alamat (mono, terpangkas
`0xf39F…2266`). Badge kecil "Admin" pada akun #0. Ganti akun = ganti walletClient aktif.

### ArisanRing (signature)
Lingkaran SVG berisi N segmen (satu per anggota, urut).
- Penerima ronde ini: isi `--kunyit`, label tebal.
- Sudah menerima: isi `--nila-tint`, teks `--muted`.
- Belum: outline `--nila`.
- Transisi giliran: rotasi indikator + fade warna, 400ms `ease-out`. Hormati `prefers-reduced-motion`
  (langsung pindah tanpa animasi).

### RoundProgress
Bar horizontal "X dari N sudah setor" (`roundProgress`). Terisi `--kunyit` saat berjalan; berubah
`--jade` sesaat saat penuh, lalu tombol "Tutup ronde" aktif. Angka pakai mono.

### PotCard
Kartu nominal pot ronde berjalan (display-xl, Space Grotesk) + konversi Wei↔ETH kecil di bawah (mono).
Label eyebrow "POT RONDE #r" (caption uppercase, `--muted`).

### Buttons
- Primer: latar `--kunyit`, teks `--ink`, radius md. Aksi: "Setor 0.1 ETH", "Mulai arisan",
  "Tutup ronde". Nama tombol = apa yang terjadi (bukan "Submit").
- Sekunder: outline `--nila`, teks `--nila`.
- Disabled: `--nila-tint` + teks `--muted`, kursor not-allowed (mis. "Tutup ronde" saat pot belum penuh).
- State pending: spinner + teks berubah ("Menyetor…"), tombol terkunci.

### TxToast
Muncul tiap transaksi. Tiga state, dengan warna status:
- **Pending** (`--amber`): "Menunggu konfirmasi…" + hash mono.
- **Success** (`--jade`): "Setoran tercatat" / "Pot terkirim" + hash mono + `gasUsed`.
- **Error** (`--rust`): sebutkan penyebab dari revert reason (mis. "Nominal setoran salah",
  "Sudah setor ronde ini"), bukan pesan generik. Sertakan cara benerin.

### MemberList / HistoryTable
Tabel penerima per ronde: kolom Ronde · Penerima (address mono) · Status (Menerima/Menunggu) ·
Tx hash (tautan, mono terpangkas). Baris penerima aktif ditandai aksen kunyit tipis di tepi kiri.

## 6. Suara & teks (microcopy)

- Tulis dari sisi pengguna, aktif, sentence case. "Setor", "Mulai arisan", "Tutup ronde".
- Nama aksi konsisten sepanjang alur: tombol "Setor" → toast "Setoran tercatat".
- Error menjelaskan + mengarahkan, tidak minta maaf, tidak samar. Contoh: revert
  `"wrong amount"` → UI: "Nominal setoran harus tepat 0.1 ETH."
- Empty state (belum ada anggota): ajakan bertindak, bukan sekadar "kosong" — mis.
  "Belum ada anggota. Tambahkan anggota untuk memulai arisan."

## 7. Quality floor

- Responsif sampai mobile (ring menyusut, tabel jadi kartu bertumpuk).
- Focus keyboard terlihat jelas (ring `--nila`, offset 2px).
- `prefers-reduced-motion` dihormati di seluruh transisi.
- Kontras teks ≥ WCAG AA di semua kombinasi token di §2.
- Alamat/hash selalu mono + punya aksi salin.

## 8. Referensi silang
- Data yang ditampilkan (state, event) berasal dari `arisanchain.md`.
- Kebutuhan UI (F-1..F-10) di `PRD.md`.
- Tempat komponen di struktur `app/`: `ARCHITECTURE.md` §3.
