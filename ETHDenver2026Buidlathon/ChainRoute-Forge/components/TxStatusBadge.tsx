"use client";

import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useNetwork } from "@/components/NetworkContext";
import type { TxStatus } from "@/hooks/useTransactionFlow";

interface TxStatusBadgeProps {
  status: TxStatus;
  txHash?: string | null;
}

export function TxStatusBadge({ status, txHash }: TxStatusBadgeProps) {
  const { explorerUrl } = useNetwork();

  if (status === "idle") return null;

  const config: Record<
    Exclude<TxStatus, "idle">,
    { icon: React.ReactNode; label: string; className: string }
  > = {
    pending: {
      icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
      label: "Waiting for signature…",
      className: "border-yellow-500/40 bg-yellow-500/10 text-yellow-300",
    },
    confirming: {
      icon: <Clock className="h-3.5 w-3.5" />,
      label: "Confirming on chain…",
      className: "border-blue-500/40 bg-blue-500/10 text-blue-300",
    },
    confirmed: {
      icon: <CheckCircle2 className="h-3.5 w-3.5" />,
      label: "Confirmed",
      className: "border-green-500/40 bg-green-500/10 text-green-300",
    },
    failed: {
      icon: <XCircle className="h-3.5 w-3.5" />,
      label: "Failed",
      className: "border-red-500/40 bg-red-500/10 text-red-300",
    },
  };

  const c = config[status as Exclude<TxStatus, "idle">];
  if (!c) return null;

  const badge = (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium ${c.className}`}
    >
      {c.icon}
      {c.label}
    </span>
  );

  if (txHash && (status === "confirming" || status === "confirmed")) {
    return (
      <a
        href={`${explorerUrl}/tx/${txHash}`}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block"
      >
        {badge}
      </a>
    );
  }

  return badge;
}
