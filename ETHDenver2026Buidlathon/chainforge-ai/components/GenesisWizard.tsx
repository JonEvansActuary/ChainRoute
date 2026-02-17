"use client";

import { useState, useEffect } from "react";
import { useAccount, useWalletClient } from "wagmi";
import {
  getAnchorTxData,
  signAndSendWithLedger,
  getLedgerAddress,
  type AnchorParams,
} from "@/lib/chainroute/polygon-anchor";
import { isValidDelegateAddress, normalizeAddress } from "@/lib/validate-address";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { TxStatusBadge } from "@/components/TxStatusBadge";
import { useNetwork } from "@/components/NetworkContext";
import { useTransactionFlow } from "@/hooks/useTransactionFlow";
import { Loader2, Zap, UserPlus, ShieldCheck } from "lucide-react";
import type { Hash } from "viem";

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
  const [ledgerMode, setLedgerMode] = useState(false);
  const [ledgerAddress, setLedgerAddress] = useState<string | null>(null);
  const { rpcUrl, chainId } = useNetwork();
  const genesisTx = useTransactionFlow();

  useEffect(() => {
    if (address && !ledgerMode) setDelegate((d) => (d === "" || !d ? address : d));
  }, [address, ledgerMode]);

  async function createGenesis() {
    const delegateAddr = delegate.trim() ? normalizeAddress(delegate) : (ledgerMode ? ledgerAddress : address) ?? "";
    if (!isValidDelegateAddress(delegateAddr)) {
      setError("Next signer address must be 0x + 40 hex characters");
      return;
    }
    if (ledgerMode) {
      if (!ledgerAddress) {
        setError("Connect Ledger first (click \u201CUse Ledger\u201D and approve on device)");
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
        const hash = await signAndSendWithLedger(params, { rpcUrl, chainId });

        const receipt = await genesisTx.waitForConfirmation(hash as Hash);
        if (!receipt) {
          setError("Transaction failed or reverted");
          return;
        }

        const genesisHash = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
        onGenesisCreated(genesisHash);
      } catch (e) {
        setError((e as Error).message);
        genesisTx.setStatus("failed");
      } finally {
        setLoading(false);
      }
      return;
    }
    if (!address || !walletClient) {
      setError("Connect your wallet first");
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
      const hash = await walletClient.sendTransaction({
        to: address,
        data,
        value: 0n,
        gas: 100000n,
      });

      const receipt = await genesisTx.waitForConfirmation(hash as Hash);
      if (!receipt) {
        setError("Transaction failed or reverted");
        return;
      }

      const genesisHash = (hash.startsWith("0x") ? hash.slice(2) : hash).toLowerCase();
      onGenesisCreated(genesisHash);
    } catch (e) {
      setError((e as Error).message);
      genesisTx.setStatus("failed");
    } finally {
      setLoading(false);
    }
  }

  async function connectLedger() {
    setError(null);
    try {
      const addr = await getLedgerAddress({ rpcUrl, chainId });
      setLedgerAddress(addr);
      setDelegate(addr);
    } catch (e) {
      setError((e as Error).message);
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
        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-chain-neon/20 bg-muted/30 p-2">
          <span className="text-sm font-medium text-muted-foreground">Sign with:</span>
          <Button
            type="button"
            variant={ledgerMode ? "default" : "outline"}
            size="sm"
            onClick={() => setLedgerMode(false)}
          >
            Wallet
          </Button>
          <Button
            type="button"
            variant={ledgerMode ? "outline" : "default"}
            size="sm"
            className="flex items-center gap-1"
            onClick={() => setLedgerMode(true)}
          >
            <ShieldCheck className="h-4 w-4" />
            Ledger
          </Button>
          {ledgerMode && (
            <Button type="button" variant="secondary" size="sm" onClick={connectLedger}>
              {ledgerAddress ? `${ledgerAddress.slice(0, 6)}…${ledgerAddress.slice(-4)}` : "Use Ledger"}
            </Button>
          )}
        </div>
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
                if (ledgerMode && ledgerAddress) setDelegate(ledgerAddress);
                else if (address) setDelegate(address);
              }}
              title={ledgerMode ? "Use Ledger address" : "Use my address"}
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
          disabled={loading || (!ledgerMode && !address) || (ledgerMode && !ledgerAddress)}
        >
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {ledgerMode ? "Sign on Ledger…" : "Signing…"}
            </>
          ) : (
            ledgerMode ? "Create genesis (cold sign on Ledger)" : "Create genesis transaction"
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
