"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { ActiveAccountProvider } from "@/hooks/useActiveAccount";
import { ToastProvider } from "@/hooks/useToasts";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Refetch dipicu event kontrak (useArisanEvents), bukan polling ketat.
            refetchOnWindowFocus: false,
            staleTime: 5_000,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveAccountProvider>
        <ToastProvider>{children}</ToastProvider>
      </ActiveAccountProvider>
    </QueryClientProvider>
  );
}
