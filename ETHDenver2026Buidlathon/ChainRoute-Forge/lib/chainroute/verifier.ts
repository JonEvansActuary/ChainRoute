/**
 * Client-side ChainRoute verification: fetch Polygon tx, decode payload, fetch Arweave blobs.
 * Uses timeouts and one retry for reliability in demos.
 */

import { decodePayload, type DecodedPayload } from "./build-payload";
import { validateBlob } from "./validate-blob";
import type { ProvenanceBlob } from "./types";
import { ARWEAVE_GATEWAY, ARWEAVE_GRAPHQL } from "./constants";

export type { DecodedPayload };

const DEFAULT_ARWEAVE_GATEWAY = ARWEAVE_GATEWAY;

const FETCH_TIMEOUT_MS = 18000;
const RETRY_DELAY_MS = 1500;

async function fetchWithTimeoutAndRetry(
  url: string,
  init: RequestInit,
  timeoutMs: number = FETCH_TIMEOUT_MS
): Promise<Response> {
  const doFetch = async (): Promise<Response> => {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(id);
      return res;
    } catch (e) {
      clearTimeout(id);
      throw e;
    }
  };
  try {
    return await doFetch();
  } catch {
    await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    return await doFetch();
  }
}

export interface VerifiedAnchor {
  step: string;
  txHash: string;
  ok: boolean;
  decoded?: DecodedPayload;
  error?: string;
}

export interface VerifiedBlob {
  step: string;
  blobId: string;
  ok: boolean;
  blob?: ProvenanceBlob;
  error?: string;
}

export interface VerifyResult {
  genesisHash: string;
  polygon: { errors: string[]; results: VerifiedAnchor[] };
  arweave: { errors: string[]; results: VerifiedBlob[] };
  supportTagsOk: boolean | null;
  valid: boolean;
}

/**
 * Fetch a Polygon transaction and decode its 127-byte payload.
 */
export async function getPolygonTxPayload(
  txHash: string,
  rpcUrl: string
): Promise<{ txHash: string; data: string } | null> {
  const res = await fetchWithTimeoutAndRetry(
    rpcUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getTransactionByHash",
        params: [txHash],
      }),
    }
  );
  const json = await res.json();
  const tx = json?.result;
  if (!tx?.data || tx.data === "0x") return null;
  return { txHash, data: tx.data };
}

/**
 * Decode ChainRoute payload from hex data.
 */
export function decodePayloadFromHex(hexData: string): DecodedPayload {
  return decodePayload(hexData.replace(/^0x/i, ""));
}

/**
 * Fetch an Arweave blob by ID.
 */
export async function fetchArweaveBlob(
  blobId: string,
  gateway = DEFAULT_ARWEAVE_GATEWAY
): Promise<ProvenanceBlob> {
  const url = `${gateway.replace(/\/$/, "")}/${blobId}`;
  const res = await fetchWithTimeoutAndRetry(url, {});
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const blob = (await res.json()) as ProvenanceBlob;
  return blob;
}

/**
 * Get Arweave transaction tags (for ChainRoute-Genesis) via GraphQL.
 */
export async function getArweaveTxTags(
  txId: string,
  graphqlUrl = ARWEAVE_GRAPHQL
): Promise<{ name: string; value: string }[]> {
  const query = `
    query {
      transactions(ids: ["${txId}"], first: 1) {
        edges {
          node {
            id
            tags {
              name
              value
            }
          }
        }
      }
    }
  `;
  const res = await fetchWithTimeoutAndRetry(graphqlUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }
  const edges = json?.data?.transactions?.edges;
  if (!edges?.length) throw new Error("Transaction not found");
  const node = edges[0].node;
  const raw = (node.tags || []) as { name: string; value: string }[];
  return raw.map((t) => ({ name: String(t.name), value: String(t.value) }));
}

/**
 * Verify a single chain from genesis: walk forward by delegate and tx data.
 * Starts from genesis tx hash; fetches each tx, decodes payload, fetches blob, then uses delegate + prev hash to find next (we need an indexer or multiple fetches - for MVP we only verify one tx or a list of tx hashes).
 * For full chain verification with a list of known tx hashes, use verifyChainFromManifest.
 */
export interface VerifySingleTxResult {
  decoded?: DecodedPayload;
  blob?: ProvenanceBlob;
  blobValid: boolean;
  supportTagsOk: boolean | null;
  error?: string;
}

const CHAINROUTE_GENESIS_TAG = "ChainRoute-Genesis";

/**
 * Check that all support tx IDs in a blob have the ChainRoute-Genesis tag matching genesisHash.
 */
export async function checkSupportTags(
  blob: ProvenanceBlob,
  genesisHash: string,
  graphqlUrl = ARWEAVE_GRAPHQL
): Promise<boolean> {
  const supports = blob.supports;
  if (!supports?.length) return true;
  const genesisLower = genesisHash.toLowerCase();
  for (const s of supports) {
    const id = typeof s === "object" && s !== null && "id" in s ? (s as { id: string }).id : undefined;
    if (!id) continue;
    try {
      const tags = await getArweaveTxTags(id, graphqlUrl);
      const hasGenesis = tags.some(
        (t) => t.name === CHAINROUTE_GENESIS_TAG && (t.value || "").toLowerCase() === genesisLower
      );
      if (!hasGenesis) return false;
    } catch {
      return false;
    }
  }
  return true;
}

