import { createPublicClient, http } from "viem";
import { zksync } from "viem/chains";

export const client = createPublicClient({
  chain: zksync,
  transport: http("https://mainnet.era.zksync.io"),
  batch: { multicall: true },
});
