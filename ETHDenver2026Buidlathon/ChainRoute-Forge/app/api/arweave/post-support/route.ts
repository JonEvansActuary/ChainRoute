import { NextRequest, NextResponse } from "next/server";
import { getArweaveKey } from "@/lib/arweave-key";

const GENESIS_PATTERN = /^[0-9a-fA-F]{64}$/;

/**
 * POST: formData with "file" (File) and optional "genesis" (64 hex).
 * Posts support file to Arweave with Content-Type and optional ChainRoute-Genesis tag.
 * Returns { arweaveId }.
 */
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const genesis = (formData.get("genesis") as string) || "";
    if (!file) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }
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
    const buf = Buffer.from(await file.arrayBuffer());
    const tx = await arweave.createTransaction({ data: buf });
    const ext = (file.name || "").toLowerCase().split(".").pop();
    const contentTypes: Record<string, string> = {
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
      pdf: "application/pdf",
      json: "application/json",
    };
    tx.addTag("Content-Type", contentTypes[ext || ""] || "application/octet-stream");
    if (genesis && GENESIS_PATTERN.test(genesis)) {
      tx.addTag("ChainRoute-Genesis", genesis.toLowerCase());
    }
    await arweave.transactions.sign(tx, key as never);
    const uploader = await arweave.transactions.getUploader(tx);
    while (!uploader.isComplete) {
      await uploader.uploadChunk();
    }
    return NextResponse.json({ arweaveId: tx.id });
  } catch (e) {
    console.error("post-support", e);
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
