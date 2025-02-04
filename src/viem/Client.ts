import { createPublicClient, fallback, http } from "viem";
import { zksync } from "viem/chains";

const isFallbackDefined = process.env.ENVIO_FALLBACK_URL !== undefined;

const client1 = createPublicClient({
  chain: zksync,
  transport: http("https://mainnet.era.zksync.io", {
    batch: true,
    retryCount: 10,
    retryDelay: 150,
  }),
  batch: { multicall: true },
});

const client2 = createPublicClient({
  chain: zksync,
  transport: fallback([
    http(process.env.ENVIO_FALLBACK_URL, {
      batch: true,
      retryCount: 10,
      retryDelay: 150,
    }),
    http("https://mainnet.era.zksync.io", {
      batch: true,
      retryCount: 10,
      retryDelay: 150,
    }),
  ]),
  batch: { multicall: true },
});

// Mock client for test mode
const mockClient = {
  multicall: async ({ contracts }: any) => {
    return contracts.map((contract: any) => {
      switch (contract.functionName) {
        case "exchangeRateStored":
          return { result: 1000000n, status: "success" };
        case "totalSupply":
          return { result: 0n, status: "success" };
        case "name":
          return { result: "Test Pool", status: "success" };
        case "symbol":
          return { result: "TEST", status: "success" };
        case "poolType":
          return { result: 1n, status: "success" };
        case "token0PrecisionMultiplier":
        case "token1PrecisionMultiplier":
          return { result: 1n, status: "success" };
        case "token0":
        case "token1":
        case "underlying":
          return { result: "0x367700c33ea7d4523403ca8ca790918ccb76dAb4", status: "success" };
        default:
          return { result: "Test", status: "success" };
      }
    });
  },
};

export const client =
  process.env.NODE_ENV === "test" ? mockClient : isFallbackDefined ? client2 : client1;
