import { NextRequest, NextResponse } from "next/server";

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
    const keyPath = process.env.ARWEAVE_KEY_PATH;
    const jwk = process.env.ARWEAVE_JWK;
    if (!keyPath && !jwk) {
      return NextResponse.json(
        { error: "Server: Set ARWEAVE_KEY_PATH or ARWEAVE_JWK" },
        { status: 503 }
      );
    }
    const key = jwk ? JSON.parse(jwk) : await import("fs").then((fs) => JSON.parse(fs.readFileSync(keyPath!, "utf8")));
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
    await arweave.transactions.sign(tx, key);
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
