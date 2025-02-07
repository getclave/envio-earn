import { Client } from "viem";

import { getContract } from "viem";

import { handlerContext } from "generated";
import { Address } from "viem";
import { VenusPoolABI } from "../abi/VenusPool";
import { client } from "../viem/Client";

export async function shareToAmountVenus(
  userAddress: Address,
  poolAddress: Address,
  context: handlerContext,
  blockNumber: bigint
) {
  const { pool, userBalance } = await getVenusPoolAndUserBalance(
    userAddress,
    poolAddress,
    context,
    blockNumber
  );
  return {
    tokenAmount: userBalance,
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
async function getVenusPoolAndUserBalance(
  userAddress: Address,
  poolAddress: Address,
  context: handlerContext,
  blockNumber: bigint
) {
  const contract = getContract({
    address: poolAddress.toLowerCase() as Address,
    abi: VenusPoolABI,
    client: client as Client,
  });

  const [name, symbol, underlyingToken, userBalance] = await client.multicall({
    contracts: [
      { ...contract, functionName: "name", args: [] },
      { ...contract, functionName: "symbol", args: [] },
      { ...contract, functionName: "underlying", args: [] },
      { ...contract, functionName: "balanceOfUnderlying", args: [userAddress] },
    ],
    blockNumber,
  });

  const newVenusPool = {
    id: poolAddress.toLowerCase(),
    address: poolAddress.toLowerCase(),
    underlyingToken: (underlyingToken.result as Address).toLowerCase(),
    name: name.result as string,
    symbol: symbol.result as string,
    userBalance: userBalance.result as bigint,
  };

  context.PoolRegistry.set({
    id: poolAddress.toLowerCase(),
    protocol: "Venus",
    pool: poolAddress.toLowerCase(),
    underlyingToken0: underlyingToken.result as Address,
    underlyingToken1: underlyingToken.result as Address,
  });

  return { pool: newVenusPool, userBalance: userBalance.result as bigint };
}
