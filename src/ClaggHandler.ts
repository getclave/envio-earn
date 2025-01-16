import { Account, AccountEarnBalance, ClaggMain, handlerContext } from "generated";
import { Account_t, AccountEarnBalance_t, ClaggPool_t } from "generated/src/db/Entities.gen";
import { Address } from "viem";

/**
 * Handles deposit events for Clagg pools
 * Updates pool total shares and user balances
 */
ClaggMain.Deposit.handlerWithLoader({
  loader: async ({
    event,
    context,
  }): Promise<{
    userBalance: AccountEarnBalance | undefined;
    user: Account | undefined;
  }> => {
    const [userBalance, user] = await Promise.all([
      context.AccountEarnBalance.get(
        event.params.user.toLowerCase() +
          event.params.pool.toLowerCase() +
          event.srcAddress.toLowerCase()
      ),
      context.Account.get(event.params.user.toLowerCase()),
    ]);
    return { userBalance, user };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance, user } = loaderReturn;
    const pool = await getOrCreateClaggPool(event.params.pool.toLowerCase() as Address, context);
    // Update pool total shares
    context.ClaggPool.set({
      ...pool,
      totalShares: pool.totalShares + event.params.shares,
    });

    const createdUserBalance: AccountEarnBalance_t = {
      id:
        event.params.user.toLowerCase() +
        event.params.pool.toLowerCase() +
        event.srcAddress.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        userBalance == undefined
          ? event.params.shares
          : userBalance.shareBalance + event.params.shares,
      protocol: "Clagg",
      poolAddress: event.params.pool.toLowerCase(),
    };

    context.AccountEarnBalance.set(createdUserBalance);

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
    userBalance: AccountEarnBalance | undefined;
    user: Account | undefined;
  }> => {
    const [userBalance, user] = await Promise.all([
      context.AccountEarnBalance.get(
        event.params.user.toLowerCase() +
          event.params.pool.toLowerCase() +
          event.srcAddress.toLowerCase()
      ),
      context.Account.get(event.params.user.toLowerCase()),
    ]);
    return { userBalance, user };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance, user } = loaderReturn;
    const pool = await getOrCreateClaggPool(event.params.pool.toLowerCase() as Address, context);

    // Update pool total shares
    context.ClaggPool.set({
      ...pool,
      totalShares: pool.totalShares - event.params.shares,
    });

    const createdUserBalance: AccountEarnBalance_t = {
      id:
        event.params.user.toLowerCase() +
        event.params.pool.toLowerCase() +
        event.srcAddress.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        userBalance == undefined
          ? 0n - event.params.shares
          : userBalance.shareBalance - event.params.shares,
      protocol: "Clagg",
      poolAddress: event.params.pool.toLowerCase(),
    };

    context.AccountEarnBalance.set(createdUserBalance);

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
