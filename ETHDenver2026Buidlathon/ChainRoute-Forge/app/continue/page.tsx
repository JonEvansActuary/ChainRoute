"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { SupportUploader, type SupportWithFile } from "@/components/SupportUploader";
import { EventBuilder, type EventForm } from "@/components/EventBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { getAnchorTxData, AMOY_RPC } from "@/lib/chainroute/polygon-anchor";
import {
  getPolygonTxPayload,
  decodePayloadFromHex,
} from "@/lib/chainroute/verifier";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { useAccount, useWalletClient } from "wagmi";
import { Loader2, ArrowRight, UserPlus, CheckCircle2, AlertCircle } from "lucide-react";

const ZERO_64 = "0".repeat(64);

export default function ContinuePage() {
  const [input, setInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [chainGenesis, setChainGenesis] = useState<string | null>(null);
  const [prevTxHash, setPrevTxHash] = useState<string | null>(null);
  const [nextSigner, setNextSigner] = useState<string | null>(null);
  const [supports, setSupports] = useState<SupportWithFile[]>([]);
  const [eventForm, setEventForm] = useState<EventForm | null>(null);
  const [nextDelegate, setNextDelegate] = useState("");
  const [anchorLoading, setAnchorLoading] = useState(false);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorDone, setAnchorDone] = useState<string | null>(null);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (address && nextSigner && !nextDelegate) setNextDelegate(address);
  }, [address, nextSigner]);

  const supportItems = supports
    .filter((s) => s.id)
    .map((s) => ({ id: s.id, label: s.label || s.id.slice(0, 8) }));

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
      const tx = await getPolygonTxPayload(txHash, AMOY_RPC);
      if (!tx) {
        setLookupError("Transaction not found. Check the hash and network (Amoy).");
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

  async function postBlobAndAnchor() {
    if (!chainGenesis || !prevTxHash || !address || !eventForm || !walletClient) return;
    const delegateAddr = nextDelegate.trim() ? normalizeAddress(nextDelegate) : address;
    if (!isValidDelegateAddress(delegateAddr)) {
      setAnchorError("Next signer address must be 0x + 40 hex characters");
      return;
    }
    setAnchorLoading(true);
    setAnchorError(null);
    try {
      const res = await fetch("/api/arweave/post-blob", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          genesisHash: chainGenesis,
          event: {
            eventType: eventForm.eventType,
            timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
            summary: eventForm.summary,
          },
          supports: supportItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data.error || "Failed to post blob";
        if (res.status === 503) {
          throw new Error("Arweave keys not configured. You can still use Verify with existing chains.");
        }
        throw new Error(msg);
      }
      const arweaveId = data.arweaveId as string;
      const params = {
        genesisHash: chainGenesis,
        previousPolygonHash: prevTxHash,
        arweaveBlobTxId: arweaveId,
        delegate: delegateAddr,
      };
      const txData = getAnchorTxData(params);
      const hash = await walletClient.sendTransaction({
        to: address,
        data: txData,
        value: BigInt(0),
        gas: BigInt(100000),
      });
      setAnchorDone(hash);
    } catch (e) {
      setAnchorError((e as Error).message);
    } finally {
      setAnchorLoading(false);
    }
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-lg font-bold text-chain-neon sm:text-xl">
            ChainRoute-Forge
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link href="/continue" className="text-sm font-medium text-chain-neon">
              Continue chain
            </Link>
            <Link
              href="/verify"
              className="text-sm text-muted-foreground hover:text-chain-neon"
            >
              Verify
            </Link>
            <WalletConnect />
          </nav>
        </div>
      </header>

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
              <p className="font-mono text-xs text-muted-foreground break-all">
                Genesis: {chainGenesis.slice(0, 16)}…{chainGenesis.slice(-8)}
              </p>
              <p className="font-mono text-xs text-muted-foreground break-all">
                Last tx: {prevTxHash.slice(0, 16)}…{prevTxHash.slice(-8)}
              </p>
              <p className="mt-2 text-sm">
                <span className="text-muted-foreground">Next signer (delegate): </span>
                <span className="font-mono text-chain-neon">{nextSigner.slice(0, 10)}…{nextSigner.slice(-8)}</span>
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
              <span className="font-medium">You&apos;re the next signer. Add the next event and anchor.</span>
            </div>

            <div className="space-y-6">
              <SupportUploader
                genesisHash={chainGenesis}
                supports={supports}
                onSupportsChange={setSupports}
              />
              <EventBuilder
                supportLabels={supports.map((s) => s.label || s.id?.slice(0, 8) || "").filter(Boolean)}
                onEventChange={setEventForm}
                initialEvent={eventForm}
              />
              <Card className="border-chain-neon/30">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <UserPlus className="h-4 w-4" />
                    Next signer after you
                  </CardTitle>
                  <CardDescription>
                    Who can sign the anchor after this one. Leave blank to keep yourself.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      placeholder={address ?? "0x..."}
                      value={nextDelegate}
                      onChange={(e) => setNextDelegate(e.target.value)}
                      className="font-mono text-sm"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => address && setNextDelegate(address)}
                    >
                      Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
              {anchorError && <p className="text-sm text-destructive">{anchorError}</p>}
              <Button
                variant="chain"
                className="w-full"
                onClick={postBlobAndAnchor}
                disabled={!eventForm || anchorLoading}
              >
                {anchorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    Post blob & sign anchor
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
              <CardTitle>Anchor sent</CardTitle>
              <CardDescription>
                You continued the chain. The next signer can use this page with the same genesis or your new tx hash.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="font-mono text-xs text-chain-neon break-all">Tx: {anchorDone}</p>
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
