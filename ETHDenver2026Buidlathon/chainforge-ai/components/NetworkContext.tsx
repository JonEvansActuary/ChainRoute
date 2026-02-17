"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { useSwitchChain } from "wagmi";
import { type NetworkId, NETWORKS } from "@/lib/chainroute/constants";

interface NetworkCtx {
  network: NetworkId;
  setNetwork: (n: NetworkId) => void;
  chainId: number;
  rpcUrl: string;
  explorerUrl: string;
  networkName: string;
}

const defaultCtx: NetworkCtx = {
  network: "amoy",
  setNetwork: () => {},
  chainId: NETWORKS.amoy.chainId,
  rpcUrl: NETWORKS.amoy.rpcUrl,
  explorerUrl: NETWORKS.amoy.explorerUrl,
  networkName: NETWORKS.amoy.name,
};

const Ctx = createContext<NetworkCtx>(defaultCtx);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [network, setNetworkState] = useState<NetworkId>("amoy");
  const { switchChain } = useSwitchChain();

  const setNetwork = useCallback(
    (n: NetworkId) => {
      setNetworkState(n);
      try {
        switchChain({ chainId: NETWORKS[n].chainId as 80002 | 137 });
      } catch {
        // wallet may reject; NetworkGuard will handle mismatch
      }
    },
    [switchChain],
  );

  const cfg = NETWORKS[network];

  return (
    <Ctx.Provider
      value={{
        network,
        setNetwork,
        chainId: cfg.chainId,
        rpcUrl: cfg.rpcUrl,
        explorerUrl: cfg.explorerUrl,
        networkName: cfg.name,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useNetwork = () => useContext(Ctx);
