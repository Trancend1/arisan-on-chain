"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { DEV_ACCOUNTS, type DevAccount } from "@/lib/accounts";

type ActiveAccountContextValue = {
  account: DevAccount;
  index: number;
  setIndex: (i: number) => void;
};

const ActiveAccountContext = createContext<ActiveAccountContextValue | null>(
  null,
);

/** Akun dev aktif untuk menandatangani write (ADR-002). Default: Anggota 1. */
export function ActiveAccountProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [index, setIndex] = useState(1);
  const value = useMemo(
    () => ({ account: DEV_ACCOUNTS[index], index, setIndex }),
    [index],
  );
  return (
    <ActiveAccountContext.Provider value={value}>
      {children}
    </ActiveAccountContext.Provider>
  );
}

export function useActiveAccount(): ActiveAccountContextValue {
  const ctx = useContext(ActiveAccountContext);
  if (!ctx)
    throw new Error("useActiveAccount dipakai di luar ActiveAccountProvider");
  return ctx;
}
