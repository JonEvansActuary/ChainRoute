"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { WalletConnect } from "@/components/WalletConnect";
import { GenesisWizard } from "@/components/GenesisWizard";
import { SupportUploader, type SupportWithFile } from "@/components/SupportUploader";
import { EventBuilder, type EventForm } from "@/components/EventBuilder";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getAnchorTxData } from "@/lib/chainroute/polygon-anchor";
import { useAccount, useWalletClient } from "wagmi";
import { Input } from "@/components/ui/input";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { Loader2, Link2, QrCode, ArrowRight, UserPlus } from "lucide-react";
import { QRCodeModal } from "@/components/QRCodeModal";

const ZERO_64 = "0".repeat(64);

export default function HomePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [prevTxHash, setPrevTxHash] = useState<string>(ZERO_64);
  const [supports, setSupports] = useState<SupportWithFile[]>([]);
  const [eventForm, setEventForm] = useState<EventForm | null>(null);
  const [nextDelegate, setNextDelegate] = useState("");
  const [anchorLoading, setAnchorLoading] = useState(false);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [lastArweaveId, setLastArweaveId] = useState<string | null>(null);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [qrOpen, setQrOpen] = useState(false);

  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();

  useEffect(() => {
    if (address && !nextDelegate) setNextDelegate(address);
  }, [address]);

  const supportItems = supports
    .filter((s) => s.id)
    .map((s) => ({ id: s.id, label: s.label || s.id.slice(0, 8) }));

  const handleGenesisCreated = (txHash: string) => {
    const h = txHash.startsWith("0x") ? txHash.slice(2).toLowerCase() : txHash.toLowerCase();
    setGenesisHash(h);
    setPrevTxHash(h);
    setStep(3);
  };

  const handlePostBlobAndAnchor = async () => {
    if (!genesisHash || !address || !eventForm || !walletClient) return;
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
          genesisHash,
          event: {
            eventType: eventForm.eventType,
            timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
            summary: eventForm.summary,
          },
          supports: supportItems,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to post blob");
      const arweaveId = data.arweaveId as string;

      const params = {
        genesisHash,
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
      const newPrev = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
      setPrevTxHash(newPrev);
      setLastArweaveId(arweaveId);
      setLastTxHash(hash);
      setStep(5);
    } catch (e) {
      setAnchorError((e as Error).message);
    } finally {
      setAnchorLoading(false);
    }
  };

  const verifyUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/verify${genesisHash ? `?genesis=${genesisHash}` : ""}`
      : "/verify";

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2">
          <Link href="/" className="text-lg font-bold text-chain-neon sm:text-xl">
            ChainForge AI
          </Link>
          <nav className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Link
              href="/continue"
              className="text-sm text-muted-foreground hover:text-chain-neon"
            >
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
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold tracking-tight">
            Forge provenance chains
          </h1>
          <p className="mt-2 text-muted-foreground">
            AI co-pilots the story; ChainRoute anchors it on Polygon + Arweave.
          </p>
        </div>

        <div className="space-y-6">
          {step >= 1 && (
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

          {step >= 2 && address && (
            <section>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chain-neon/20 text-chain-neon">
                  2
                </span>
                Create genesis
              </div>
              {!genesisHash ? (
                <GenesisWizard onGenesisCreated={handleGenesisCreated} />
              ) : (
                <Card className="border-chain-neon/30">
                  <CardContent className="pt-6">
                    <p className="font-mono text-sm text-chain-neon break-all">
                      Genesis: {genesisHash.slice(0, 16)}…{genesisHash.slice(-8)}
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => setStep(3)}
                    >
                      Continue to supports
                    </Button>
                  </CardContent>
                </Card>
              )}
            </section>
          )}

          {step >= 3 && genesisHash && (
            <section>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chain-neon/20 text-chain-neon">
                  3
                </span>
                Support files
              </div>
              <SupportUploader
                genesisHash={genesisHash}
                supports={supports}
                onSupportsChange={setSupports}
              />
              <Button
                variant="chain"
                className="mt-4 w-full"
                onClick={() => setStep(4)}
              >
                Next: Event
                <ArrowRight className="h-4 w-4" />
              </Button>
            </section>
          )}

          {step >= 4 && (
            <section>
              <div className="mb-2 flex items-center gap-2 text-sm text-muted-foreground">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-chain-neon/20 text-chain-neon">
                  4
                </span>
                Event + anchor
              </div>
              <EventBuilder
                supportLabels={supports.map((s) => s.label || s.id?.slice(0, 8) || "").filter(Boolean)}
                onEventChange={setEventForm}
                initialEvent={eventForm}
              />
              <div className="mt-4">
                <label className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <UserPlus className="h-4 w-4" />
                  Next signer (delegate) after this anchor
                </label>
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
                    title="Use my address"
                  >
                    Me
                  </Button>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  Who can sign the next anchor. Blank = you.
                </p>
              </div>
              {anchorError && (
                <p className="mt-2 text-sm text-destructive">{anchorError}</p>
              )}
              <Button
                variant="chain"
                className="mt-4 w-full"
                onClick={handlePostBlobAndAnchor}
                disabled={!eventForm || anchorLoading}
              >
                {anchorLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Post blob & sign anchor"
                )}
              </Button>
            </section>
          )}

          {step === 5 && lastTxHash && genesisHash && (
            <Card className="border-chain-neon/50 chain-glow">
              <CardHeader>
                <CardTitle>Anchor sent</CardTitle>
                <CardDescription>
                  Your provenance event is anchored on Polygon (Amoy).
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="font-mono text-xs text-chain-neon break-all">
                  Tx: {lastTxHash}
                </p>
                {lastArweaveId && (
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    Arweave: {lastArweaveId}
                  </p>
                )}
                <div className="flex gap-2">
                  <Link href={`/chain/${genesisHash}`}>
                    <Button variant="chain">View chain</Button>
                  </Link>
                  <Button
                    variant="outline"
                    onClick={() => setQrOpen(true)}
                  >
                    <QrCode className="h-4 w-4" />
                    QR code
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>

      <QRCodeModal
        open={qrOpen}
        onClose={() => setQrOpen(false)}
        verifyUrl={verifyUrl}
      />
    </div>
  );
}
