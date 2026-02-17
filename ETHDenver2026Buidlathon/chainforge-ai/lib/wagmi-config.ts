import { http, createConfig } from "wagmi";
import { polygon, polygonAmoy } from "wagmi/chains";
import { injected } from "wagmi/connectors";
import { NETWORKS } from "@/lib/chainroute/constants";

export const config = createConfig({
  chains: [polygonAmoy, polygon],
  connectors: [injected()],
  transports: {
    [polygonAmoy.id]: http(NETWORKS.amoy.rpcUrl),
    [polygon.id]: http(NETWORKS.polygon.rpcUrl),
  },
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
