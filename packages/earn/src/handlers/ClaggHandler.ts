import { Address } from "viem";
import { roundTimestamp } from "@clave/shared/utils/helpers";
import { ClaggEarnBalance, ClaggMain, handlerContext, ClaggPool, Account } from "../../generated";

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
    const pool = await getOrCreateClaggPool(event.params.pool.toLowerCase() as Address, context);
    const adjustedPool = {
      ...pool,
      totalShares: pool.totalShares + event.params.shares,
    };
    // Update pool total shares
    context.ClaggPool.set(adjustedPool);
    context.HistoricalClaggPool.set({
      ...adjustedPool,
      id: adjustedPool.id + roundTimestamp(event.block.timestamp),
      timestamp: BigInt(roundTimestamp(event.block.timestamp)),
    });

    const createdUserBalance: ClaggEarnBalance = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        userBalance == undefined
          ? event.params.shares
          : userBalance.shareBalance + event.params.shares,
      totalDeposits:
        userBalance == undefined
          ? event.params.amount
          : userBalance.totalDeposits + event.params.amount,
      totalWithdrawals: userBalance == undefined ? 0n : userBalance.totalWithdrawals,
      claggPool_id: event.params.pool.toLowerCase(),
    };

    context.ClaggEarnBalance.set(createdUserBalance);
    context.HistoricalClaggEarnBalance.set({
      ...createdUserBalance,
      id: createdUserBalance.id + roundTimestamp(event.block.timestamp, 3600),
      timestamp: BigInt(roundTimestamp(event.block.timestamp, 3600)),
    });

    const createdUser: Account = {
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
    };

    context.Account.set(createdUser);
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
    const pool = await getOrCreateClaggPool(event.params.pool.toLowerCase() as Address, context);
    const adjustedPool = {
      ...pool,
      totalShares: pool.totalShares - event.params.shares,
    };
    // Update pool total shares
    context.ClaggPool.set(adjustedPool);
    context.HistoricalClaggPool.set({
      ...adjustedPool,
      id: adjustedPool.id + roundTimestamp(event.block.timestamp),
      timestamp: BigInt(roundTimestamp(event.block.timestamp)),
    });

    const createdUserBalance: ClaggEarnBalance = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        userBalance == undefined
          ? 0n - event.params.shares
          : userBalance.shareBalance - event.params.shares,
      totalDeposits: userBalance == undefined ? 0n : userBalance.totalDeposits,
      totalWithdrawals:
        userBalance == undefined
          ? event.params.amount
          : userBalance.totalWithdrawals + event.params.amount,
      claggPool_id: event.params.pool.toLowerCase(),
    };

    context.ClaggEarnBalance.set(createdUserBalance);
    context.HistoricalClaggEarnBalance.set({
      ...createdUserBalance,
      id: createdUserBalance.id + roundTimestamp(event.block.timestamp, 3600),
      timestamp: BigInt(roundTimestamp(event.block.timestamp, 3600)),
    });

    const createdUser: Account = {
      id: event.params.user.toLowerCase(),
      address: event.params.user.toLowerCase(),
    };

    context.Account.set(createdUser);
  },
});

/**
 * Gets or creates a Clagg pool entry in the database
 * Fetches pool details including total shares and supply
 */
export async function getOrCreateClaggPool(
  poolAddress: Address,
  context: handlerContext
): Promise<ClaggPool> {
  const pool = await context.ClaggPool.get(poolAddress.toLowerCase());

  if (pool != undefined) {
    return pool;
  }

  const newClaggPool: ClaggPool = {
    id: poolAddress.toLowerCase(),
    address: poolAddress.toLowerCase(),
    totalShares: 0n,
    totalSupply: 0n,
  };

  context.ClaggPool.set(newClaggPool);

  return newClaggPool;
}
