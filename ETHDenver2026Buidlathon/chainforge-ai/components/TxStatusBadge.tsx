"use client";

import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import type { TxStatus } from "@/hooks/useTransactionFlow";
import { useNetwork } from "./NetworkContext";

const statusConfig: Record<
  TxStatus,
  { icon: React.ReactNode; label: string; color: string } | null
> = {
  idle: null,
  pending: {
    icon: <Clock className="h-4 w-4 animate-pulse text-yellow-500" />,
    label: "Awaiting signature...",
    color: "text-yellow-500",
  },
  confirming: {
    icon: <Loader2 className="h-4 w-4 animate-spin text-blue-400" />,
    label: "Confirming on chain...",
    color: "text-blue-400",
  },
  confirmed: {
    icon: <CheckCircle2 className="h-4 w-4 text-chain-neon" />,
    label: "Confirmed!",
    color: "text-chain-neon",
  },
  failed: {
    icon: <XCircle className="h-4 w-4 text-destructive" />,
    label: "Failed",
    color: "text-destructive",
  },
};

export function TxStatusBadge({
  status,
  txHash,
}: {
  status: TxStatus;
  txHash?: string | null;
}) {
  const { explorerUrl } = useNetwork();
  const cfg = statusConfig[status];
  if (!cfg) return null;

  return (
    <div className="flex items-center gap-2 text-sm">
      {cfg.icon}
      <span className={cfg.color}>{cfg.label}</span>
      {txHash && (
        <a
          href={`${explorerUrl}/tx/${txHash}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-muted-foreground hover:text-chain-neon underline"
        >
          View tx
        </a>
      )}
    </div>
  );
}
