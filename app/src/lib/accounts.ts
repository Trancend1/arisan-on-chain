// Akun deterministik Anvil (mnemonic default "test test ... junk").
// HANYA untuk lab lokal — private key ini memang publik (ADR-002).
// Urutan #1..#5 = urutan giliran arisan sesuai script/Deploy.s.sol.

export type DevAccount = {
  label: string;
  role: "admin" | "anggota";
  address: `0x${string}`;
  privateKey: `0x${string}`;
};

export const DEV_ACCOUNTS: readonly DevAccount[] = [
  {
    label: "Admin (deployer)",
    role: "admin",
    address: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
    privateKey: "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80",
  },
  {
    label: "Anggota 1",
    role: "anggota",
    address: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    privateKey: "0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d",
  },
  {
    label: "Anggota 2",
    role: "anggota",
    address: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
    privateKey: "0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a",
  },
  {
    label: "Anggota 3",
    role: "anggota",
    address: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
    privateKey: "0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6",
  },
  {
    label: "Anggota 4",
    role: "anggota",
    address: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65",
    privateKey: "0x47e179ec197488593b187f80a00eb0da91f1b9d0b13f8733639f19c30a34926a",
  },
  {
    label: "Anggota 5",
    role: "anggota",
    address: "0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc",
    privateKey: "0x8b3a350cf5c34c9194ca85829a2df0ec3153be0318b5e2d3348e872092edffba",
  },
] as const;

/** Label ramah untuk sebuah alamat; fallback ke alamat terpangkas. */
export function labelFor(address: string): string {
  const found = DEV_ACCOUNTS.find(
    (a) => a.address.toLowerCase() === address.toLowerCase(),
  );
  return found ? found.label : `${address.slice(0, 6)}…${address.slice(-4)}`;
}
