"use client";

import { useNetwork } from "./NetworkContext";
import { Button } from "./ui/button";
import { ArrowLeftRight } from "lucide-react";

export function NetworkSwitcher() {
  const { network, setNetwork } = useNetwork();

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => setNetwork(network === "amoy" ? "polygon" : "amoy")}
      className="gap-1 text-xs font-mono"
    >
      <ArrowLeftRight className="h-3 w-3" />
      {network === "amoy" ? "Amoy" : "Mainnet"}
    </Button>
  );
}
