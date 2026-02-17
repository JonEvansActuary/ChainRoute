"use client";

import { useAccount, useChainId, useSwitchChain } from "wagmi";
import { useNetwork } from "./NetworkContext";
import { Button } from "./ui/button";
import { AlertTriangle } from "lucide-react";

export function NetworkGuard() {
  const { isConnected } = useAccount();
  const walletChainId = useChainId();
  const { chainId: targetChainId, networkName } = useNetwork();
  const { switchChain, isPending } = useSwitchChain();

  if (!isConnected || walletChainId === targetChainId) return null;

  return (
    <div className="mx-auto max-w-2xl px-4 mt-4">
      <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3">
        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">Wrong network</p>
          <p className="text-xs text-muted-foreground">
            Please switch to {networkName} to continue.
          </p>
        </div>
        <Button
          variant="chain"
          size="sm"
          onClick={() => switchChain({ chainId: targetChainId as 80002 | 137 })}
          disabled={isPending}
        >
          {isPending ? "Switching..." : "Switch"}
        </Button>
      </div>
    </div>
  );
}
