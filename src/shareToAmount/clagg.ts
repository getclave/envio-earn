import { handlerContext } from "generated";
import { shareToAmountSyncswap } from "./syncswap";
import { Address } from "viem";
import { shareToAmountVenus } from "./venus";
import { shareToAmountAave } from "./aave";

export async function claggShareToAmount(
  shareBalance: bigint,
  totalShares: bigint,
  totalSupply: bigint,
  poolAddress: string,
  blockNumber: bigint,
  context: handlerContext
) {
  const shares = totalSupply * (shareBalance / totalShares);
  const pool = await context.PoolRegistry.get(poolAddress);

  if (pool?.protocol === "Syncswap") {
    const { token0Value, token1Value } = await shareToAmountSyncswap(
      poolAddress as Address,
      shares,
      blockNumber,
      context
    );
    return { token0Value, token1Value };
  }

  if (pool?.protocol === "Venus") {
    const { tokenAmount } = await shareToAmountVenus(shares, poolAddress as Address, context);
    return { token0Value: tokenAmount, token1Value: tokenAmount };
  }

  if (pool?.protocol === "Aave") {
    const { balance } = await shareToAmountAave(
      poolAddress as Address,
      poolAddress as Address,
      context
    );
    return { token0Value: balance, token1Value: balance };
  }

  return { token0Value: 0n, token1Value: 0n };
}
