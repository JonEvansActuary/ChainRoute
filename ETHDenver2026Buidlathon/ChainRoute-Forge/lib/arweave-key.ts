import path from "path";
import fs from "fs";

/**
 * Load Arweave JWK from ARWEAVE_JWK (inline JSON) or ARWEAVE_KEY_PATH (file).
 * Paths in ARWEAVE_KEY_PATH are resolved relative to process.cwd() (Next.js project root).
 */
export function getArweaveKey(): object {
  const jwk = process.env.ARWEAVE_JWK?.trim();
  if (jwk) {
    try {
      return JSON.parse(jwk) as object;
    } catch {
      throw new Error("ARWEAVE_JWK is invalid JSON");
    }
  }
  const keyPathRaw = process.env.ARWEAVE_KEY_PATH?.trim();
  if (!keyPathRaw) {
    throw new Error(
      "Add ARWEAVE_KEY_PATH or ARWEAVE_JWK to .env in the project root and restart the dev server."
    );
  }
  const keyPath = path.isAbsolute(keyPathRaw)
    ? keyPathRaw
    : path.resolve(process.cwd(), keyPathRaw);
  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Arweave key file not found at: ${keyPath} (ARWEAVE_KEY_PATH is relative to project root: ${process.cwd()})`
    );
  }
  try {
    return JSON.parse(fs.readFileSync(keyPath, "utf8")) as object;
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") {
      throw new Error(`Arweave key file not found: ${keyPath}`);
    }
    throw new Error(`Failed to read Arweave key: ${(e as Error).message}`);
  }
}
