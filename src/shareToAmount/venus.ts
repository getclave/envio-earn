import { Client } from "viem";

import { getContract } from "viem";

import { handlerContext } from "generated";
import { Address } from "viem";
import { VenusPoolABI } from "../abi/VenusPool";
import { client } from "../viem/Client";

export async function shareToAmountVenus(
  shares: bigint,
  poolAddress: Address,
  context: handlerContext
) {
  const pool = await getVenusPool(poolAddress, context);
  return {
    tokenAmount: (shares * pool.exchangeRate) / BigInt(10 ** 18),
    poolDetails: pool,
  };
}

/**
 * Gets or creates a Venus pool entry in the database
 * Fetches pool details including name, symbol, and underlying token
 * @param poolAddress The address of the Venus pool
 * @param context The handler context
 * @returns The Venus pool object
 */
async function getVenusPool(poolAddress: Address, context: handlerContext) {
  const contract = getContract({
    address: poolAddress.toLowerCase() as Address,
    abi: VenusPoolABI,
    client: client as Client,
  });

  const [name, symbol, underlyingToken, exchangeRate] = await client.multicall({
    contracts: [
      { ...contract, functionName: "name" },
      { ...contract, functionName: "symbol" },
      { ...contract, functionName: "underlying" },
      { ...contract, functionName: "exchangeRateStored" },
    ],
  });

  const newVenusPool = {
    id: poolAddress.toLowerCase(),
    address: poolAddress.toLowerCase(),
    underlyingToken: (underlyingToken.result as Address).toLowerCase(),
    name: name.result as string,
    symbol: symbol.result as string,
    exchangeRate: exchangeRate.result as bigint,
  };

  context.PoolRegistry.set({
    id: poolAddress.toLowerCase(),
    protocol: "Venus",
    pool: poolAddress.toLowerCase(),
    underlyingToken0: underlyingToken.result as Address,
    underlyingToken1: underlyingToken.result as Address,
  });

  return newVenusPool;
}
