import { Address, Client, getContract } from "viem";
import { SyncswapPoolABI } from "../abi/SyncswapPool";
import { client } from "../viem/Client";

export async function shareToAmountSyncswap(
  pool: Address,
  reserve0: bigint,
  reserve1: bigint,
  totalSupply: bigint,
  liquidity: bigint,
  token0: string,
  token1: string,
  blockNumber: bigint,
  txSender?: Address
): Promise<{ token0Value: bigint; token1Value: bigint }> {
  const token0Amount = (reserve0 * liquidity) / totalSupply;
  const token1Amount = (reserve1 * liquidity) / totalSupply;

  // If poolConfig.token is token0, swap token1 to token0 and add to token0Amount

  const { amountOut0, amountOut1 } = await getAmountOut(
    token0,
    token0Amount,
    token1,
    token1Amount,
    pool,
    blockNumber,
    txSender
  );
  const token0Value = token0Amount + amountOut1;
  const token1Value = token1Amount + amountOut0;

  return { token0Value, token1Value };
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
