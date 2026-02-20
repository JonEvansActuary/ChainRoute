"use client";

import { useState, useCallback } from "react";
import { useAccount, usePublicClient } from "wagmi";
import type { Hash, TransactionReceipt } from "viem";
import { waitForReceiptViaProvider } from "@/lib/wait-for-receipt-provider";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

type EIP1193Provider = { request: (args: { method: string; params: unknown[] }) => Promise<unknown> };

function getWalletProvider(): EIP1193Provider | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { ethereum?: EIP1193Provider };
  const eth = w.ethereum;
  if (Array.isArray(eth)) return eth[0] ?? null;
  return eth ?? null;
}

export function useTransactionFlow() {
  const { chainId: walletChainId, connector } = useAccount();
  const publicClient = usePublicClient({ chainId: walletChainId as 80002 | 137 | undefined });
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);

  const waitForConfirmation = useCallback(
    async (
      hash: Hash,
      providerOverride?: EIP1193Provider
    ): Promise<{ receipt: TransactionReceipt | null; error: string | null }> => {
      setTxHash(hash);
      setStatus("confirming");
      const connectorProvider =
        providerOverride ??
        (connector && typeof (connector as { getProvider?: () => Promise<EIP1193Provider> }).getProvider === "function"
          ? await (connector as { getProvider: () => Promise<EIP1193Provider> }).getProvider()
          : null);
      const walletProvider = connectorProvider ?? getWalletProvider();
      if (walletProvider) {
        const result = await waitForReceiptViaProvider(hash, walletProvider, {
          timeout: 300_000,
          pollingInterval: 2_000,
        });
        if (result.error) {
          setStatus("failed");
          setError(result.error);
          return { receipt: null, error: result.error };
        }
        if (result.receipt) {
          if (result.receipt.status === "reverted") {
            setStatus("failed");
            setError("Transaction reverted");
            return { receipt: null, error: "Transaction reverted" };
          }
          setStatus("confirmed");
          return { receipt: result.receipt as TransactionReceipt, error: null };
        }
      }
      if (!publicClient) {
        const msg = "Wallet chain not available for receipt. Try reconnecting.";
        setStatus("failed");
        setError(msg);
        return { receipt: null, error: msg };
      }
      try {
        const receipt = await publicClient.waitForTransactionReceipt({
          hash,
          confirmations: 1,
          timeout: 300_000,
          retryCount: 24,
          retryDelay: 2_000,
        });
        if (receipt.status === "reverted") {
          setStatus("failed");
          setError("Transaction reverted");
          return { receipt: null, error: "Transaction reverted" };
        }
        setStatus("confirmed");
        return { receipt, error: null };
      } catch (e) {
        const errMsg = (e as Error).message;
        setStatus("failed");
        setError(errMsg);
        return { receipt: null, error: errMsg };
      }
    },
    [publicClient, connector],
  );

  const reset = useCallback(() => {
    setStatus("idle");
    setTxHash(null);
    setError(null);
  }, []);

  const setPending = useCallback(() => {
    setStatus("pending");
    setError(null);
  }, []);

  return { status, txHash, error, waitForConfirmation, reset, setPending, setStatus };
}
