/**
 * Query Polygonscan for ChainRoute anchor txs sent by a given address.
 * Groups them by genesis hash and returns a list of chains.
 */

import { ANCHOR_TARGET, type NetworkId } from "./constants";
import { PAYLOAD_LEN } from "./types";
import { decodePayload } from "./build-payload";

const POLYGONSCAN_API: Record<NetworkId, string> = {
  amoy: "https://api-amoy.polygonscan.com/api",
  polygon: "https://api.polygonscan.com/api",
};

const POLYGONSCAN_API_KEY: Record<NetworkId, string | undefined> = {
  amoy:
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_POLYGONSCAN_AMOY_API_KEY?.trim()
      : undefined,
  polygon:
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_POLYGONSCAN_MAINNET_API_KEY?.trim()
      : undefined,
};

/** Expected tx input length: "0x" + 127 bytes * 2 hex chars = 256 */
const EXPECTED_INPUT_LEN = 2 + PAYLOAD_LEN * 2; // 256

export interface MyChain {
  genesisHash: string;
  genesisTxHash: string;
  eventCount: number;
  latestTxHash: string;
  latestTimestamp: number;
  delegate: string;
}

interface PolygonscanTx {
  hash: string;
  from: string;
  to: string;
  input: string;
  timeStamp: string;
  isError: string;
}

export async function queryMyChains(
  address: string,
  networkId: NetworkId
): Promise<MyChain[]> {
  const apiBase = POLYGONSCAN_API[networkId];
  const apiKey = POLYGONSCAN_API_KEY[networkId];
  const target = ANCHOR_TARGET.toLowerCase();

  let url = `${apiBase}?module=account&action=txlist&address=${address}&sort=asc&startblock=0&endblock=99999999`;
  if (apiKey) url += `&apikey=${encodeURIComponent(apiKey)}`;
  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "1" || !Array.isArray(json.result)) {
    return [];
  }

  const txs = json.result as PolygonscanTx[];

  // Filter for ChainRoute anchor txs: correct data length, sent by this address,
  // to ANCHOR_TARGET or self (legacy), and not errored
  const anchorTxs = txs.filter((tx) => {
    if (tx.isError === "1") return false;
    if (tx.from.toLowerCase() !== address.toLowerCase()) return false;
    const toAddr = tx.to.toLowerCase();
    if (toAddr !== target && toAddr !== address.toLowerCase()) return false;
    if (tx.input.length !== EXPECTED_INPUT_LEN) return false;
    return true;
  });

  // Decode and group by genesis hash
  const ZERO_64 = "0".repeat(64);
  const chains = new Map<string, MyChain>();

  for (const tx of anchorTxs) {
    try {
      const decoded = decodePayload(tx.input);
      const isGenesis = decoded.genesisHash === ZERO_64;
      const genesisHash = isGenesis
        ? tx.hash.replace(/^0x/, "").toLowerCase()
        : decoded.genesisHash.toLowerCase();

      const existing = chains.get(genesisHash);
      const ts = parseInt(tx.timeStamp, 10);

      if (!existing) {
        chains.set(genesisHash, {
          genesisHash,
          genesisTxHash: isGenesis ? tx.hash : "",
          eventCount: isGenesis ? 0 : 1,
          latestTxHash: tx.hash,
          latestTimestamp: ts,
          delegate: decoded.delegate,
        });
      } else {
        existing.eventCount++;
        if (ts > existing.latestTimestamp) {
          existing.latestTxHash = tx.hash;
          existing.latestTimestamp = ts;
          existing.delegate = decoded.delegate;
        }
        if (isGenesis && !existing.genesisTxHash) {
          existing.genesisTxHash = tx.hash;
        }
      }
    } catch {
      // skip malformed payloads
    }
  }

  // Sort newest first
  return Array.from(chains.values()).sort(
    (a, b) => b.latestTimestamp - a.latestTimestamp
  );
}
