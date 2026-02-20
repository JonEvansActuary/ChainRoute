/**
 * Wait for transaction receipt by polling the same provider that sent the tx (e.g. window.ethereum).
 * Use this when the tx was sent via the wallet so we poll the wallet's RPC, not a different one.
 */
const DEFAULT_TIMEOUT = 300_000;
const POLL_INTERVAL = 2_000;

type Provider = { request: (args: { method: string; params: unknown[] }) => Promise<unknown> };

export interface MinimalReceipt {
  status: "success" | "reverted";
  blockNumber: bigint;
}

export async function waitForReceiptViaProvider(
  hash: string,
  provider: Provider,
  options: { timeout?: number; pollingInterval?: number } = {}
): Promise<{ receipt: MinimalReceipt | null; error: string | null }> {
  const timeout = options.timeout ?? DEFAULT_TIMEOUT;
  const pollingInterval = options.pollingInterval ?? POLL_INTERVAL;
  const deadline = Date.now() + timeout;

  while (Date.now() < deadline) {
    try {
      const raw = await provider.request({
        method: "eth_getTransactionReceipt",
        params: [hash],
      });
      if (raw && typeof raw === "object" && "blockNumber" in raw) {
        const r = raw as { status?: string; blockNumber: string };
        const status = r.status === "0x1" ? "success" : "reverted";
        const blockNumber = BigInt(r.blockNumber);
        return { receipt: { status, blockNumber }, error: null };
      }
    } catch (e) {
      return { receipt: null, error: (e as Error).message };
    }
    await new Promise((r) => setTimeout(r, pollingInterval));
  }
  return { receipt: null, error: "Timed out waiting for transaction receipt" };
}
