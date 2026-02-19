import { http, createConfig, createStorage, cookieStorage } from "wagmi";
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
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
});

declare module "wagmi" {
  interface Register {
    config: typeof config;
  }
}
