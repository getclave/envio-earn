import { ClaggEarnBalance, ClaggMain, handlerContext } from "generated";
import { Account_t, ClaggEarnBalance_t, ClaggPool_t } from "generated/src/db/Entities.gen";
import { Address } from "viem";
import { roundTimestamp } from "./utils/helpers";

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
    setHistoricalClaggPool(adjustedPool, context, event.block.timestamp);

    const previousUserBalance: ClaggEarnBalance_t = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance: userBalance == undefined ? 0n : userBalance.shareBalance,
      totalDeposits: userBalance == undefined ? 0n : userBalance.totalDeposits,
      totalWithdrawals: userBalance == undefined ? 0n : userBalance.totalWithdrawals,
      claggPool_id: event.params.pool.toLowerCase(),
    };

    const createdUserBalance: ClaggEarnBalance_t = {
      ...previousUserBalance,
      shareBalance: previousUserBalance.shareBalance + event.params.shares,
      totalDeposits: previousUserBalance.totalDeposits + event.params.amount,
    };

    context.ClaggEarnBalance.set(createdUserBalance);
    setHistoricalClaggEarnBalance(previousUserBalance, context, event.block.timestamp);

    const createdUser: Account_t = {
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
    setHistoricalClaggPool(adjustedPool, context, event.block.timestamp);

    const previousUserBalance: ClaggEarnBalance_t = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance: userBalance == undefined ? 0n : userBalance.shareBalance,
      totalDeposits: userBalance == undefined ? 0n : userBalance.totalDeposits,
      totalWithdrawals: userBalance == undefined ? 0n : userBalance.totalWithdrawals,
      claggPool_id: event.params.pool.toLowerCase(),
    };

    const createdUserBalance: ClaggEarnBalance_t = {
      ...previousUserBalance,
      shareBalance: previousUserBalance.shareBalance - event.params.shares,
      totalWithdrawals: previousUserBalance.totalWithdrawals + event.params.amount,
    };

    context.ClaggEarnBalance.set(createdUserBalance);
    setHistoricalClaggEarnBalance(previousUserBalance, context, event.block.timestamp);

    const createdUser: Account_t = {
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
): Promise<ClaggPool_t> {
  const pool = await context.ClaggPool.get(poolAddress.toLowerCase());

  if (pool != undefined) {
    return pool;
  }

  const newClaggPool: ClaggPool_t = {
    id: poolAddress.toLowerCase(),
    address: poolAddress.toLowerCase(),
    totalShares: 0n,
    totalSupply: 0n,
  };

  context.ClaggPool.set(newClaggPool);

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

export function setHistoricalClaggPool(
  poolObject: ClaggPool_t,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalClaggPoolDaily.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp),
    timestamp: BigInt(roundTimestamp(timestamp)),
  });
  context.HistoricalClaggPoolWeekly.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalClaggPoolMonthly.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
}
