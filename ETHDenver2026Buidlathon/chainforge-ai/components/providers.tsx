"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { config } from "@/lib/wagmi-config";
import { NetworkProvider } from "@/components/NetworkContext";
import { ToastProvider } from "@/components/ToastContext";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <ToastProvider>{children}</ToastProvider>
        </NetworkProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
