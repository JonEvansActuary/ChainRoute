"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { NETWORKS, type NetworkId } from "@/lib/chainroute/constants";

interface NetworkContextValue {
  networkId: NetworkId;
  setNetworkId: (id: NetworkId) => void;
  rpcUrl: string;
  networkName: string;
  explorerUrl: string;
  chainId: number;
}

const NetworkContext = createContext<NetworkContextValue | null>(null);

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [networkId, setNetworkId] = useState<NetworkId>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("chainroute-network");
      if (saved === "amoy" || saved === "polygon") return saved;
    }
    return "amoy";
  });

  const network = NETWORKS[networkId];

  const handleSetNetworkId = (id: NetworkId) => {
    setNetworkId(id);
    if (typeof window !== "undefined") {
      localStorage.setItem("chainroute-network", id);
    }
  };

  return (
    <NetworkContext.Provider
      value={{
        networkId,
        setNetworkId: handleSetNetworkId,
        rpcUrl: network.rpcUrl,
        networkName: network.name,
        explorerUrl: network.explorerUrl,
        chainId: network.chainId,
      }}
    >
      {children}
    </NetworkContext.Provider>
  );
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error("useNetwork must be used within NetworkProvider");
  return ctx;
}
