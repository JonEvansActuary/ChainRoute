"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  verifyChainFromTxList,
  verifySingleTx,
  getPolygonTxPayload,
  decodePayloadFromHex,
} from "@/lib/chainroute/verifier";
import type { VerifyResult } from "@/lib/chainroute/verifier";
import { CheckCircle2, XCircle, Loader2, Search } from "lucide-react";
import { ChainVisualizer } from "./ChainVisualizer";

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const GATEWAY = "https://arweave.net";

export function Verifier() {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function verify() {
    const raw = input.trim();
    if (!raw) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const hex64 = raw.replace(/^0x/, "");
      const isTxHash = hex64.length === 64 && /^[0-9a-fA-F]{64}$/.test(hex64);
      const txHash = raw.startsWith("0x") ? raw : `0x${hex64}`;

      if (isTxHash) {
        const tx = await getPolygonTxPayload(txHash, AMOY_RPC);
        if (!tx) {
          setError("Transaction not found");
          setLoading(false);
          return;
        }
        const decoded = decodePayloadFromHex(tx.data);
        const ZERO_64 = "0".repeat(64);
        const chainGenesis =
          decoded.genesisHash === ZERO_64 ? hex64.toLowerCase() : decoded.genesisHash.toLowerCase();
        const single = await verifySingleTx(txHash, chainGenesis, AMOY_RPC, GATEWAY);
        if (single.error || !single.blobValid) {
          setResult({
            genesisHash: chainGenesis,
            polygon: {
              errors: single.error ? [single.error] : [],
              results: [{ step: "tx", txHash, ok: false, decoded: single.decoded, error: single.error }],
            },
            arweave: { errors: [], results: [] },
            supportTagsOk: null,
            valid: false,
          });
        } else {
          setResult({
            genesisHash: chainGenesis,
            polygon: {
              errors: [],
              results: [{ step: "tx", txHash, ok: true, decoded: single.decoded }],
            },
            arweave: single.blob
              ? { errors: [], results: [{ step: "blob", blobId: single.decoded?.arweaveId ?? "", ok: true, blob: single.blob }] }
              : { errors: [], results: [] },
            supportTagsOk: null,
            valid: true,
          });
        }
      } else {
        const res = await verifyChainFromTxList(hex64, [], AMOY_RPC, GATEWAY);
        setResult(res);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  const chainNodes = result
    ? [
        ...result.polygon.results
          .filter((r) => r.decoded)
          .map((r, i) => ({
            txHash: r.txHash,
            decoded: r.decoded,
            blob: result.arweave.results[i]?.blob,
          })),
      ]
    : [];

  return (
    <Card className="border-chain-neon/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-chain-neon" />
          Verify chain
        </CardTitle>
        <CardDescription>
          Enter a Polygon (Amoy) transaction hash or genesis hash to verify.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-stretch">
          <Input
            placeholder="0x... or 64-char genesis/tx hash"
            className="min-h-[44px] sm:min-h-0"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && verify()}
          />
          <Button variant="chain" onClick={verify} disabled={loading} className="min-h-[44px] sm:min-h-0">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify"}
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        {result && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {result.valid ? (
                <CheckCircle2 className="h-5 w-5 text-chain-neon" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={result.valid ? "text-chain-neon" : "text-destructive"}>
                {result.valid ? "Chain valid" : "Verification failed"}
              </span>
            </div>
            {result.polygon.errors.length > 0 && (
              <ul className="text-sm text-destructive">
                {result.polygon.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {chainNodes.length > 0 && result.genesisHash && (
              <ChainVisualizer
                genesisHash={result.genesisHash}
                nodes={chainNodes}
              />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
