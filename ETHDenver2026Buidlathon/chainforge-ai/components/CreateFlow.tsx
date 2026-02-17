"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAccount, useWalletClient } from "wagmi";
import { WalletConnect } from "@/components/WalletConnect";
import { DelegateInput } from "@/components/DelegateInput";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { ChainVisualizer } from "@/components/ChainVisualizer";
import { QRCodeModal } from "@/components/QRCodeModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAnchorTxData } from "@/lib/chainroute/polygon-anchor";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { useNetwork } from "@/components/NetworkContext";
import { useToast } from "@/components/ToastContext";
import { useTransactionFlow } from "@/hooks/useTransactionFlow";
import { Loader2, Zap, Plus, Eye, QrCode, ArrowRight } from "lucide-react";
import type { DecodedPayload } from "@/lib/chainroute/build-payload";
import type { Hash } from "viem";

const ZERO_64 = "0".repeat(64);

type FlowStep = "connect" | "genesis" | "events";
type FlowMode = "core" | "full";

interface ChainEvent {
  txHash: string;
  delegate: string;
  arweaveId: string;
}

export function CreateFlow() {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { explorerUrl, networkName } = useNetwork();
  const { toast } = useToast();

  const [step, setStep] = useState<FlowStep>("connect");
  const [mode, setMode] = useState<FlowMode>("core");
  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [genesisDelegate, setGenesisDelegate] = useState("");
  const [chainEvents, setChainEvents] = useState<ChainEvent[]>([]);
  const [delegate, setDelegate] = useState("");
  const [arweaveId, setArweaveId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);

  const genesisTx = useTransactionFlow();
  const eventTx = useTransactionFlow();

  // Auto-advance from connect when wallet is connected
  useEffect(() => {
    if (address && step === "connect") setStep("genesis");
  }, [address, step]);

  // Default delegate to self
  useEffect(() => {
    if (address && !genesisDelegate) setGenesisDelegate(address);
  }, [address, genesisDelegate]);

  useEffect(() => {
    if (address && !delegate) setDelegate(address);
  }, [address, delegate]);

  const prevTxHash = chainEvents.length > 0
    ? chainEvents[chainEvents.length - 1].txHash.replace(/^0x/, "").toLowerCase()
    : genesisHash ?? ZERO_64;

  // --- Genesis ---
  async function createGenesis() {
    if (!address || !walletClient) return;
    const delegateAddr = genesisDelegate.trim()
      ? normalizeAddress(genesisDelegate)
      : address;
    if (!isValidDelegateAddress(delegateAddr)) {
      setError("Delegate must be 0x + 40 hex characters");
      return;
    }
    setLoading(true);
    setError(null);
    genesisTx.setPending();
    try {
      const txData = getAnchorTxData({
        genesisHash: ZERO_64,
        previousPolygonHash: ZERO_64,
        arweaveBlobTxId: "",
        delegate: delegateAddr,
      });
      const hash = await walletClient.sendTransaction({
        to: address,
        data: txData,
        value: 0n,
        gas: 100000n,
      });
      const receipt = await genesisTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setError("Transaction failed or reverted");
        return;
      }
      const h = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
      setGenesisHash(h);
      setGenesisDelegate(delegateAddr);
      toast("Genesis created!", "success");
      setStep("events");
    } catch (e) {
      setError((e as Error).message);
      genesisTx.setStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  // --- Event ---
  async function addEvent() {
    if (!address || !walletClient || !genesisHash) return;
    const delegateAddr = delegate.trim()
      ? normalizeAddress(delegate)
      : address;
    if (!isValidDelegateAddress(delegateAddr)) {
      setError("Delegate must be 0x + 40 hex characters");
      return;
    }
    const arId = mode === "full" ? arweaveId.trim() : "";
    if (arId && arId.length !== 43) {
      setError("Arweave ID must be exactly 43 characters");
      return;
    }
    setLoading(true);
    setError(null);
    eventTx.setPending();
    try {
      const txData = getAnchorTxData({
        genesisHash,
        previousPolygonHash: prevTxHash,
        arweaveBlobTxId: arId,
        delegate: delegateAddr,
      });
      const hash = await walletClient.sendTransaction({
        to: address,
        data: txData,
        value: 0n,
        gas: 100000n,
      });
      const receipt = await eventTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setError("Transaction failed or reverted");
        return;
      }
      setChainEvents((prev) => [
        ...prev,
        { txHash: hash, delegate: delegateAddr, arweaveId: arId },
      ]);
      setArweaveId("");
      toast(`Event #${chainEvents.length + 1} anchored!`, "success");
    } catch (e) {
      setError((e as Error).message);
      eventTx.setStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  // Build visualizer nodes from local state (no RPC needed)
  const visualizerNodes = genesisHash
    ? [
        {
          txHash: `0x${genesisHash}`,
          decoded: {
            genesisHash: ZERO_64,
            previousPolygonHash: ZERO_64,
            arweaveId: "",
            delegate: genesisDelegate,
          } as DecodedPayload,
        },
        ...chainEvents.map((evt, i) => ({
          txHash: evt.txHash,
          decoded: {
            genesisHash,
            previousPolygonHash:
              i === 0
                ? genesisHash
                : chainEvents[i - 1].txHash.replace(/^0x/, "").toLowerCase(),
            arweaveId: evt.arweaveId,
            delegate: evt.delegate,
          } as DecodedPayload,
        })),
      ]
    : [];

  const verifyUrl =
    typeof window !== "undefined" && genesisHash
      ? `${window.location.origin}/verify?input=0x${genesisHash}`
      : "/verify";

  const allTxHashes = chainEvents.map((e) => e.txHash).join(",");

  return (
    <div className="space-y-6">
      {/* Step 1: Connect */}
      {step === "connect" && (
        <section>
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chain-neon/20 text-chain-neon">
              1
            </span>
            Connect wallet
          </div>
          <WalletConnect />
        </section>
      )}

      {/* Step 2: Genesis */}
      {step === "genesis" && address && (
        <section className="space-y-4">
          <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chain-neon/20 text-chain-neon">
              1
            </span>
            Create genesis anchor
          </div>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-chain-neon/20 bg-muted/30 p-2">
            <span className="text-sm font-medium text-muted-foreground">Mode:</span>
            <Button
              type="button"
              variant={mode === "core" ? "chain" : "outline"}
              size="sm"
              onClick={() => setMode("core")}
            >
              Core Protocol
            </Button>
            <Button
              type="button"
              variant={mode === "full" ? "chain" : "outline"}
              size="sm"
              onClick={() => setMode("full")}
            >
              With Arweave
            </Button>
          </div>

          <Card className="border-chain-neon/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-chain-neon" />
                Genesis
              </CardTitle>
              <CardDescription>
                Create the root anchor for your provenance chain on {networkName}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DelegateInput
                value={genesisDelegate}
                onChange={setGenesisDelegate}
                address={address}
              />
              {error && <p className="text-sm text-destructive">{error}</p>}
              <TxStatusBadge status={genesisTx.status} txHash={genesisTx.txHash} />
              <Button
                variant="chain"
                className="w-full"
                onClick={createGenesis}
                disabled={loading || !address}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  "Create Genesis"
                )}
              </Button>
            </CardContent>
          </Card>
        </section>
      )}

      {/* Step 3: Events */}
      {step === "events" && genesisHash && address && (
        <section className="space-y-4">
          {/* Genesis confirmation */}
          <Card className="border-chain-neon/30">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-chain-neon">Genesis created</p>
                <CopyButton text={genesisHash} />
              </div>
              <a
                href={`${explorerUrl}/tx/0x${genesisHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-xs text-muted-foreground break-all hover:text-chain-neon"
              >
                0x{genesisHash.slice(0, 16)}...{genesisHash.slice(-8)}
              </a>
            </CardContent>
          </Card>

          {/* Mode toggle */}
          <div className="flex items-center gap-2 rounded-lg border border-chain-neon/20 bg-muted/30 p-2">
            <span className="text-sm font-medium text-muted-foreground">Mode:</span>
            <Button
              type="button"
              variant={mode === "core" ? "chain" : "outline"}
              size="sm"
              onClick={() => setMode("core")}
            >
              Core Protocol
            </Button>
            <Button
              type="button"
              variant={mode === "full" ? "chain" : "outline"}
              size="sm"
              onClick={() => setMode("full")}
            >
              With Arweave
            </Button>
          </div>

          {/* Event form */}
          <Card className="border-chain-neon/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-chain-neon" />
                Add Event #{chainEvents.length + 1}
              </CardTitle>
              <CardDescription>
                Chain a new anchor referencing prev tx{" "}
                <span className="font-mono">
                  {prevTxHash.slice(0, 8)}...
                </span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <DelegateInput
                value={delegate}
                onChange={setDelegate}
                address={address}
              />
              {mode === "full" && (
                <div>
                  <label className="mb-1 block text-sm font-medium text-muted-foreground">
                    Arweave Blob ID (optional, 43 characters)
                  </label>
                  <Input
                    placeholder="Paste an existing Arweave transaction ID"
                    value={arweaveId}
                    onChange={(e) => setArweaveId(e.target.value)}
                    maxLength={43}
                    className="font-mono text-sm"
                  />
                </div>
              )}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <TxStatusBadge status={eventTx.status} txHash={eventTx.txHash} />
              <Button
                variant="chain"
                className="w-full"
                onClick={addEvent}
                disabled={loading || !address}
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Signing...
                  </>
                ) : (
                  <>
                    Sign Event Anchor
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Chain visualization */}
          {visualizerNodes.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-muted-foreground">
                Chain ({visualizerNodes.length} anchor{visualizerNodes.length !== 1 ? "s" : ""})
              </h3>
              <ChainVisualizer genesisHash={genesisHash} nodes={visualizerNodes} />
            </div>
          )}

          {/* Actions */}
          {chainEvents.length > 0 && (
            <div className="flex flex-wrap gap-2">
              <Link
                href={
                  allTxHashes
                    ? `/chain/${genesisHash}?txes=${encodeURIComponent(allTxHashes)}`
                    : `/chain/${genesisHash}`
                }
              >
                <Button variant="chain">
                  <Eye className="h-4 w-4" />
                  View Chain
                </Button>
              </Link>
              <Button variant="outline" onClick={() => setQrOpen(true)}>
                <QrCode className="h-4 w-4" />
                QR Code
              </Button>
            </div>
          )}
        </section>
      )}

      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        verifyUrl={verifyUrl}
      />
    </div>
  );
}
