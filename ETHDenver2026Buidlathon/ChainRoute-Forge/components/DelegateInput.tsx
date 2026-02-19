"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { isValidDelegateAddress } from "@/lib/validate-address";
import { UserPlus, AlertCircle } from "lucide-react";

interface DelegateInputProps {
  value: string;
  onChange: (value: string) => void;
  address?: string;
  label?: string;
  description?: string;
}

export function DelegateInput({
  value,
  onChange,
  address,
  label = "Next signer (delegate) address",
  description = "Who can sign the next anchor in this chain. Default: your address.",
}: DelegateInputProps) {
  const trimmed = value.trim();
  const showError = trimmed.length > 0 && !isValidDelegateAddress(trimmed);

  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <UserPlus className="h-4 w-4" />
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder="0x... or leave blank for yourself"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`font-mono text-sm ${showError ? "border-red-500/50" : ""}`}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            if (address) onChange(address);
          }}
          disabled={!address}
          title="Use my address"
        >
          Me
        </Button>
      </div>
      {showError && (
        <p className="mt-1 flex items-center gap-1 text-xs text-red-400">
          <AlertCircle className="h-3 w-3" />
          Must be 0x + 40 hex characters
        </p>
      )}
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
