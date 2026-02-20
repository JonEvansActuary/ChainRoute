"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { WalletConnect } from "@/components/WalletConnect";
import { GenesisWizard } from "@/components/GenesisWizard";
import { SupportUploader, type SupportWithFile } from "@/components/SupportUploader";
import { EventBuilder, type EventForm } from "@/components/EventBuilder";
import { DelegateInput } from "@/components/DelegateInput";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { CopyButton } from "@/components/CopyButton";
import { useNetwork } from "@/components/NetworkContext";
import { useToast } from "@/components/ToastContext";
import { useTransactionFlow } from "@/hooks/useTransactionFlow";
import { getAnchorTxData } from "@/lib/chainroute/polygon-anchor";
import { ANCHOR_TARGET, ARWEAVE_GATEWAY } from "@/lib/chainroute/constants";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { sendRawTransaction } from "@/lib/send-raw-tx";
import { addEvent } from "@/lib/chainroute/my-chains-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Loader2,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Link2,
  Zap,
  Upload,
  Sparkles,
  Eye,
  Anchor,
} from "lucide-react";
import Link from "next/link";
import type { Hash } from "viem";

type Step = "connect" | "genesis" | "supports" | "event" | "review" | "anchor" | "done";

const STEPS: { key: Step; label: string; icon: React.ReactNode }[] = [
  { key: "connect", label: "Connect", icon: <Link2 className="h-4 w-4" /> },
  { key: "genesis", label: "Genesis", icon: <Zap className="h-4 w-4" /> },
  { key: "supports", label: "Supports", icon: <Upload className="h-4 w-4" /> },
  { key: "event", label: "Event", icon: <Sparkles className="h-4 w-4" /> },
  { key: "review", label: "Review", icon: <Eye className="h-4 w-4" /> },
  { key: "anchor", label: "Anchor", icon: <Anchor className="h-4 w-4" /> },
  { key: "done", label: "Done", icon: <CheckCircle2 className="h-4 w-4" /> },
];

