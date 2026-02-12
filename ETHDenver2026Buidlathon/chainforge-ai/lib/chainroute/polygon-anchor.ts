/**
 * Post ChainRoute anchor tx to Polygon using viem (browser wallet).
 */

import { createPublicClient, createWalletClient, custom, type Hash } from "viem";
import { polygonAmoy } from "viem/chains";
import { buildPayloadHex } from "./build-payload";

const AMOY_RPC = "https://rpc-amoy.polygon.technology";
const CHAIN_ID = 80002;

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
  walletClient: { getAddresses: () => Promise<readonly `0x${string}`[]>; sendTransaction: (tx: { to: `0x${string}`; data: `0x${string}`; value?: bigint; gas?: bigint }) => Promise<Hash> }
): Promise<Hash> {
  const [address] = await walletClient.getAddresses();
  if (!address) throw new Error("No wallet address");

  const data = getAnchorTxData(params);
  const hash = await walletClient.sendTransaction({
    to: address,
    data,
    value: 0n,
    gas: 100000n,
  });
  return hash;
}

export { polygonAmoy, AMOY_RPC, CHAIN_ID };
