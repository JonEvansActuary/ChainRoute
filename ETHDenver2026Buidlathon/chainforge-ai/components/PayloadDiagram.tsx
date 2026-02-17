"use client";

const segments = [
  {
    label: "genesisHash",
    bytes: 32,
    hex: 64,
    color: "bg-chain-neon/15 border-chain-neon/50 text-chain-neon",
    desc: "Root anchor reference",
  },
  {
    label: "previousHash",
    bytes: 32,
    hex: 64,
    color: "bg-blue-500/15 border-blue-500/50 text-blue-400",
    desc: "Previous tx hash (chain link)",
  },
  {
    label: "arweaveId",
    bytes: 43,
    hex: 43,
    color: "bg-purple-500/15 border-purple-500/50 text-purple-400",
    desc: "Data blob ID (optional)",
  },
  {
    label: "delegate",
    bytes: 20,
    hex: 40,
    color: "bg-amber-500/15 border-amber-500/50 text-amber-400",
    desc: "Next authorized signer",
  },
] as const;

const TOTAL = 127;

export function PayloadDiagram() {
  return (
    <div className="space-y-4">
      {/* Bar diagram - horizontal on desktop, vertical on mobile */}
      <div className="flex flex-col gap-1 sm:flex-row sm:gap-0">
        {segments.map((seg) => (
          <div
            key={seg.label}
            className={`flex flex-col items-center justify-center rounded-md border px-3 py-3 sm:rounded-none sm:first:rounded-l-md sm:last:rounded-r-md ${seg.color}`}
            style={{ flex: seg.bytes }}
          >
            <span className="text-xs font-bold tracking-tight">{seg.label}</span>
            <span className="text-[10px] opacity-70">{seg.bytes}B</span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Total: <span className="font-mono font-medium text-foreground">{TOTAL} bytes</span>{" "}
        &mdash; sent as <span className="font-mono">0x</span> + 254 hex chars in the tx data field
      </p>

      {/* Genesis vs Event explanation */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-chain-neon/20 bg-chain-neon/5 p-3">
          <p className="mb-1 text-xs font-semibold text-chain-neon">Genesis transaction</p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li><span className="font-mono text-chain-neon">genesisHash</span> = 0x000...0</li>
            <li><span className="font-mono text-blue-400">previousHash</span> = 0x000...0</li>
            <li><span className="font-mono text-purple-400">arweaveId</span> = empty</li>
            <li><span className="font-mono text-amber-400">delegate</span> = next signer</li>
          </ul>
        </div>
        <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
          <p className="mb-1 text-xs font-semibold text-blue-400">Event transaction</p>
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            <li><span className="font-mono text-chain-neon">genesisHash</span> = genesis tx hash</li>
            <li><span className="font-mono text-blue-400">previousHash</span> = prev tx hash</li>
            <li><span className="font-mono text-purple-400">arweaveId</span> = blob ID or empty</li>
            <li><span className="font-mono text-amber-400">delegate</span> = next signer</li>
          </ul>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Every anchor is a <span className="font-medium text-foreground">zero-value transaction sent to yourself</span> on Polygon.
        No smart contracts. The 127-byte payload in the data field <em>is</em> the protocol.
      </p>
    </div>
  );
}
