"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
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
import { Loader2, QrCode, ArrowRight, UserPlus } from "lucide-react";
import { QRCodeModal } from "@/components/QRCodeModal";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { useNetwork } from "@/components/NetworkContext";
import { useToast } from "@/components/ToastContext";
import { useTransactionFlow } from "@/hooks/useTransactionFlow";
import type { Hash } from "viem";

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
  const { explorerUrl, networkName } = useNetwork();
  const { toast } = useToast();
  const anchorTx = useTransactionFlow();

  // Auto-advance to step 2 when wallet connects
  useEffect(() => {
    if (address && step === 1) setStep(2);
  }, [address, step]);

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
    toast("Genesis created!", "success");
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
    anchorTx.setPending();
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
      if (!res.ok) {
        const msg = data.error || "Failed to post blob";
        if (res.status === 503) {
          throw new Error("Arweave keys not configured. You can still create genesis and use Verify with existing chains.");
        }
        throw new Error(msg);
      }
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

      setLastArweaveId(arweaveId);
      setLastTxHash(hash);

      // Wait for on-chain confirmation
      const receipt = await anchorTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setAnchorError("Transaction failed or reverted");
        return;
      }

      const newPrev = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
      setPrevTxHash(newPrev);
      toast("Anchor confirmed on chain!", "success");
      setStep(5);
    } catch (e) {
      setAnchorError((e as Error).message);
      anchorTx.setStatus("failed");
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
      <Header activePage="home" />

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
                    <div className="flex items-center gap-2">
                      <p className="font-mono text-sm text-chain-neon break-all">
                        Genesis: {genesisHash.slice(0, 16)}…{genesisHash.slice(-8)}
                      </p>
                      <CopyButton text={genesisHash} />
                    </div>
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
              <TxStatusBadge status={anchorTx.status} txHash={anchorTx.txHash} />
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
                <CardTitle>Anchor confirmed</CardTitle>
                <CardDescription>
                  Your provenance event is anchored on {networkName}.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <a
                    href={`${explorerUrl}/tx/${lastTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-chain-neon break-all hover:underline"
                  >
                    Tx: {lastTxHash}
                  </a>
                  <CopyButton text={lastTxHash} />
                </div>
                {lastArweaveId && (
                  <div className="flex items-center gap-2">
                    <a
                      href={`https://arweave.net/${lastArweaveId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-muted-foreground break-all hover:text-chain-neon"
                    >
                      Arweave: {lastArweaveId}
                    </a>
                    <CopyButton text={lastArweaveId} />
                  </div>
                )}
                <div className="flex gap-2">
                  <Link href={lastTxHash ? `/chain/${genesisHash}?txes=${encodeURIComponent(lastTxHash)}` : `/chain/${genesisHash}`}>
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
