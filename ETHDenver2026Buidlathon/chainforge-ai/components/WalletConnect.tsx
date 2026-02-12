"use client";

import { useConnect, useAccount, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link2, LogOut } from "lucide-react";

export function WalletConnect() {
  const { address, isConnected } = useAccount();
  const { connect, connectors, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  if (isConnected && address) {
    return (
      <Card className="border-chain-neon/30 bg-card/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Polygon wallet</CardTitle>
          <CardDescription className="font-mono text-chain-neon break-all">
            {address.slice(0, 6)}…{address.slice(-4)}
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

  return (
    <Card className="border-chain-neon/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="h-5 w-5 text-chain-neon" />
          Connect wallet
        </CardTitle>
        <CardDescription>
          Connect your Polygon (Amoy) wallet to create and sign provenance anchors.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {connectors.map((c) => (
          <Button
            key={c.uid}
            variant="chain"
            className="w-full"
            onClick={() => connect({ connector: c })}
            disabled={isPending}
          >
            {isPending ? "Connecting…" : c.name}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
}
