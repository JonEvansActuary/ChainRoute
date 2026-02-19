/**
 * Send a transaction directly via window.ethereum (bypasses viem validation).
 * ChainRoute uses data-to-EOA txs which some RPC simulators reject.
 */
export async function sendRawTransaction({
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
}): Promise<string> {
  const provider =
    typeof window !== "undefined" &&
    (window as unknown as { ethereum?: { request: (args: { method: string; params: unknown[] }) => Promise<string> } })
      .ethereum;
  if (!provider) throw new Error("No wallet detected. Install MetaMask or another browser wallet.");

  const txHash = await provider.request({
    method: "eth_sendTransaction",
    params: [
      {
        from,
        to,
        data,
        value,
        gas,
      },
    ],
  });

  return txHash;
}
