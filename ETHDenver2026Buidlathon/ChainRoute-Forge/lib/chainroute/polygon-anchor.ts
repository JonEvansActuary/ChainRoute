/**
 * Post ChainRoute anchor tx to Polygon using viem (browser wallet).
 */

import { type Hash } from "viem";
import { polygonAmoy } from "viem/chains";
import { buildPayloadHex } from "./build-payload";
import { AMOY_RPC, CHAIN_ID, ANCHOR_TARGET } from "./constants";

export interface AnchorParams {
  genesisHash: string;
  previousPolygonHash: string;
  arweaveBlobTxId: string;
  delegate: string;
}

/**
 * Build the 127-byte payload hex for the anchor tx (for use with any wallet).
 */
export function getAnchorTxData(params: AnchorParams): `0x${string}` {
  const hex = buildPayloadHex({
    genesisHash: params.genesisHash.toLowerCase(),
    previousPolygonHash: params.previousPolygonHash.toLowerCase(),
    arweaveId: params.arweaveBlobTxId || null,
    delegate: params.delegate,
  });
  return (`0x${hex}`) as `0x${string}`;
}

/**
 * Send the anchor tx using the given wallet (ethereum provider).
 * Returns the Polygon transaction hash.
 */
export async function postPolygonAnchor(
  params: AnchorParams,
  walletClient: { getAddresses: () => Promise<readonly `0x${string}`[]>; sendTransaction: (tx: { to: `0x${string}`; data: `0x${string}`; value?: bigint; gas?: bigint; chain?: null }) => Promise<Hash> }
): Promise<Hash> {
  const [address] = await walletClient.getAddresses();
  if (!address) throw new Error("No wallet address");

  const data = getAnchorTxData(params);
  const hash = await walletClient.sendTransaction({
    to: ANCHOR_TARGET,
    data,
    value: 0n,
    gas: 100_000n,
    chain: null,
  });
  return hash;
}

/**
 * Sign and send anchor tx using Ledger (browser WebHID). Enable "Blind signing" in Ethereum app.
 */
export {
  signAndSendWithLedger,
  getLedgerAddress,
  LEDGER_PATH,
} from "./ledger-sign";

export { polygonAmoy, AMOY_RPC, CHAIN_ID };
