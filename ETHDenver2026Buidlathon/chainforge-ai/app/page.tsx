import Link from "next/link";
import { Header } from "@/components/Header";
import { PayloadDiagram } from "@/components/PayloadDiagram";
import { DEMO_CHAIN_GENESIS_TX } from "@/lib/demo-chain";

export default function HomePage() {
  return (
    <div className="min-h-screen">
      <Header activePage="home" />

      <main className="mx-auto max-w-3xl px-4 py-12">
        {/* Hero */}
        <section className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Chain<span className="text-chain-neon">Route</span>
          </h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Anchor provenance chains on Polygon in 127 bytes.
            No smart contracts. No tokens. Just data.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/create">
              <span className="inline-flex items-center gap-2 rounded-md border border-chain-neon/50 bg-chain-neon/20 px-6 py-3 text-sm font-medium text-chain-neon shadow transition-colors hover:bg-chain-neon/30 cursor-pointer">
                Try the Protocol
              </span>
            </Link>
            <Link href="/verify">
              <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-6 py-3 text-sm font-medium text-foreground shadow transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
                Verify a Chain
              </span>
            </Link>
          </div>
        </section>

        {/* Payload Diagram */}
        <section className="mb-12">
          <h2 className="mb-4 text-center text-xl font-semibold">The 127-byte payload</h2>
          <PayloadDiagram />
        </section>

        {/* How It Works */}
        <section className="mb-12">
          <h2 className="mb-6 text-center text-xl font-semibold">How it works</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-chain-neon/30 bg-chain-neon/5 p-5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-chain-neon/20 text-sm font-bold text-chain-neon">
                1
              </div>
              <h3 className="mb-1 font-semibold">Genesis</h3>
              <p className="text-sm text-muted-foreground">
                Create the root anchor. A zero-value transaction to yourself with the 127-byte payload.
                The tx hash becomes the chain&apos;s unique ID.
              </p>
            </div>
            <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/20 text-sm font-bold text-blue-400">
                2
              </div>
              <h3 className="mb-1 font-semibold">Chain Events</h3>
              <p className="text-sm text-muted-foreground">
                Each new anchor references the genesis hash and the previous tx hash, forming an
                immutable linked chain on Polygon.
              </p>
            </div>
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-5">
              <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/20 text-sm font-bold text-amber-400">
                3
              </div>
              <h3 className="mb-1 font-semibold">Delegate</h3>
              <p className="text-sm text-muted-foreground">
                Every anchor names the next authorized signer. Pass signing authority to another
                wallet for multi-party provenance.
              </p>
            </div>
          </div>
        </section>

        {/* Arweave data layer */}
        <section className="mb-12">
          <div className="rounded-lg border border-purple-500/30 bg-purple-500/5 p-5">
            <h3 className="mb-2 font-semibold text-purple-400">Optional: Arweave data layer</h3>
            <p className="text-sm text-muted-foreground">
              The 43-byte <span className="font-mono text-purple-400">arweaveId</span> field can
              link each anchor to a permanent JSON blob on Arweave containing event metadata,
              timestamps, and references to support files (images, PDFs, etc). The core chaining
              protocol works with or without it.
            </p>
          </div>
        </section>

        {/* Demo CTA */}
        <section className="text-center">
          <p className="mb-3 text-sm text-muted-foreground">
            See a real chain verified on Polygon Mainnet:
          </p>
          <Link href={`/verify?input=${encodeURIComponent(DEMO_CHAIN_GENESIS_TX)}`}>
            <span className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground shadow transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer">
              Verify the HypotheticalPainting example
            </span>
          </Link>
        </section>
      </main>
    </div>
  );
}
