import { handlerContext } from "generated";
import { shareToAmountSyncswap } from "./syncswap";
import { Address } from "viem";
import { shareToAmountVenus } from "./venus";
import { shareToAmountAave } from "./aave";
import { ClaggMainAddress } from "../constants/ClaggAddresses";

export async function claggShareToAmount(
  shareBalance: bigint,
  totalShares: bigint,
  totalSupply: bigint,
  poolAddress: string,
  blockNumber: bigint,
  context: handlerContext
) {
  if (totalShares === 0n || shareBalance === 0n) {
    return { token0Value: 0n, token1Value: 0n };
  }
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
    const { tokenAmount } = await shareToAmountVenus(
      ClaggMainAddress,
      poolAddress as Address,
      context,
      blockNumber
    );
    const userBalance = (shareBalance * tokenAmount) / totalShares;
    return { token0Value: userBalance, token1Value: userBalance };
  }

  if (pool?.protocol === "Aave") {
    const { balance } = await shareToAmountAave(
      ClaggMainAddress,
      poolAddress as Address,
      context,
      blockNumber
    );
    const userBalance = (shareBalance * balance) / totalShares;
    return { token0Value: userBalance, token1Value: userBalance };
  }

  return { token0Value: 0n, token1Value: 0n };
}
