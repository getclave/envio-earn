import { ClaggEarnBalance, ClaggMain, handlerContext } from "generated";
import { ClaggEarnBalance_t } from "generated/src/db/Entities.gen";
import { Address, Client, getContract } from "viem";
import { roundTimestamp } from "./utils/helpers";
import { ClaggAdapterABI } from "./abi/ClaggAdapter";
import { client } from "./viem/Client";
import { walletCache } from "./utils/WalletCache";
import { claggShareToAmount } from "./shareToAmount";
import { poolToAdapter } from "./constants/ClaggAddresses";

/**
 * Handles deposit events for Clagg pools
 * Updates pool total shares and user balances
 */
ClaggMain.Deposit.handlerWithLoader({
  loader: async ({
    event,
    context,
  }): Promise<{
    userBalance: ClaggEarnBalance | undefined;
  }> => {
    const [userBalance] = await Promise.all([
      context.ClaggEarnBalance.get(
        event.params.user.toLowerCase() + event.params.pool.toLowerCase()
      ),
    ]);
    return { userBalance };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance } = loaderReturn;
    const pool = await getClaggPool(event.params.pool.toLowerCase() as Address);
    context.Account.set({
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
    });

    const previousUserBalance: ClaggEarnBalance_t = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance: userBalance == undefined ? 0n : userBalance.shareBalance,
      totalDeposits: userBalance == undefined ? 0n : userBalance.totalDeposits,
      totalWithdrawals: userBalance == undefined ? 0n : userBalance.totalWithdrawals,
      tokenAmount0: userBalance == undefined ? 0n : userBalance.tokenAmount0,
      tokenAmount1: userBalance == undefined ? 0n : userBalance.tokenAmount1,
      poolAddress: event.params.pool.toLowerCase(),
    };

    const { token0Value, token1Value } = await claggShareToAmount(
      previousUserBalance.shareBalance + event.params.shares,
      pool.totalShares,
      pool.totalSupply,
      event.params.pool.toLowerCase(),
      BigInt(event.block.number),
      context
    );

    const createdUserBalance: ClaggEarnBalance_t = {
      ...previousUserBalance,
      shareBalance: previousUserBalance.shareBalance + event.params.shares,
      totalDeposits: previousUserBalance.totalDeposits + event.params.amount,
      tokenAmount0: token0Value,
      tokenAmount1: token1Value,
    };
    context.ClaggEarnBalance.set(createdUserBalance);
    setHistoricalClaggEarnBalance(previousUserBalance, context, event.block.timestamp);
  },
});

/**
 * Handles withdraw events for Clagg pools
 * Updates pool total shares and user balances
 */
ClaggMain.Withdraw.handlerWithLoader({
  loader: async ({
    event,
    context,
  }): Promise<{
    claveAddresses: Set<string>;
  }> => {
    const [claveAddresses] = await Promise.all([
      walletCache.bulkCheckClaveWallets([event.params.user.toLowerCase()]),
    ]);
    return { claveAddresses };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn;

    if (process.env.NODE_ENV === "test") {
      claveAddresses = new Set([event.params.user.toLowerCase()]);
    }

    if (!claveAddresses || claveAddresses.size === 0) {
      return;
    }

    context.Account.set({
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
    });

    const pool = await getClaggPool(event.params.pool.toLowerCase() as Address);

    const userBalance = await context.ClaggEarnBalance.get(
      event.params.user.toLowerCase() + event.params.pool.toLowerCase()
    );

    const previousUserBalance: ClaggEarnBalance_t = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance: userBalance == undefined ? 0n : userBalance.shareBalance,
      totalDeposits: userBalance == undefined ? 0n : userBalance.totalDeposits,
      totalWithdrawals: userBalance == undefined ? 0n : userBalance.totalWithdrawals,
      poolAddress: event.params.pool.toLowerCase(),
      tokenAmount0: userBalance == undefined ? 0n : userBalance.tokenAmount0,
      tokenAmount1: userBalance == undefined ? 0n : userBalance.tokenAmount1,
    };

    const { token0Value, token1Value } = await claggShareToAmount(
      previousUserBalance.shareBalance - event.params.shares,
      pool.totalShares,
      pool.totalSupply,
      event.params.pool.toLowerCase(),
      BigInt(event.block.number),
      context
    );

    const createdUserBalance: ClaggEarnBalance_t = {
      ...previousUserBalance,
      shareBalance: previousUserBalance.shareBalance - event.params.shares,
      totalWithdrawals: previousUserBalance.totalWithdrawals + event.params.amount,
      tokenAmount0: token0Value,
      tokenAmount1: token1Value,
    };

    context.ClaggEarnBalance.set(createdUserBalance);
    setHistoricalClaggEarnBalance(previousUserBalance, context, event.block.timestamp);
  },
});

/**
 * Gets or creates a Clagg pool entry in the database
 * Fetches pool details including total shares and supply
 */
export async function getClaggPool(poolAddress: Address): Promise<{
  id: string;
  address: string;
  totalShares: bigint;
  totalSupply: bigint;
}> {
  const contract = getContract({
    address: poolAddress,
    abi: ClaggAdapterABI,
    client: client as Client,
  });

  const adapterAddress = poolToAdapter[poolAddress.toLowerCase() as keyof typeof poolToAdapter];

  if (adapterAddress == undefined) {
    return {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      totalShares: 0n,
      totalSupply: 0n,
    };
  }

  const [poolInfoResponse] = await client.multicall({
    contracts: [
      {
        ...contract,
        functionName: "getPoolInfo",
        args: [poolAddress, adapterAddress],
      },
    ],
  });

  const poolInfo = poolInfoResponse.result;

  const newClaggPool = {
    id: poolAddress.toLowerCase(),
    address: poolAddress.toLowerCase(),
    totalShares: poolInfo.totalSupply ?? 0n,
    totalSupply: poolInfo.totalLiquidity ?? 0n,
  };

  return newClaggPool;
}

function setHistoricalClaggEarnBalance(
  accountObject: ClaggEarnBalance_t,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalClaggEarnBalance4Hours.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 3600 * 4),
    timestamp: BigInt(roundTimestamp(timestamp, 3600 * 4)),
  });
  context.HistoricalClaggEarnBalance1Day.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400),
    timestamp: BigInt(roundTimestamp(timestamp, 86400)),
  });
  context.HistoricalClaggEarnBalance7Days.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalClaggEarnBalance1Month.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
}
