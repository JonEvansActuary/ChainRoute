"use client";

import { useParams } from "next/navigation";
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
import { ArrowLeft, Loader2 } from "lucide-react";

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const GATEWAY = "https://arweave.net";

export default function ChainPage() {
  const params = useParams();
  const genesis = (params.genesis as string)?.replace(/^0x/, "").toLowerCase();
  const [nodes, setNodes] = useState<
    Array<{
      txHash: string;
      decoded?: import("@/lib/chainroute/build-payload").DecodedPayload;
      blob?: import("@/lib/chainroute/types").ProvenanceBlob;
    }>
  >([]);
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
        const txHash = genesis.startsWith("0x") ? genesis : `0x${genesis}`;
        const tx = await getPolygonTxPayload(txHash, AMOY_RPC);
        if (!tx) {
          if (!cancelled) setError("Genesis transaction not found");
          return;
        }
        const decoded = decodePayloadFromHex(tx.data);
        const list: typeof nodes = [{ txHash, decoded }];
        let blob;
        if (decoded.arweaveId) {
          try {
            blob = await fetchArweaveBlob(decoded.arweaveId, GATEWAY);
          } catch {
            // ignore
          }
        }
        if (list[0]) list[0].blob = blob;
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
  }, [genesis]);

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
          <h1 className="text-lg font-semibold text-chain-neon">Chain</h1>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Card className="border-chain-neon/30">
          <CardHeader>
            <CardTitle className="font-mono text-sm text-muted-foreground">
              Genesis: {genesis.slice(0, 16)}…{genesis.slice(-8)}
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