export function CreateFlow() {
  const [step, setStep] = useState<Step>("connect");
  const [genesisHash, setGenesisHash] = useState<string | null>(null);
  const [supports, setSupports] = useState<SupportWithFile[]>([]);
  const [event, setEvent] = useState<EventForm | null>(null);
  const [delegate, setDelegate] = useState("");
  const [arweaveId, setArweaveId] = useState<string | null>(null);
  const [arweaveWarning, setArweaveWarning] = useState<string | null>(null);
  const [anchorError, setAnchorError] = useState<string | null>(null);
  const [anchorLoading, setAnchorLoading] = useState(false);
  const [finalTxHash, setFinalTxHash] = useState<string | null>(null);

  const { address, isConnected, chainId } = useAccount();
  const { networkName, explorerUrl } = useNetwork();
  const { toast } = useToast();
  const anchorTx = useTransactionFlow();

  // Auto-advance from connect step when wallet connected
  useEffect(() => {
    if (step === "connect" && isConnected) {
      setStep("genesis");
    }
  }, [step, isConnected]);

  // Set delegate to connected address by default
  useEffect(() => {
    if (address && !delegate) setDelegate(address);
  }, [address, delegate]);

  const currentStepIndex = STEPS.findIndex((s) => s.key === step);

  function goBack() {
    if (currentStepIndex <= 0) return;
    // Skip connect if already connected
    const prevIndex = currentStepIndex - 1;
    const prevStep = STEPS[prevIndex].key;
    if (prevStep === "connect" && isConnected) {
      if (prevIndex > 0) setStep(STEPS[prevIndex - 1].key);
      return;
    }
    setStep(prevStep);
  }

  async function postBlobAndAnchor() {
    if (!genesisHash || !address) return;

    const delegateAddr = delegate.trim() ? normalizeAddress(delegate) : address;
    if (!isValidDelegateAddress(delegateAddr)) {
      setAnchorError("Delegate address must be 0x + 40 hex characters");
      return;
    }

    setAnchorLoading(true);
    setAnchorError(null);
    setArweaveWarning(null);
    anchorTx.setPending();

    let blobArweaveId = "";

    // Step 1: Post blob to Arweave
    if (event) {
      try {
        const supportItems = supports
          .filter((s) => s.id)
          .map((s) => ({ id: s.id, label: s.label }));

        const res = await fetch("/api/arweave/post-blob", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            genesisHash,
            event: {
              eventType: event.eventType,
              timestamp: new Date().toISOString(),
              summary: event.summary,
            },
            supports: supportItems,
          }),
        });

        const data = await res.json();

        if (res.status === 503) {
          // No Arweave key — proceed without blob
          setArweaveWarning(
            "Arweave upload unavailable (no server key). Anchoring without blob — you can attach one later."
          );
        } else if (!res.ok) {
          throw new Error(data.error || "Failed to post blob to Arweave");
        } else {
          blobArweaveId = data.arweaveId;
          setArweaveId(blobArweaveId);
        }
      } catch (e) {
        const msg = (e as Error).message;
        if (msg.includes("503") || msg.includes("ARWEAVE") || msg.includes("server key")) {
          setArweaveWarning(
            "Arweave upload unavailable. Anchoring without blob."
          );
        } else {
          setAnchorError(`Arweave error: ${msg}`);
          setAnchorLoading(false);
          anchorTx.setStatus("failed");
          return;
        }
      }
    }

    // Step 2: Sign Polygon anchor tx
    try {
      const txData = getAnchorTxData({
        genesisHash,
        previousPolygonHash: genesisHash, // first event after genesis → prev = genesis
        arweaveBlobTxId: blobArweaveId,
        delegate: delegateAddr,
      });

      const hash = await sendRawTransaction(
        { from: address, to: ANCHOR_TARGET, data: txData },
        undefined,
        chainId ?? undefined
      );

      const { receipt, error: receiptError } = await anchorTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setAnchorError(receiptError ?? "Transaction failed or reverted");
        setAnchorLoading(false);
        return;
      }

      setFinalTxHash(hash);
      if (genesisHash) addEvent(genesisHash, hash, delegateAddr);
      toast("Anchor confirmed on chain!", "success");
      setStep("done");
    } catch (e) {
      setAnchorError((e as Error).message);
      anchorTx.setStatus("failed");
    } finally {
      setAnchorLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {STEPS.map((s, i) => {
          const isActive = s.key === step;
          const isPast = i < currentStepIndex;
          return (
            <div key={s.key} className="flex items-center gap-1">
              {i > 0 && (
                <div
                  className={`h-px w-4 sm:w-8 ${
                    isPast ? "bg-chain-neon" : "bg-border"
                  }`}
                />
              )}
              <div
                className={`flex items-center gap-1 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "border-chain-neon/50 bg-chain-neon/15 text-chain-neon"
                    : isPast
                      ? "border-chain-neon/30 bg-chain-neon/5 text-chain-neon/70"
                      : "border-border text-muted-foreground"
                }`}
              >
                {isPast ? <CheckCircle2 className="h-3 w-3" /> : s.icon}
                <span className="hidden sm:inline">{s.label}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Step content */}

      {step === "connect" && (
        <WalletConnect />
      )}

      {step === "genesis" && (
        <GenesisWizard
          onGenesisCreated={(hash) => {
            setGenesisHash(hash);
            setStep("supports");
          }}
        />
      )}

      {step === "supports" && (
        <div className="space-y-4">
          <SupportUploader
            genesisHash={genesisHash}
            supports={supports}
            onSupportsChange={setSupports}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="chain"
              className="flex-1"
              onClick={() => setStep("event")}
            >
              {supports.length === 0 ? "Skip supports" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "event" && (
        <div className="space-y-4">
          <EventBuilder
            supportLabels={supports.filter((s) => s.label).map((s) => s.label!)}
            onEventChange={setEvent}
            initialEvent={event}
          />
          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="chain"
              className="flex-1"
              onClick={() => setStep("review")}
              disabled={!event?.eventType}
            >
              Review
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "review" && (
        <div className="space-y-4">
          <Card className="border-chain-neon/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5 text-chain-neon" />
                Review &amp; anchor
              </CardTitle>
              <CardDescription>
                Review your chain data, set the next delegate, then anchor everything to Polygon.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Genesis info */}
              {genesisHash && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Genesis hash</p>
                  <div className="flex items-center gap-2">
                    <p className="font-mono text-xs text-chain-neon break-all">
                      {genesisHash.slice(0, 16)}...{genesisHash.slice(-8)}
                    </p>
                    <CopyButton text={genesisHash} />
                  </div>
                </div>
              )}

              {/* Event summary */}
              {event && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">Event</p>
                  <p className="text-sm">
                    Type: <span className="font-medium text-chain-neon">{event.eventType}</span>
                  </p>
                  <pre className="mt-1 max-h-32 overflow-auto text-xs text-muted-foreground">
                    {JSON.stringify(event.summary, null, 2)}
                  </pre>
                </div>
              )}

              {/* Supports */}
              {supports.length > 0 && (
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-xs font-medium text-muted-foreground">
                    Supports ({supports.length})
                  </p>
                  <ul className="mt-1 space-y-1">
                    {supports.map((s, i) => (
                      <li key={i} className="text-xs">
                        <span className="text-foreground">{s.label || "Untitled"}</span>
                        {s.id && (
                          <span className="ml-2 font-mono text-chain-neon">
                            {s.id.slice(0, 12)}...
                          </span>
                        )}
                        {!s.id && s.error && (
                          <>
                            <span className="ml-2 text-red-400">(upload failed)</span>
                            <p className="mt-0.5 text-red-400/90" title={s.error}>
                              {s.error.length > 80 ? s.error.slice(0, 80) + "…" : s.error}
                            </p>
                          </>
                        )}
                        {!s.id && !s.error && (
                          <span className="ml-2 text-amber-400" title="Go back to Supports and click ‘Upload to Arweave’ for each file. If the server has no Arweave key (ARWEAVE_KEY_PATH or ARWEAVE_JWK), uploads will fail.">
                            (not uploaded)
                          </span>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Delegate */}
              <DelegateInput
                value={delegate}
                onChange={setDelegate}
                address={address}
                label="Next signer after this event"
                description="Who can sign the next anchor. Leave your address to keep control."
              />
            </CardContent>
          </Card>

          <div className="flex gap-2">
            <Button variant="outline" onClick={goBack}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <Button
              variant="chain"
              className="flex-1"
              onClick={() => {
                setStep("anchor");
                postBlobAndAnchor();
              }}
              disabled={!event?.eventType}
            >
              Post blob &amp; anchor
              <Anchor className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {step === "anchor" && (
        <Card className="border-chain-neon/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Anchor className="h-5 w-5 text-chain-neon" />
              Anchoring
            </CardTitle>
            <CardDescription>
              Posting blob to Arweave and anchoring on {networkName}...
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {arweaveWarning && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-500/5 p-3 text-sm text-amber-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {arweaveWarning}
              </div>
            )}
            {arweaveId && (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Arweave ID:</span>
                <span className="font-mono text-xs text-purple-400">{arweaveId.slice(0, 16)}...</span>
                <CopyButton text={arweaveId} />
              </div>
            )}
            <TxStatusBadge status={anchorTx.status} txHash={anchorTx.txHash} />
            {anchorError && (
              <div className="flex items-start gap-2 text-sm text-red-400">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                {anchorError}
              </div>
            )}
            {anchorLoading && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Waiting for transaction...
              </div>
            )}
            {anchorError && (
              <Button
                variant="chain"
                onClick={() => {
                  setAnchorError(null);
                  anchorTx.reset();
                  postBlobAndAnchor();
                }}
              >
                Retry
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step === "done" && genesisHash && (
        <Card className="border-chain-neon/50 chain-glow">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-chain-neon">
              <CheckCircle2 className="h-5 w-5" />
              Chain created!
            </CardTitle>
            <CardDescription>
              Your provenance chain is anchored on {networkName}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Genesis:</span>
                <span className="font-mono text-xs text-chain-neon break-all">
                  {genesisHash.slice(0, 20)}...{genesisHash.slice(-8)}
                </span>
                <CopyButton text={genesisHash} />
              </div>
              {finalTxHash && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Anchor tx:</span>
                  <a
                    href={`${explorerUrl}/tx/${finalTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-chain-neon hover:underline break-all"
                  >
                    {finalTxHash.slice(0, 20)}...{finalTxHash.slice(-8)}
                  </a>
                  <CopyButton text={finalTxHash} />
                </div>
              )}
              {arweaveId && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Arweave blob:</span>
                  <a
                    href={`${ARWEAVE_GATEWAY.replace(/\/$/, "")}/${arweaveId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-purple-400 hover:underline"
                  >
                    {arweaveId.slice(0, 16)}...
                  </a>
                  <CopyButton text={arweaveId} />
                </div>
              )}
              {arweaveWarning && (
                <p className="text-xs text-amber-400">No Arweave blob (server key not set)</p>
              )}
            </div>

            <div className="flex flex-wrap gap-2">
              <Link href={`/verify?input=0x${genesisHash}`}>
                <Button variant="chain" size="sm">
                  Verify chain
                </Button>
              </Link>
              <Link
                href={`/chain/${genesisHash}${finalTxHash ? `?txes=${encodeURIComponent(finalTxHash)}` : ""}`}
              >
                <Button variant="outline" size="sm">
                  View chain
                </Button>
              </Link>
              <Link
                href={`/continue?input=${finalTxHash ? encodeURIComponent(finalTxHash) : `0x${genesisHash}`}`}
              >
                <Button variant="outline" size="sm">
                  Continue chain
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
