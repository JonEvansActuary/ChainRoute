"use client";

import { Header } from "@/components/Header";
import { CreateFlow } from "@/components/CreateFlow";

export default function CreatePage() {
  return (
    <div className="min-h-screen">
      <Header activePage="create" />
      <main className="mx-auto max-w-2xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create a provenance chain</h1>
          <p className="mt-1 text-muted-foreground">
            Connect your wallet, create a genesis anchor, then chain events.
          </p>
        </div>
        <CreateFlow />
      </main>
    </div>
  );
}
