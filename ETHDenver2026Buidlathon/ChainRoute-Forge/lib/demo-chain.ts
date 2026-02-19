/**
 * Preloaded example chain (HypotheticalPainting from ChainRoute docs).
 * Uses Polygon mainnet. Set NEXT_PUBLIC_POLYGON_MAINNET_RPC in .env for a provider endpoint (e.g. Alchemy) to improve reliability when loading the example chain.
 */

import { POLYGON_MAINNET_RPC } from "./chainroute/constants";

export const DEMO_CHAIN_GENESIS_TX = "0x647bca002532e1d2710e8c61e30eb83129294a213beb9d0107a8f3740b2580dc";
export const DEMO_CHAIN_EVENT_TXES = [
  "0x81d4f6cbae65445974157382f8040d43785e47a3ed092332af6a83c41eadc652",
  "0xf5d1acd1ada1f113830ea236280b602d86580b5cb18f8c69098e732cf6dab97c",
];
export const DEMO_CHAIN_MAINNET_RPC = POLYGON_MAINNET_RPC;
