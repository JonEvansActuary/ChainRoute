"use client";

export function PayloadDiagram() {
  const blocks = [
    {
      label: "Genesis Hash",
      bytes: "32 B",
      color: "border-green-500/50 bg-green-500/10 text-green-600 dark:text-green-400",
      dotColor: "bg-green-500",
      desc: "Chain root ID (zeros for genesis tx)",
    },
    {
      label: "Prev Hash",
      bytes: "32 B",
      color: "border-blue-500/50 bg-blue-500/10 text-blue-600 dark:text-blue-400",
      dotColor: "bg-blue-500",
      desc: "Previous Polygon tx hash",
    },
    {
      label: "Arweave ID",
      bytes: "43 B",
      color: "border-purple-500/50 bg-purple-500/10 text-purple-600 dark:text-purple-400",
      dotColor: "bg-purple-500",
      desc: "Permanent JSON blob on Arweave",
    },
    {
      label: "Delegate",
      bytes: "20 B",
      color: "border-amber-500/50 bg-amber-500/10 text-amber-600 dark:text-amber-400",
      dotColor: "bg-amber-500",
      desc: "Next authorized signer address",
    },
  ];

  return (
    <div className="space-y-4">
      {/* Color blocks */}
      <div className="flex gap-1.5">
        {blocks.map((b) => (
          <div
            key={b.label}
            className={`flex-1 rounded-lg border px-3 py-2 text-center ${b.color}`}
          >
            <div className="text-xs font-bold">{b.label}</div>
            <div className="text-[10px] opacity-70">{b.bytes}</div>
          </div>
        ))}
      </div>

      {/* Descriptions — each on one line with colored dot */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-4">
        {blocks.map((b) => (
          <div key={b.label} className="flex items-start gap-1.5">
            <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${b.dotColor}`} />
            <span>
              <span className="font-medium text-foreground">{b.label}</span>{" "}
              — {b.desc}
            </span>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-muted-foreground">
        Total: <span className="font-mono font-bold text-chain-neon">127 bytes</span>{" "}
        stored in the <code className="rounded bg-muted px-1 text-xs">data</code> field of a zero-value Polygon tx
      </p>
    </div>
  );
}
