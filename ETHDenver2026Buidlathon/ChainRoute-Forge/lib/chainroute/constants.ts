/**
 * Shared ChainRoute config (single source of truth).
 * NEXT_PUBLIC_* env vars are replaced at build time by Next.js.
 */

export const AMOY_RPC =
  process.env.NEXT_PUBLIC_AMOY_RPC || "https://rpc-amoy.polygon.technology";

export const POLYGON_MAINNET_RPC =
  process.env.NEXT_PUBLIC_POLYGON_MAINNET_RPC || "https://polygon-rpc.com";

export const CHAIN_ID = 80002;

export const ARWEAVE_GATEWAY =
  process.env.NEXT_PUBLIC_ARWEAVE_GATEWAY || "https://arweave.net";

export const ARWEAVE_GRAPHQL =
  process.env.NEXT_PUBLIC_ARWEAVE_GRAPHQL || "https://arweave.net/graphql";

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
