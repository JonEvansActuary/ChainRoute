type EIP1193Provider = { request: (args: { method: string; params: unknown[] }) => Promise<unknown> };

/** Polygon (Amoy 80002 and Mainnet 137) can require 25+ Gwei tip; use 30 Gwei tip, 100 Gwei max to avoid "below minimum" errors. */
const POLYGON_MIN_GAS_HEX = {
  maxPriorityFeePerGas: "0x6fc23ac00" as const, // 30 Gwei
  maxFeePerGas: "0x174876e800" as const, // 100 Gwei
};

/**
 * Send a transaction directly via the given provider or window.ethereum (bypasses viem validation).
 * ChainRoute uses data-to-EOA txs which some RPC simulators reject.
 * Pass the connector's provider when available so the same provider is used for send and receipt.
 * When chainId is 137 (Polygon Mainnet) or 80002 (Amoy), gas price params are set to meet the network minimum.
 */
export async function sendRawTransaction(
  {
    from,
    to,
    data,
    value = "0x0",
    gas = "0x186a0", // 100000
  }: {
    from: string;
    to: string;
    data: string;
    value?: string;
    gas?: string;
  },
  provider?: EIP1193Provider,
  chainId?: number
): Promise<string> {
  const p =
    provider ??
    (typeof window !== "undefined" &&
      (window as unknown as { ethereum?: EIP1193Provider }).ethereum);
  if (!p) throw new Error("No wallet detected. Install MetaMask or another browser wallet.");

  const txParams: Record<string, unknown> = {
    from,
    to,
    data,
    value,
    gas,
  };
  if (chainId === 137 || chainId === 80002) {
    txParams.maxPriorityFeePerGas = POLYGON_MIN_GAS_HEX.maxPriorityFeePerGas;
    txParams.maxFeePerGas = POLYGON_MIN_GAS_HEX.maxFeePerGas;
  }

  const txHash = (await p.request({
    method: "eth_sendTransaction",
    params: [txParams],
  })) as string;

  return txHash;
}
