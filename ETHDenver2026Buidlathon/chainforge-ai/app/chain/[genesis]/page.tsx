"use client";

import { useParams, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import Link from "next/link";
import { ChainVisualizer } from "@/components/ChainVisualizer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getPolygonTxPayload,
  decodePayloadFromHex,
  fetchArweaveBlob,
} from "@/lib/chainroute/verifier";
import { ArrowLeft, Loader2, Info } from "lucide-react";

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const GATEWAY = "https://arweave.net";

type NodeItem = {
  txHash: string;
  decoded?: import("@/lib/chainroute/build-payload").DecodedPayload;
  blob?: import("@/lib/chainroute/types").ProvenanceBlob;
};

export default function ChainPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const genesis = (params.genesis as string)?.replace(/^0x/, "").toLowerCase();
  const txesParam = searchParams.get("txes");
  const eventTxHashes = txesParam
    ? txesParam.split(",").map((h) => h.trim()).filter(Boolean).map((h) => (h.startsWith("0x") ? h : `0x${h}`))
    : [];
  const [nodes, setNodes] = useState<NodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!genesis || genesis.length !== 64) {
      setLoading(false);
      setError("Invalid genesis");
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const genesisTxHash = genesis.startsWith("0x") ? genesis : `0x${genesis}`;
        const tx = await getPolygonTxPayload(genesisTxHash, AMOY_RPC);
        if (!tx) {
          if (!cancelled) setError("Genesis transaction not found");
          return;
        }
        const decoded = decodePayloadFromHex(tx.data);
        const list: NodeItem[] = [{ txHash: genesisTxHash, decoded }];
        if (decoded.arweaveId) {
          try {
            const blob = await fetchArweaveBlob(decoded.arweaveId, GATEWAY);
            if (list[0]) list[0].blob = blob;
          } catch {
            // ignore
          }
        }
        for (const eventTxHash of eventTxHashes) {
          if (cancelled) break;
          const eventTx = await getPolygonTxPayload(eventTxHash, AMOY_RPC);
          if (!eventTx) continue;
          let eventDecoded: import("@/lib/chainroute/build-payload").DecodedPayload;
          try {
            eventDecoded = decodePayloadFromHex(eventTx.data);
          } catch {
            continue;
          }
          const item: NodeItem = { txHash: eventTxHash, decoded: eventDecoded };
          if (eventDecoded.arweaveId) {
            try {
              item.blob = await fetchArweaveBlob(eventDecoded.arweaveId, GATEWAY);
            } catch {
              // ignore
            }
          }
          list.push(item);
        }
        if (!cancelled) setNodes(list);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [genesis, eventTxHashes.join(",")]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-chain-neon" />
      </div>
    );
  }

  if (error || !genesis) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-12 text-center">
        <p className="text-destructive">{error || "Invalid genesis"}</p>
        <Link href="/">
          <Button className="mt-4">Home</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
              Home
            </Button>
          </Link>
          <Link href={`/verify?input=${encodeURIComponent(genesis.startsWith("0x") ? genesis : `0x${genesis}`)}`}>
            <Button variant="outline" size="sm">
              Verify this chain
            </Button>
          </Link>
          <h1 className="text-lg font-semibold text-chain-neon">Chain</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        {nodes.length === 1 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-chain-neon/30 bg-chain-neon/5 p-3 text-sm text-muted-foreground">
            <Info className="h-5 w-5 shrink-0 text-chain-neon" />
            <p>
              This view shows the genesis. To see the full chain with all events, use{" "}
              <Link href={`/verify?input=${encodeURIComponent(genesis.startsWith("0x") ? genesis : `0x${genesis}`)}`} className="font-medium text-chain-neon hover:underline">
                Verify
              </Link>{" "}
              and paste the latest transaction hash, or open the chain right after creating an event (the &quot;View chain&quot; link will include the new event).
            </p>
          </div>
        )}
        <Card className="border-chain-neon/30">
          <CardHeader>
            <CardTitle className="font-mono text-sm text-muted-foreground">
              Genesis: {genesis.slice(0, 16)}…{genesis.slice(-8)}
              {nodes.length > 1 && (
                <span className="ml-2 text-chain-neon"> · {nodes.length} node{nodes.length !== 1 ? "s" : ""}</span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChainVisualizer genesisHash={genesis} nodes={nodes} />
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
