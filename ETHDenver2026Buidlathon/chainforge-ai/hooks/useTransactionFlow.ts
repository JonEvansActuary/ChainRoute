"use client";

import { useState, useCallback } from "react";
import { usePublicClient } from "wagmi";
import type { Hash, TransactionReceipt } from "viem";

export type TxStatus = "idle" | "pending" | "confirming" | "confirmed" | "failed";

export function useTransactionFlow() {
  const publicClient = usePublicClient();
  const [status, setStatus] = useState<TxStatus>("idle");
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);

  const waitForConfirmation = useCallback(
    async (hash: Hash): Promise<TransactionReceipt | null> => {
      setTxHash(hash);
      setStatus("confirming");
      try {
        const receipt = await publicClient!.waitForTransactionReceipt({
          hash,
          confirmations: 1,
        });
        if (receipt.status === "reverted") {
          setStatus("failed");
          setError("Transaction reverted");
          return null;
        }
        setStatus("confirmed");
        return receipt;
      } catch (e) {
        setStatus("failed");
        setError((e as Error).message);
        return null;
      }
    },
    [publicClient],
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
