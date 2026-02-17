/**
 * Shared ChainRoute / ChainForge config (single source of truth).
 */

export const AMOY_RPC = "https://rpc-amoy.polygon.technology";
export const CHAIN_ID = 80002;
export const ARWEAVE_GATEWAY = "https://arweave.net";

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
    rpcUrl: "https://polygon-rpc.com",
    name: "Polygon Mainnet",
    explorerUrl: "https://polygonscan.com",
  },
};
