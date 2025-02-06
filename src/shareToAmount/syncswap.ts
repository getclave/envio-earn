import { Address, Client, getContract } from "viem";
import { SyncswapPoolABI } from "../abi/SyncswapPool";
import { client } from "../viem/Client";
import { handlerContext } from "generated";

type SyncswapPoolDetails = {
  id: string;
  address: string;
  underlyingToken: string;
  underlyingToken2: string;
  name: string;
  symbol: string;
  poolType: bigint;
  reserve0: bigint;
  reserve1: bigint;
  totalSupply: bigint;
};

export async function shareToAmountSyncswap(
  pool: Address,
  liquidity: bigint,
  blockNumber: bigint,
  context: handlerContext,
  txSender?: Address
): Promise<{
  token0Value: bigint;
  token1Value: bigint;
  poolDetails: SyncswapPoolDetails;
}> {
  const poolDetails = await getSyncswapPool(pool, context, blockNumber);
  const token0Amount = (poolDetails.reserve0 * liquidity) / poolDetails.totalSupply;
  const token1Amount = (poolDetails.reserve1 * liquidity) / poolDetails.totalSupply;

  // If poolConfig.token is token0, swap token1 to token0 and add to token0Amount

  const { amountOut0, amountOut1 } = await getAmountOut(
    poolDetails.underlyingToken,
    token0Amount,
    poolDetails.underlyingToken2,
    token1Amount,
    pool,
    blockNumber,
    txSender
  );
  const token0Value = token0Amount + amountOut1;
  const token1Value = token1Amount + amountOut0;

  return { token0Value, token1Value, poolDetails };
}

async function getAmountOut(
  token0In: string,
  amount0In: bigint,
  token1In: string,
  amount1In: bigint,
  pool: Address,
  blockNumber: bigint,
  txSender?: Address
): Promise<{ amountOut0: bigint; amountOut1: bigint }> {
  const contract = getContract({
    address: pool,
    abi: SyncswapPoolABI,
    client: client as Client,
  });

  const [amountOut0, amountOut1] = await client.multicall({
    contracts: [
      {
        ...contract,
        functionName: "getAmountOut",
        args: [token0In, amount0In, txSender ?? "0xbd1407E680e75f0033F11b2548CC2cE53675373B"],
      },
      {
        ...contract,
        functionName: "getAmountOut",
        args: [token1In, amount1In, txSender ?? "0xbd1407E680e75f0033F11b2548CC2cE53675373B"],
      },
    ],
    blockNumber,
  });

  return {
    amountOut0: amountOut0.result as bigint,
    amountOut1: amountOut1.result as bigint,
  };
}

async function getSyncswapPool(
  poolAddress: Address,
  context: handlerContext,
  blockNumber?: bigint
) {
  try {
    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: SyncswapPoolABI,
      client: client as Client,
    });

    const [name, symbol, poolType, totalSupply, token0, token1, reserves] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "poolType" },
        { ...contract, functionName: "totalSupply" },
        { ...contract, functionName: "token0" },
        { ...contract, functionName: "token1" },
        { ...contract, functionName: "getReserves" },
      ],
      blockNumber,
    });

    // Validate results
    if (!name.result || !symbol.result || !poolType.result) {
      context.log.error(`Failed to fetch pool data for ${poolAddress} on Syncswap`);
    }

    const newSyncswapPool = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken: token0.result
        ? (token0.result as Address).toLowerCase()
        : poolAddress.toLowerCase(),
      underlyingToken2: token1.result
        ? (token1.result as Address).toLowerCase()
        : poolAddress.toLowerCase(),
      name: name.result as string,
      symbol: symbol.result as string,
      poolType: poolType.result as bigint,
      reserve0: (reserves.result as bigint[])[0] ?? 0n,
      reserve1: (reserves.result as bigint[])[1] ?? 0n,
      totalSupply: (totalSupply.result as bigint) ?? 0n,
    };

    await Promise.all([
      context.PoolRegistry.set({
        id: poolAddress.toLowerCase(),
        protocol: "Syncswap",
        pool: poolAddress.toLowerCase(),
        underlyingToken0: newSyncswapPool.underlyingToken,
        underlyingToken1: newSyncswapPool.underlyingToken2,
      }),
    ]);

    return newSyncswapPool;
  } catch (error) {
    context.log.error(`Failed to create/get Syncswap pool ${poolAddress}: ${error}`);
    throw error;
  }
}
