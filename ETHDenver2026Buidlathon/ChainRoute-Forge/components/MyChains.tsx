"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getMyChains, type StoredChain } from "@/lib/chainroute/my-chains-store";
import { ExternalLink, ChevronRight } from "lucide-react";

export function MyChains({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [chains, setChains] = useState<StoredChain[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setChains(getMyChains());
  }, [open]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-lg border border-border bg-card shadow-lg"
    >
      <div className="border-b border-border px-3 py-2">
        <p className="text-sm font-medium">My Chains</p>
      </div>

      {chains.length === 0 && (
        <div className="px-3 py-6 text-center text-sm text-muted-foreground">
          No chains yet.{" "}
          <Link
            href="/create"
            onClick={onClose}
            className="text-chain-neon hover:underline"
          >
            Create one
          </Link>
        </div>
      )}

      {chains.length > 0 && (
        <div className="divide-y divide-border">
          {chains.map((chain) => {
            const lastEvent = chain.events[chain.events.length - 1];
            const latestTxHash = lastEvent?.txHash ?? chain.genesisTxHash;
            const latestTime = lastEvent?.timestamp ?? chain.createdAt;
            return (
              <div key={chain.genesisHash} className="px-3 py-2.5 hover:bg-accent/50 transition-colors">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-xs text-chain-neon truncate">
                      {chain.genesisHash.slice(0, 16)}...{chain.genesisHash.slice(-8)}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {chain.events.length} event{chain.events.length !== 1 ? "s" : ""}
                      {" \u00b7 "}
                      {new Date(latestTime).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Link
                      href={`/verify?input=0x${chain.genesisHash}`}
                      onClick={onClose}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Verify"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                    <Link
                      href={`/continue?input=${latestTxHash}`}
                      onClick={onClose}
                      className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                      title="Continue"
                    >
                      <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
