import type { NextConfig } from "next";

const envKeys = [
  "NEXT_PUBLIC_AMOY_RPC",
  "NEXT_PUBLIC_POLYGON_MAINNET_RPC",
  "NEXT_PUBLIC_POLYGONSCAN_AMOY_API_KEY",
  "NEXT_PUBLIC_POLYGONSCAN_MAINNET_API_KEY",
  "NEXT_PUBLIC_ARWEAVE_GATEWAY",
  "NEXT_PUBLIC_ARWEAVE_GRAPHQL",
  "GROK_API_KEY",
  "ARWEAVE_JWK",
];

console.log("=== ENV VAR CHECK (build time) ===");
for (const key of envKeys) {
  const val = process.env[key];
  const status = val ? `SET (${val.length} chars, starts: ${val.slice(0, 12)}...)` : "NOT SET";
  console.log(`  ${key}: ${status}`);
}
console.log("=================================");

const nextConfig: NextConfig = {
  reactStrictMode: true,
};

export default nextConfig;
