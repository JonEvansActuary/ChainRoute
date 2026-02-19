/**
 * Shared ChainRoute config (single source of truth).
 * Set NEXT_PUBLIC_AMOY_RPC (and optionally NEXT_PUBLIC_POLYGON_MAINNET_RPC) for provider RPC endpoints to improve reliability and reduce rate limits.
 * Set NEXT_PUBLIC_ARWEAVE_GATEWAY and/or NEXT_PUBLIC_ARWEAVE_GRAPHQL for Arweave read endpoints (gateway + GraphQL) to improve reliability.
 */

export const AMOY_RPC =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_AMOY_RPC?.trim()) ||
  "https://rpc-amoy.polygon.technology";

export const POLYGON_MAINNET_RPC =
  (typeof process !== "undefined" &&
    process.env.NEXT_PUBLIC_POLYGON_MAINNET_RPC?.trim()) ||
  "https://polygon-rpc.com";

export const CHAIN_ID = 80002;

export const ARWEAVE_GATEWAY =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY?.trim()) ||
  "https://arweave.net";

export const ARWEAVE_GRAPHQL =
  (typeof process !== "undefined" && process.env.NEXT_PUBLIC_ARWEAVE_GRAPHQL?.trim()) ||
  "https://arweave.net/graphql";

/** Burn address used as the `to` target for anchor txs (avoids MetaMask internal-account restriction). */
export const ANCHOR_TARGET = "0x000000000000000000000000000000000000dEaD" as const;

export type NetworkId = "amoy" | "polygon";

export const NETWORKS: Record<
  NetworkId,
  { chainId: number; rpcUrl: string; name: string; explorerUrl: string }
> = {
  amoy: {
    chainId: 80002,
    rpcUrl: AMOY_RPC,
    name: "Polygon Amoy (Testnet)",
    explorerUrl: "https://amoy.polygonscan.com",
  },
  polygon: {
    chainId: 137,
    rpcUrl: POLYGON_MAINNET_RPC,
    name: "Polygon Mainnet",
    explorerUrl: "https://polygonscan.com",
  },
};
