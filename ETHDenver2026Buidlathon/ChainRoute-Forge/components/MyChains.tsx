"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getMyChains, importChain } from "@/lib/chainroute/my-chains-store";
import { queryMyChains } from "@/lib/chainroute/query-my-chains";
import { useNetwork } from "./NetworkContext";
import { useAccount } from "wagmi";
import { ExternalLink, ChevronRight, Loader2 } from "lucide-react";

/** Merged chain entry for display (combines localStorage + on-chain data). */
interface DisplayChain {
  genesisHash: string;
  genesisTxHash: string;
  eventCount: number;
  latestTime: number;
  delegate: string;
}

export function MyChains({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [chains, setChains] = useState<DisplayChain[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const { networkId } = useNetwork();
  const { address } = useAccount();

  useEffect(() => {
    if (!open) return;

    // Start with localStorage chains immediately
    const local = getMyChains();
    const merged = new Map<string, DisplayChain>();
    for (const c of local) {
      const lastEvent = c.events[c.events.length - 1];
      merged.set(c.genesisHash, {
        genesisHash: c.genesisHash,
        genesisTxHash: c.genesisTxHash,
        eventCount: c.events.length,
        latestTime: lastEvent?.timestamp ?? c.createdAt,
        delegate: c.delegate,
      });
    }
    setChains(Array.from(merged.values()).sort((a, b) => b.latestTime - a.latestTime));

    // Then fetch on-chain data and merge
    if (!address) return;
    setLoading(true);
    queryMyChains(address, networkId)
      .then((onChain) => {
        // Re-read localStorage in case it changed
        const freshLocal = getMyChains();
        const freshMerged = new Map<string, DisplayChain>();
        for (const c of freshLocal) {
          const lastEvent = c.events[c.events.length - 1];
          freshMerged.set(c.genesisHash, {
            genesisHash: c.genesisHash,
            genesisTxHash: c.genesisTxHash,
            eventCount: c.events.length,
            latestTime: lastEvent?.timestamp ?? c.createdAt,
            delegate: c.delegate,
          });
        }

        for (const oc of onChain) {
          const existing = freshMerged.get(oc.genesisHash);
          if (!existing) {
            // Chain found on-chain but not in localStorage — import it
            freshMerged.set(oc.genesisHash, {
              genesisHash: oc.genesisHash,
              genesisTxHash: oc.genesisTxHash,
              eventCount: oc.eventCount,
              latestTime: oc.latestTimestamp * 1000, // Polygonscan returns seconds
              delegate: oc.delegate,
            });
            // Persist to localStorage so it shows up next time
            importChain(oc.genesisHash, oc.genesisTxHash, oc.delegate);
          } else {
            // Merge: use whichever has more events / newer data
            if (oc.eventCount > existing.eventCount) {
              existing.eventCount = oc.eventCount;
            }
            const ocTimeMs = oc.latestTimestamp * 1000;
            if (ocTimeMs > existing.latestTime) {
              existing.latestTime = ocTimeMs;
              existing.delegate = oc.delegate;
            }
          }
        }

        setChains(
          Array.from(freshMerged.values()).sort((a, b) => b.latestTime - a.latestTime)
        );
      })
      .catch(() => {
        // On-chain query failed — still show localStorage chains (already set above)
      })
      .finally(() => setLoading(false));
  }, [open, address, networkId]);

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

      {loading && chains.length === 0 && (
        <div className="flex items-center justify-center gap-2 px-3 py-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading on-chain history...
        </div>
      )}

      {!loading && chains.length === 0 && (
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
          {loading && (
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing on-chain data...
            </div>
          )}
          {chains.map((chain) => (
            <div key={chain.genesisHash} className="px-3 py-2.5 hover:bg-accent/50 transition-colors">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs text-chain-neon truncate">
                    {chain.genesisHash.slice(0, 16)}...{chain.genesisHash.slice(-8)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {chain.eventCount} event{chain.eventCount !== 1 ? "s" : ""}
                    {" \u00b7 "}
                    {new Date(chain.latestTime).toLocaleDateString()}
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
                    href={`/continue?input=${chain.genesisTxHash}`}
                    onClick={onClose}
                    className="rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                    title="Continue"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