export async function verifySingleTx(
  txHash: string,
  expectedGenesis: string,
  rpcUrl: string,
  gateway = DEFAULT_ARWEAVE_GATEWAY
): Promise<VerifySingleTxResult> {
  const tx = await getPolygonTxPayload(txHash, rpcUrl);
  if (!tx) {
    return { blobValid: false, supportTagsOk: null, error: "Tx not found or no data" };
  }

  const decoded = decodePayloadFromHex(tx.data);
  if (decoded.genesisHash !== expectedGenesis && decoded.genesisHash !== "0".repeat(64)) {
    return { decoded, blobValid: false, supportTagsOk: null, error: "Genesis mismatch" };
  }

  let blob: ProvenanceBlob | undefined;
  let blobValid = false;
  if (decoded.arweaveId) {
    try {
      blob = await fetchArweaveBlob(decoded.arweaveId, gateway);
      const v = validateBlob(blob);
      blobValid = v.valid;
      if (!blobValid) return { decoded, blob, blobValid, supportTagsOk: null, error: v.errors.join("; ") };
      if (blob.genesis.toLowerCase() !== expectedGenesis.toLowerCase()) {
        return { decoded, blob, blobValid: false, supportTagsOk: null, error: "Blob genesis mismatch" };
      }
    } catch (e) {
      return { decoded, blobValid: false, supportTagsOk: null, error: (e as Error).message };
    }
  } else {
    blobValid = true; // genesis tx has no blob
  }

  let supportTagsOk: boolean | null = null;
  if (blob?.supports?.length) {
    try {
      supportTagsOk = await checkSupportTags(blob, expectedGenesis);
    } catch {
      supportTagsOk = false;
    }
  }

  return { decoded, blob, blobValid, supportTagsOk };
}

/**
 * Forward-walk from a known tx hash: get tx -> decode -> get blob; then we'd need to find next tx by delegate (requires indexer). For demo we accept a list of tx hashes in order.
 */
export async function verifyChainFromTxList(
  genesisTxHash: string,
  txHashes: string[],
  rpcUrl: string,
  gateway = DEFAULT_ARWEAVE_GATEWAY
): Promise<VerifyResult> {
  const polygonErrors: string[] = [];
  const polygonResults: VerifiedAnchor[] = [];
  const arweaveErrors: string[] = [];
  const arweaveResults: VerifiedBlob[] = [];

  const allHashes = [genesisTxHash, ...txHashes];
  let prevHash = "0".repeat(64);
  const genesisHash = genesisTxHash.startsWith("0x") ? genesisTxHash.slice(2) : genesisTxHash;

  for (let i = 0; i < allHashes.length; i++) {
    const txHash = allHashes[i];
    const step = i === 0 ? "genesis" : `event-${i}`;
    const tx = await getPolygonTxPayload(txHash, rpcUrl);
    if (!tx) {
      polygonErrors.push(`[${step}] Failed to fetch tx`);
      polygonResults.push({ step, txHash, ok: false, error: "Tx not found" });
      continue;
    }

    let decoded: DecodedPayload;
    try {
      decoded = decodePayloadFromHex(tx.data);
    } catch (e) {
      polygonErrors.push(`[${step}] Decode failed: ${(e as Error).message}`);
      polygonResults.push({ step, txHash, ok: false, error: (e as Error).message });
      continue;
    }

    const expectedPrev = i === 0 ? "0".repeat(64) : prevHash;
    const expectedGenesis = i === 0 ? "0".repeat(64) : genesisHash;
    if (decoded.previousPolygonHash !== expectedPrev) {
      polygonErrors.push(`[${step}] prevHash mismatch`);
      polygonResults.push({ step, txHash, ok: false, decoded });
      prevHash = txHash.replace(/^0x/i, "").toLowerCase();
      continue;
    }
    if (decoded.genesisHash !== expectedGenesis) {
      polygonErrors.push(`[${step}] genesis mismatch`);
      polygonResults.push({ step, txHash, ok: false, decoded });
    } else {
      polygonResults.push({ step, txHash, ok: true, decoded });
    }
    prevHash = (txHash.startsWith("0x") ? txHash.slice(2) : txHash).toLowerCase();

    if (decoded.arweaveId) {
      try {
        const blob = await fetchArweaveBlob(decoded.arweaveId, gateway);
        const v = validateBlob(blob);
        if (!v.valid) {
          arweaveErrors.push(`[${step}] Blob invalid: ${v.errors.join("; ")}`);
          arweaveResults.push({ step, blobId: decoded.arweaveId, ok: false, error: v.errors.join("; ") });
        } else if (blob.genesis.toLowerCase() !== genesisHash.toLowerCase()) {
          arweaveErrors.push(`[${step}] Blob genesis mismatch`);
          arweaveResults.push({ step, blobId: decoded.arweaveId, ok: false });
        } else {
          arweaveResults.push({ step, blobId: decoded.arweaveId, ok: true, blob });
        }
      } catch (e) {
        arweaveErrors.push(`[${step}] ${(e as Error).message}`);
        arweaveResults.push({ step, blobId: decoded.arweaveId, ok: false, error: (e as Error).message });
      }
    }
  }

  let supportTagsOk: boolean | null = null;
  const blobsWithSupports = arweaveResults.filter((r) => r.blob?.supports?.length);
  if (blobsWithSupports.length > 0) {
    let allOk = true;
    for (const r of blobsWithSupports) {
      if (!r.blob) continue;
      try {
        const ok = await checkSupportTags(r.blob, genesisHash);
        if (!ok) {
          allOk = false;
          break;
        }
      } catch {
        allOk = false;
        break;
      }
    }
    supportTagsOk = allOk;
  }

  const valid =
    polygonErrors.length === 0 &&
    arweaveErrors.length === 0;

  return {
    genesisHash,
    polygon: { errors: polygonErrors, results: polygonResults },
    arweave: { errors: arweaveErrors, results: arweaveResults },
    supportTagsOk,
    valid,
  };
}
