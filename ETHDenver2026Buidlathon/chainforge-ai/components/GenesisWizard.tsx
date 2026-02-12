"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { getAnchorTxData, type AnchorParams } from "@/lib/chainroute/polygon-anchor";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Loader2, Zap, UserPlus } from "lucide-react";

const ZERO_64 = "0".repeat(64);

export function GenesisWizard({
  onGenesisCreated,
}: {
  onGenesisCreated: (genesisTxHash: string) => void;
}) {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [delegate, setDelegate] = useState("");

  useEffect(() => {
    if (address) setDelegate((d) => (d === "" || !d ? address : d));
  }, [address]);

  async function createGenesis() {
    if (!address || !walletClient) {
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
    try {
      const params: AnchorParams = {
        genesisHash: ZERO_64,
        previousPolygonHash: ZERO_64,
        arweaveBlobTxId: "",
        delegate: delegateAddr,
      };
      const data = getAnchorTxData(params);
      const hash = await walletClient.sendTransaction({
        to: address,
        data,
        value: 0n,
        gas: 100000n,
      });
      const genesisHash = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
      onGenesisCreated(genesisHash);
    } catch (e) {
      setError((e as Error).message);
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
              onClick={() => address && setDelegate(address)}
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
        <Button
          variant="chain"
          className="w-full"
          onClick={createGenesis}
          disabled={!address || loading}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Signing…
            </>
          ) : (
            "Create genesis transaction"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
