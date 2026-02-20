"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { DelegateInput } from "@/components/DelegateInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAnchorTxData } from "@/lib/chainroute/polygon-anchor";
import { ANCHOR_TARGET } from "@/lib/chainroute/constants";
import {
  getPolygonTxPayload,
  decodePayloadFromHex,
} from "@/lib/chainroute/verifier";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { sendRawTransaction } from "@/lib/send-raw-tx";
import { addEvent } from "@/lib/chainroute/my-chains-store";
import { useAccount } from "wagmi";
import { Loader2, ArrowRight, CheckCircle2, AlertCircle } from "lucide-react";
import { useNetwork } from "@/components/NetworkContext";
import { useToast } from "@/components/ToastContext";
import { useTransactionFlow } from "@/hooks/useTransactionFlow";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { CopyButton } from "@/components/CopyButton";
import type { Hash } from "viem";

const ZERO_64 = "0".repeat(64);

export default function ContinuePage() {
  const [input, setInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [chainGenesis, setChainGenesis] = useState<string | null>(null);
  const [prevTxHash, setPrevTxHash] = useState<string | null>(null);
  const [nextSigner, setNextSigner] = useState<string | null>(null);
  const [nextDelegate, setNextDelegate] = useState("");
  const [arweaveId, setArweaveId] = useState("");
  const [anchorLoading, setAnchorLoading] = useState(false);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorDone, setAnchorDone] = useState<string | null>(null);

  const { address, chainId } = useAccount();
  const { rpcUrl, networkName, explorerUrl } = useNetwork();
  const { toast } = useToast();
  const anchorTx = useTransactionFlow();

  useEffect(() => {
    if (address && nextSigner && !nextDelegate) setNextDelegate(address);
  }, [address, nextSigner]);

  const isMeNextSigner =
    address &&
    nextSigner &&
    address.toLowerCase() === nextSigner.toLowerCase();

  async function lookup() {
    const raw = input.trim().replace(/^0x/i, "");
    if (raw.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(raw)) {
      setLookupError("Enter a 64-character transaction hash (or 0x + 64 hex)");
      return;
    }
    const txHash = raw.startsWith("0x") ? raw : `0x${raw}`;
    setLookupLoading(true);
    setLookupError(null);
    setChainGenesis(null);
    setPrevTxHash(null);
    setNextSigner(null);
    try {
      const tx = await getPolygonTxPayload(txHash, rpcUrl);
      if (!tx) {
        setLookupError(`Transaction not found on ${networkName}. Check the hash and network.`);
        return;
      }
      const decoded = decodePayloadFromHex(tx.data);
      const isGenesis = decoded.genesisHash === ZERO_64;
      const genesis = isGenesis
        ? (txHash.startsWith("0x") ? txHash.slice(2) : txHash).toLowerCase()
        : decoded.genesisHash.toLowerCase();
      const prev = (txHash.startsWith("0x") ? txHash.slice(2) : txHash).toLowerCase();
      setChainGenesis(genesis);
      setPrevTxHash(prev);
      setNextSigner(decoded.delegate);
    } catch (e) {
      setLookupError((e as Error).message);
    } finally {
      setLookupLoading(false);
    }
  }

  async function sendAnchor() {
    if (!chainGenesis || !prevTxHash || !address) return;
    const delegateAddr = nextDelegate.trim() ? normalizeAddress(nextDelegate) : address;
    if (!isValidDelegateAddress(delegateAddr)) {
      setAnchorError("Next signer address must be 0x + 40 hex characters");
      return;
    }
    const arId = arweaveId.trim();
    if (arId && arId.length !== 43) {
      setAnchorError("Arweave ID must be exactly 43 characters");
      return;
    }
    setAnchorLoading(true);
    setAnchorError(null);
    anchorTx.setPending();
    try {
      const txData = getAnchorTxData({
        genesisHash: chainGenesis,
        previousPolygonHash: prevTxHash,
        arweaveBlobTxId: arId || "",
        delegate: delegateAddr,
      });
      const hash = await sendRawTransaction({
        from: address,
        to: ANCHOR_TARGET,
        data: txData,
      });

      const { receipt, error: receiptError } = await anchorTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setAnchorError(receiptError ?? "Transaction failed or reverted");
        return;
      }

      toast("Anchor confirmed on chain!", "success");
      if (chainGenesis) addEvent(chainGenesis, hash, delegateAddr);
      setAnchorDone(hash);
    } catch (e) {
      setAnchorError((e as Error).message);
      anchorTx.setStatus("failed");
    } finally {
      setAnchorLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <Header activePage="continue" />

      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-2 text-2xl font-bold">Continue a provenance chain</h1>
        <p className="mb-6 text-muted-foreground">
          You were delegated to sign the next anchor. Enter the chain&apos;s genesis hash or the last transaction hash to continue.
        </p>

        <Card className="mb-6 border-chain-neon/30">
          <CardHeader>
            <CardTitle>Look up chain</CardTitle>
            <CardDescription>
              Paste the genesis transaction hash or the most recent anchor transaction hash.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="0x... or 64-char tx hash"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                className="min-h-[44px] font-mono sm:min-h-0"
              />
              <Button
                variant="chain"
                onClick={lookup}
                disabled={lookupLoading}
                className="min-h-[44px] sm:min-h-0"
              >
                {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
              </Button>
            </div>
            {lookupError && (
              <p className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {lookupError}
              </p>
            )}
          </CardContent>
        </Card>

        {chainGenesis && prevTxHash && nextSigner && (
          <Card className="mb-6 border-chain-neon/30">
            <CardHeader>
              <CardTitle>Chain info</CardTitle>
              <CardDescription>Current state of the chain.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1">
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-muted-foreground break-all">
                  Genesis: {chainGenesis.slice(0, 16)}...{chainGenesis.slice(-8)}
                </p>
                <CopyButton text={chainGenesis} />
              </div>
              <div className="flex items-center gap-2">
                <p className="font-mono text-xs text-muted-foreground break-all">
                  Last tx: {prevTxHash.slice(0, 16)}...{prevTxHash.slice(-8)}
                </p>
                <CopyButton text={prevTxHash} />
              </div>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">Next signer (delegate): </span>
                <span className="font-mono text-chain-neon">{nextSigner.slice(0, 10)}...{nextSigner.slice(-8)}</span>
              </p>
            </CardContent>
          </Card>
        )}

        {chainGenesis && nextSigner && !isMeNextSigner && (
          <Card className="mb-6 border-amber-500/40 bg-amber-500/5">
            <CardContent className="flex items-center gap-3 pt-6">
              <AlertCircle className="h-8 w-8 shrink-0 text-amber-500" />
              <div>
                <p className="font-medium">You are not the next signer for this chain.</p>
                <p className="text-sm text-muted-foreground">
                  Connect with <span className="font-mono text-foreground">{nextSigner}</span> to add the next anchor, or share this page with that signer.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {chainGenesis && prevTxHash && isMeNextSigner && !anchorDone && (
          <>
            <div className="mb-4 flex items-center gap-2 text-chain-neon">
              <CheckCircle2 className="h-5 w-5" />
              <span className="font-medium">You&apos;re the next signer. Add the next anchor.</span>
            </div>

            <div className="space-y-4">
              <DelegateInput
                value={nextDelegate}
                onChange={setNextDelegate}
                address={address}
                label="Next signer after you"
                description="Who can sign the anchor after this one. Leave blank to keep yourself."
              />
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
              {anchorError && <p className="text-sm text-destructive">{anchorError}</p>}
              <TxStatusBadge status={anchorTx.status} txHash={anchorTx.txHash} />
              <Button
                variant="chain"
                className="w-full"
                onClick={sendAnchor}
                disabled={anchorLoading}
              >
                {anchorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Sign Anchor
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </>
        )}

        {anchorDone && chainGenesis && (
          <Card className="border-chain-neon/50 chain-glow">
            <CardHeader>
              <CardTitle>Anchor confirmed</CardTitle>
              <CardDescription>
                You continued the chain on {networkName}. The next signer can use this page with the same genesis or your new tx hash.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2">
                <a
                  href={`${explorerUrl}/tx/${anchorDone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-xs text-chain-neon break-all hover:underline"
                >
                  Tx: {anchorDone}
                </a>
                <CopyButton text={anchorDone} />
              </div>
              <Link href={`/chain/${chainGenesis}?txes=${encodeURIComponent(anchorDone)}`}>
                <Button variant="chain">View chain</Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
