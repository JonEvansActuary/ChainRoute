import Link from "next/link";
import { Verifier } from "@/components/Verifier";
import { Button } from "@/components/ui/button";

export default function VerifyPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-2">
          <Link href="/" className="text-xl font-bold text-chain-neon">
            ChainForge AI
          </Link>
          <nav className="flex items-center gap-2">
            <Link href="/continue" className="text-sm text-muted-foreground hover:text-chain-neon">
              Continue chain
            </Link>
            <Link href="/">
              <Button variant="ghost" size="sm">Home</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Verify provenance chain</h1>
        <Verifier />
      </main>
    </div>
  );
}
