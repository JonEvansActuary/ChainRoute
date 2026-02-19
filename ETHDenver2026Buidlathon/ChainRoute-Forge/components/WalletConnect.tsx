"use client";

import { useConnect, useAccount, useDisconnect, useReconnect, useSwitchChain } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, LogOut } from "lucide-react";
import { useNetwork } from "./NetworkContext";
import { MyChains } from "./MyChains";

const DEBUG_LOG = (payload: Record<string, unknown>) => {
  fetch("http://127.0.0.1:7245/ingest/a755f050-6533-46f6-9b91-4eebaba90941", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...payload, timestamp: Date.now() }),
  }).catch(() => {});
};

export function WalletConnect({ compact = false }: { compact?: boolean }) {
  const { address, isConnected, chainId: walletChainId } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();
  const { switchChainAsync } = useSwitchChain();
  const { networkName, networkId, chainId: appChainId } = useNetwork();

  // Try to reconnect on mount
  useEffect(() => {
    reconnect();
  }, [reconnect]);

  // After connect, switch to app's selected chain if wallet is on something else (e.g. Arbitrum)
  useEffect(() => {
    if (!isConnected || !address || walletChainId === undefined) return;
    if (walletChainId === appChainId) return;
    switchChainAsync?.({ chainId: appChainId }).catch(() => {});
  }, [isConnected, address, walletChainId, appChainId, switchChainAsync]);

  const [chainsOpen, setChainsOpen] = useState(false);
  const closeChains = useCallback(() => setChainsOpen(false), []);

  // #region agent log
  if (typeof window !== "undefined" && isConnected && address) {
    DEBUG_LOG({
      location: "WalletConnect.tsx:post-connect",
      message: "After connect: wallet vs app chain",
      data: { walletChainId, appChainId, networkId, networkName },
      hypothesisId: "H2,H4",
    });
  }
  // #endregion

  if (isConnected && address) {
    if (compact) {
      return (
        <div className="relative flex items-center gap-1.5">
          <button
            onClick={() => setChainsOpen((o) => !o)}
            className="font-mono text-xs text-chain-neon hover:underline cursor-pointer"
            title="View my chains"
          >
            {address.slice(0, 6)}...{address.slice(-4)}
          </button>
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => disconnect()}>
            <LogOut className="h-3 w-3" />
          </Button>
          <MyChains open={chainsOpen} onClose={closeChains} />
        </div>
      );
    }
    return (
      <Card className="border-chain-neon/30 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Polygon wallet</CardTitle>
          <CardDescription className="font-mono text-chain-neon break-all">
            {address}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">
            Using the account currently selected in MetaMask. To use a different account (e.g. Ledger), switch in MetaMask, disconnect here, then connect again.
          </p>
          <Button variant="outline" size="sm" onClick={() => disconnect()}>
            <LogOut className="h-4 w-4" />
            Disconnect
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Dedupe connectors by name (injected + metaMask can overlap)
  const seen = new Set<string>();
  const uniqueConnectors = connectors.filter((c) => {
    if (seen.has(c.name)) return false;
    seen.add(c.name);
    return true;
  });

  if (compact) {
    return (
      <Button
        variant="chain"
        size="sm"
        onClick={() => {
          const c = uniqueConnectors[0];
          // #region agent log
          if (c) {
            DEBUG_LOG({
              location: "WalletConnect.tsx:connect-click-compact",
              message: "Connect clicked (compact); passing chainId",
              data: { connectorName: c.name, appChainId, networkId },
              hypothesisId: "H1,H3,H5",
            });
            connect({ connector: c, chainId: appChainId });
          }
          // #endregion
        }}
        disabled={isPending}
      >
        {isPending ? "..." : "Connect"}
      </Button>
    );
  }

  return (
    <Card className="border-chain-neon/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-chain-neon" />
          Connect wallet
        </CardTitle>
        <CardDescription>
          Connect your {networkName} wallet to create and sign provenance anchors.
          If you use a Ledger, select the Ledger account in MetaMask first, then connect here.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {uniqueConnectors.map((c) => (
          <Button
            key={c.uid}
            variant="chain"
            className="w-full"
            onClick={() => {
              // #region agent log
              DEBUG_LOG({
                location: "WalletConnect.tsx:connect-click-full",
                message: "Connect clicked; passing chainId",
                data: { connectorName: c.name, appChainId, networkId },
                hypothesisId: "H1,H3,H5",
              });
              // #endregion
              connect({ connector: c, chainId: appChainId });
            }}
            disabled={isPending}
          >
            {isPending ? "Connecting..." : c.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
