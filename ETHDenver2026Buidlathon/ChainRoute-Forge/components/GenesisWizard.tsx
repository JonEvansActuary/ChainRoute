"use client";

import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { getAnchorTxData, type AnchorParams } from "@/lib/chainroute/polygon-anchor";
import { ANCHOR_TARGET } from "@/lib/chainroute/constants";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { sendRawTransaction } from "@/lib/send-raw-tx";
import { saveGenesis } from "@/lib/chainroute/my-chains-store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { useTransactionFlow } from "@/hooks/useTransactionFlow";
import { Loader2, Zap, UserPlus } from "lucide-react";
import type { Hash } from "viem";

const ZERO_64 = "0".repeat(64);

export function GenesisWizard({
  onGenesisCreated,
}: {
  onGenesisCreated: (genesisTxHash: string) => void;
}) {
  const { address, isConnected } = useAccount();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegate, setDelegate] = useState("");
  const genesisTx = useTransactionFlow();

  useEffect(() => {
    if (address) setDelegate((d) => (d === "" || !d ? address : d));
  }, [address]);

  async function createGenesis() {
    if (!address || !isConnected) {
      setError("Connect your wallet first");
      return;
    }
    const delegateAddr = delegate.trim() ? normalizeAddress(delegate) : address;
    if (!isValidDelegateAddress(delegateAddr)) {
      setError("Next signer address must be 0x + 40 hex characters");
      return;
    }
    setLoading(true);
    setError(null);
    genesisTx.setPending();
    try {
      const params: AnchorParams = {
        genesisHash: ZERO_64,
        previousPolygonHash: ZERO_64,
        arweaveBlobTxId: "",
        delegate: delegateAddr,
      };
      const data = getAnchorTxData(params);
      const hash = await sendRawTransaction({
        from: address,
        to: ANCHOR_TARGET,
        data,
      });

      const receipt = await genesisTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setError("Transaction failed or reverted");
        return;
      }

      const genesisHash = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
      saveGenesis(genesisHash, hash, delegateAddr);
      onGenesisCreated(genesisHash);
    } catch (e) {
      setError((e as Error).message);
      genesisTx.setStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="border-chain-neon/30">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-chain-neon" />
          Create genesis
        </CardTitle>
        <CardDescription>
          Anchor the start of your provenance chain. Optionally set who may sign the next anchor (delegate).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <UserPlus className="h-4 w-4" />
            Next signer (delegate) address
          </label>
          <div className="flex gap-2">
            <Input
              placeholder="0x... or leave blank for yourself"
              value={delegate}
              onChange={(e) => setDelegate(e.target.value)}
              className="font-mono text-sm"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (address) setDelegate(address);
              }}
              title="Use my address"
            >
              Me
            </Button>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Who can sign the next anchor in this chain. Default: your address.
          </p>
        </div>
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
            "Create genesis transaction"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
