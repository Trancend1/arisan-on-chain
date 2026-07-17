// Pemetaan revert reason kontrak → pesan pengguna (design-system §6:
// error menjelaskan + mengarahkan, bukan pesan generik).
const REVERT_MESSAGES: Record<string, string> = {
  NOT_ADMIN: "Hanya admin yang bisa melakukan aksi ini. Ganti ke akun Admin.",
  NOT_MEMBER:
    "Akun ini bukan anggota arisan. Pilih akun anggota di menu “Bertindak sebagai”.",
  NOT_SETUP: "Arisan sudah dimulai — daftar anggota terkunci.",
  NOT_ACTIVE: "Arisan belum aktif atau sudah selesai.",
  WRONG_AMOUNT: "Nominal setoran salah — harus tepat sesuai setoran per ronde.",
  ALREADY_CONTRIBUTED: "Akun ini sudah setor untuk ronde berjalan.",
  ALREADY_MEMBER: "Alamat ini sudah terdaftar sebagai anggota.",
  NEED_2_MEMBERS: "Minimal 2 anggota sebelum arisan bisa dimulai.",
  POT_NOT_FULL: "Pot belum penuh — tunggu semua anggota setor dulu.",
  TRANSFER_FAILED: "Transfer pot ke penerima gagal.",
  ZERO_ADDRESS: "Alamat anggota tidak valid.",
  AMOUNT_ZERO: "Nominal setoran harus lebih dari nol.",
  ROUND_OUT_OF_RANGE: "Ronde di luar jangkauan.",
};

/** Terjemahkan error viem/kontrak menjadi pesan Indonesia yang actionable. */
export function revertMessage(err: unknown): string {
  const text = err instanceof Error ? err.message : String(err);
  for (const [code, message] of Object.entries(REVERT_MESSAGES)) {
    if (text.includes(code)) return message;
  }
  if (text.includes("fetch") || text.includes("HTTP request failed")) {
    return "Tidak bisa terhubung ke Anvil di 127.0.0.1:8545. Pastikan `anvil` berjalan.";
  }
  return "Transaksi gagal. Coba lagi atau periksa log Anvil.";
}
