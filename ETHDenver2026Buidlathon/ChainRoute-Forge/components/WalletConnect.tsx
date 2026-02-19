"use client";

import { useConnect, useAccount, useDisconnect, useReconnect } from "wagmi";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, LogOut } from "lucide-react";
import { useNetwork } from "./NetworkContext";
import { MyChains } from "./MyChains";

export function WalletConnect({ compact = false }: { compact?: boolean }) {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();
  const { reconnect } = useReconnect();
  const { networkName } = useNetwork();

  // Try to reconnect on mount
  useEffect(() => {
    reconnect();
  }, [reconnect]);

  const [chainsOpen, setChainsOpen] = useState(false);
  const closeChains = useCallback(() => setChainsOpen(false), []);

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
        <CardContent>
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
          if (c) connect({ connector: c });
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
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {uniqueConnectors.map((c) => (
          <Button
            key={c.uid}
            variant="chain"
            className="w-full"
            onClick={() => connect({ connector: c })}
            disabled={isPending}
          >
            {isPending ? "Connecting..." : c.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
