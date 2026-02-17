"use client";

import { useCallback } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { X } from "lucide-react";

interface QRCodeModalProps {
  open: boolean;
  onClose: () => void;
  verifyUrl: string;
  title?: string;
}

export function QRCodeModal({
  open,
  onClose,
  verifyUrl,
  title = "Verify provenance",
}: QRCodeModalProps) {
  const handleBackdrop = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === e.currentTarget) onClose();
    },
    [onClose]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={handleBackdrop}
    >
      <Card className="w-full max-w-sm border-chain-neon/50 chain-glow">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle>{title}</CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <QRCodeSVG value={verifyUrl} size={200} level="M" includeMargin />
          <p className="text-center text-sm text-muted-foreground">
            Scan to open verifier
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
