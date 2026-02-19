/**
 * Sign and send ChainRoute anchor tx using Ledger (WebHID) in the browser.
 * Uses path 44'/60'/0'/0/0; enable "Blind signing" or "Contract data" in Ethereum app.
 */

import { getAnchorTxData, type AnchorParams } from "./polygon-anchor";
import { AMOY_RPC, CHAIN_ID, ANCHOR_TARGET } from "./constants";

export const LEDGER_PATH = "44'/60'/0'/0/0";
const GAS_LIMIT = 100_000;

export interface LedgerSignOpts {
  rpcUrl?: string;
  chainId?: number;
}

/**
 * Get Ledger address for the default path (for display only).
 * Must be called from a user gesture (e.g. click); requires WebHID support (Chrome/Edge).
 */
export async function getLedgerAddress(opts: LedgerSignOpts = {}): Promise<string> {
  const TransportWebHID = (await import("@ledgerhq/hw-transport-webhid")).default;
  const Eth = (await import("@ledgerhq/hw-app-eth")).default;
  const transport = await TransportWebHID.create();
  try {
    const eth = new Eth(transport);
    const chainId = opts.chainId ?? CHAIN_ID;
    const result = await eth.getAddress(LEDGER_PATH, false, false, String(chainId));
    return result.address;
  } finally {
    await transport.close();
  }
}

/**
 * Sign the anchor tx on Ledger and return the signed serialized tx hex (0x-prefixed).
 * Caller can broadcast via eth_sendRawTransaction.
 */
export async function signAnchorTxWithLedger(
  params: AnchorParams,
  opts: LedgerSignOpts = {}
): Promise<{ signedTxHex: `0x${string}`; fromAddress: string }> {
  const rpcUrl = opts.rpcUrl ?? AMOY_RPC;
  const chainId = opts.chainId ?? CHAIN_ID;

  const TransportWebHID = (await import("@ledgerhq/hw-transport-webhid")).default;
  const Eth = (await import("@ledgerhq/hw-app-eth")).default;
  const { createFeeMarket1559Tx } = await import("@ethereumjs/tx");
  const { Mainnet, createCustomCommon } = await import("@ethereumjs/common");
  const { bytesToHex } = await import("@ethereumjs/util");

  const transport = await TransportWebHID.create();
  try {
    const eth = new Eth(transport);
    const fromAddress = (await eth.getAddress(LEDGER_PATH, false, false, String(chainId))).address;

    const [nonceRes, feeRes] = await Promise.all([
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "eth_getTransactionCount",
          params: [fromAddress, "pending"],
        }),
      }),
      fetch(rpcUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 2,
          method: "eth_feeHistory",
          params: ["0x4", "latest", [25]],
        }),
      }),
    ]);
    const nonceJson = await nonceRes.json();
    const feeJson = await feeRes.json();
    const nonce = parseInt(String(nonceJson?.result ?? 0), 16);
    const baseFee = feeJson?.result?.baseFeePerGas?.[0]
      ? BigInt(feeJson.result.baseFeePerGas[0])
      : 30n * 10n ** 9n;
    const maxPriorityFeePerGas = 30n * 10n ** 9n;
    const maxFeePerGas = baseFee * 2n + maxPriorityFeePerGas;

    const dataHex = getAnchorTxData({
      genesisHash: params.genesisHash.toLowerCase(),
      previousPolygonHash: params.previousPolygonHash.toLowerCase(),
      arweaveBlobTxId: params.arweaveBlobTxId || "",
      delegate: params.delegate,
    });

    const common = createCustomCommon({ chainId }, Mainnet);
    const tx = createFeeMarket1559Tx(
      {
        chainId: BigInt(chainId),
        nonce: BigInt(nonce),
        maxPriorityFeePerGas,
        maxFeePerGas,
        gasLimit: BigInt(GAS_LIMIT),
        to: ANCHOR_TARGET,
        value: 0n,
        data: dataHex as `0x${string}`,
        accessList: [],
      },
      { common }
    );

    const unsignedSerialized = tx.getMessageToSign();
    const rawTxHex = bytesToHex(unsignedSerialized).slice(2);

    const { v, r, s } = await eth.signTransaction(LEDGER_PATH, rawTxHex, null);

    const signedTx = tx.addSignature(BigInt("0x" + v), BigInt("0x" + r), BigInt("0x" + s));
    const signedTxHex = bytesToHex(signedTx.serialize()) as `0x${string}`;
    return { signedTxHex, fromAddress };
  } finally {
    await transport.close();
  }
}

/**
 * Sign with Ledger and broadcast; returns transaction hash.
 */
export async function signAndSendWithLedger(
  params: AnchorParams,
  opts: LedgerSignOpts = {}
): Promise<string> {
  const rpcUrl = opts.rpcUrl ?? AMOY_RPC;
  const { signedTxHex } = await signAnchorTxWithLedger(params, opts);
  const res = await fetch(rpcUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_sendRawTransaction",
      params: [signedTxHex],
    }),
  });
  const json = await res.json();
  if (json.error) {
    throw new Error(json.error.message || "Failed to send transaction");
  }
  return json.result as string;
}
