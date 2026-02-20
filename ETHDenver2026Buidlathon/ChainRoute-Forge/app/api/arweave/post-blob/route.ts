import { NextRequest, NextResponse } from "next/server";
import { buildAndValidateBlob } from "@/lib/chainroute/build-blob";
import type { SupportItem } from "@/lib/chainroute/types";
import { getArweaveKey } from "@/lib/arweave-key";

/**
 * POST: body = { genesisHash, event: { eventType, timestamp?, summary }, supports: SupportItem[] }
 * Posts provenance blob to Arweave (server-side with ARWEAVE_KEY_PATH or ARWEAVE_JWK).
 * Returns { arweaveId }.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { genesisHash, event, supports = [] } = body as {
      genesisHash: string;
      event: { eventType: string; timestamp?: string; summary: Record<string, unknown> };
      supports: SupportItem[];
    };
    if (!genesisHash || !event?.eventType || !event?.summary) {
      return NextResponse.json(
        { error: "Missing genesisHash, event.eventType, or event.summary" },
        { status: 400 }
      );
    }
    const blob = buildAndValidateBlob(genesisHash, event, supports);
    let key: object;
    try {
      key = getArweaveKey();
    } catch (e) {
      return NextResponse.json(
        { error: (e as Error).message },
        { status: 503 }
      );
    }
    const Arweave = (await import("arweave")).default;
    const arweave = Arweave.init({ host: "arweave.net", port: 443, protocol: "https" });
    const tx = await arweave.createTransaction({
      data: new TextEncoder().encode(JSON.stringify(blob)),
    });
    tx.addTag("Content-Type", "application/json");
    await arweave.transactions.sign(tx, key as never);
    const uploader = await arweave.transactions.getUploader(tx);
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
    }
    return NextResponse.json({ arweaveId: tx.id });
  } catch (e) {
    console.error("post-blob", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
