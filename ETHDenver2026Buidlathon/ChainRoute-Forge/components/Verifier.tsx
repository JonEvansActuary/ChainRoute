"use client";

import { useState, useEffect } from "react";
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
import { ARWEAVE_GATEWAY, NETWORKS } from "@/lib/chainroute/constants";
import { importChain } from "@/lib/chainroute/my-chains-store";
import { useNetwork } from "./NetworkContext";
import {
  DEMO_CHAIN_GENESIS_TX,
  DEMO_CHAIN_EVENT_TXES,
  DEMO_CHAIN_MAINNET_RPC,
} from "@/lib/demo-chain";
import { CheckCircle2, XCircle, Loader2, Search, BookOpen, QrCode } from "lucide-react";

const DEMO_CHAIN_CACHE_KEY = "chainroute-demo-chain-result";
import { ChainVisualizer } from "./ChainVisualizer";
import { QRCodeModal } from "./QRCodeModal";

export function Verifier({ initialInput }: { initialInput?: string }) {
  const [input, setInput] = useState(initialInput ?? "");
  useEffect(() => {
    if (initialInput != null) setInput(initialInput);
  }, [initialInput]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [usedDemoChain, setUsedDemoChain] = useState(false);
  const { rpcUrl, networkName } = useNetwork();
  const [qrOpen, setQrOpen] = useState(false);
  const [qrVerifyUrl, setQrVerifyUrl] = useState("");

  async function verify() {
    const raw = input.trim();
    if (!raw) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUsedDemoChain(false);
    try {
      const hex64 = raw.replace(/^0x/, "");
      const isTxHash = hex64.length === 64 && /^[0-9a-fA-F]{64}$/.test(hex64);
      const txHash = raw.startsWith("0x") ? raw : `0x${hex64}`;

      if (isTxHash) {
        const tx = await getPolygonTxPayload(txHash, rpcUrl);
        if (!tx) {
          setError(`Transaction not found on ${networkName}`);
          setLoading(false);
          return;
        }
        const decoded = decodePayloadFromHex(tx.data);
        const ZERO_64 = "0".repeat(64);
        const chainGenesis =
          decoded.genesisHash === ZERO_64 ? hex64.toLowerCase() : decoded.genesisHash.toLowerCase();
        const single = await verifySingleTx(txHash, chainGenesis, rpcUrl, ARWEAVE_GATEWAY);
        if (single.error || !single.blobValid) {
          setResult({
            genesisHash: chainGenesis,
            polygon: {
              errors: single.error ? [single.error] : [],
              results: [{ step: "tx", txHash, ok: false, decoded: single.decoded, error: single.error }],
            },
            arweave: { errors: [], results: [] },
            supportTagsOk: single.supportTagsOk ?? null,
            valid: false,
          });
        } else {
          importChain(chainGenesis, txHash, single.decoded?.delegate ?? "");
          setResult({
            genesisHash: chainGenesis,
            polygon: {
              errors: [],
              results: [{ step: "tx", txHash, ok: true, decoded: single.decoded }],
            },
            arweave: single.blob
              ? { errors: [], results: [{ step: "blob", blobId: single.decoded?.arweaveId ?? "", ok: true, blob: single.blob }] }
              : { errors: [], results: [] },
            supportTagsOk: single.supportTagsOk ?? null,
            valid: true,
          });
        }
      } else {
        const res = await verifyChainFromTxList(hex64, [], rpcUrl, ARWEAVE_GATEWAY);
        setResult(res);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function loadExampleChain() {
    setUsedDemoChain(true);
    setInput(DEMO_CHAIN_EVENT_TXES[DEMO_CHAIN_EVENT_TXES.length - 1] ?? DEMO_CHAIN_GENESIS_TX);
    setError(null);

    if (typeof sessionStorage !== "undefined") {
      try {
        const cached = sessionStorage.getItem(DEMO_CHAIN_CACHE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached) as VerifyResult;
          setResult(parsed);
          setLoading(false);
          void revalidateDemoChainInBackground();
          return;
        }
      } catch {
        // ignore stale/invalid cache
      }
    }

    setLoading(true);
    setResult(null);
    try {
      const res = await verifyChainFromTxList(
        DEMO_CHAIN_GENESIS_TX,
        DEMO_CHAIN_EVENT_TXES,
        DEMO_CHAIN_MAINNET_RPC,
        ARWEAVE_GATEWAY
      );
      setResult(res);
      if (typeof sessionStorage !== "undefined" && res.valid) {
        try {
          sessionStorage.setItem(DEMO_CHAIN_CACHE_KEY, JSON.stringify(res));
        } catch {
          // ignore quota etc.
        }
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function revalidateDemoChainInBackground() {
    verifyChainFromTxList(
      DEMO_CHAIN_GENESIS_TX,
      DEMO_CHAIN_EVENT_TXES,
      DEMO_CHAIN_MAINNET_RPC,
      ARWEAVE_GATEWAY
    )
      .then((res) => {
        if (res.valid && typeof sessionStorage !== "undefined") {
          try {
            sessionStorage.setItem(DEMO_CHAIN_CACHE_KEY, JSON.stringify(res));
            setResult(res);
          } catch {
            // ignore
          }
        }
      })
      .catch(() => {
        // keep showing cached result
      });
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
          Enter a transaction hash or genesis hash to verify on {networkName}. Or load the example chain (HypotheticalPainting, Polygon mainnet).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={loadExampleChain}
          disabled={loading}
          className="mb-2 flex items-center gap-1"
        >
          <BookOpen className="h-4 w-4" />
          Load Example Chain
        </Button>
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
            <div className="flex flex-wrap items-center gap-2">
              {result.valid ? (
                <CheckCircle2 className="h-5 w-5 text-chain-neon" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <span className={result.valid ? "text-chain-neon" : "text-destructive"}>
                {result.valid ? "Chain valid" : "Verification failed"}
              </span>
              {result.valid && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const raw = input.trim();
                    const hex = raw.startsWith("0x") ? raw : `0x${raw}`;
                    setQrVerifyUrl(typeof window !== "undefined" ? `${window.location.origin}/verify?input=${encodeURIComponent(hex)}` : "");
                    setQrOpen(true);
                  }}
                  className="ml-auto flex items-center gap-1"
                >
                  <QrCode className="h-4 w-4" />
                  Show QR
                </Button>
              )}
            </div>
            {result.polygon.errors.length > 0 && (
              <ul className="text-sm text-destructive">
                {result.polygon.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            )}
            {result.supportTagsOk !== null && (
              <p className={`text-sm ${result.supportTagsOk ? "text-chain-neon" : "text-destructive"}`}>
                Support tags (ChainRoute-Genesis): {result.supportTagsOk ? "OK" : "Missing or mismatch"}
              </p>
            )}
            {chainNodes.length > 0 && result.genesisHash && (
              <ChainVisualizer
                genesisHash={result.genesisHash}
                nodes={chainNodes}
                explorerBaseUrl={usedDemoChain ? NETWORKS.polygon.explorerUrl : undefined}
              />
            )}
          </div>
        )}
      </CardContent>
      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        verifyUrl={qrVerifyUrl}
        title="Scan to verify"
      />
    </Card>
  );
}
