import { Header } from "@/components/Header";
import { Verifier } from "@/components/Verifier";

type Props = { searchParams: Promise<{ input?: string }> };

export default async function VerifyPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialInput = typeof params.input === "string" ? params.input : undefined;
  return (
    <div className="min-h-screen">
      <Header activePage="verify" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">Verify provenance chain</h1>
        <p className="mb-4 text-sm text-muted-foreground">
          Paste a Polygon transaction hash or genesis hash. Or load the example chain (HypotheticalPainting, Polygon mainnet).
        </p>
        <Verifier initialInput={initialInput} />
      </main>
    </div>
  );
}
