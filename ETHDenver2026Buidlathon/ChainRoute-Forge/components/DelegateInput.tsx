"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface DelegateInputProps {
  value: string;
  onChange: (value: string) => void;
  /** Connected wallet address (for "Me" button) */
  address?: string;
  label?: string;
  description?: string;
}

export function DelegateInput({
  value,
  onChange,
  address,
  label = "Next signer (delegate)",
  description = "Who can sign the next anchor. Blank = you.",
}: DelegateInputProps) {
  return (
    <div>
      <label className="mb-1 flex items-center gap-2 text-sm font-medium text-muted-foreground">
        <UserPlus className="h-4 w-4" />
        {label}
      </label>
      <div className="flex gap-2">
        <Input
          placeholder={address ?? "0x..."}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="font-mono text-sm"
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => address && onChange(address)}
          title="Use my address"
        >
          Me
        </Button>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">{description}</p>
    </div>
  );
}
