import { AccountEarnBalance, ClaggMain, handlerContext } from "generated";
import { AccountEarnBalance_t, ClaggPool_t } from "generated/src/db/Entities.gen";
import { Address } from "viem";
import { walletCache } from "./utils/WalletCache";

/**
 * Handles deposit events for Clagg pools
 * Updates pool total shares and user balances
 */
ClaggMain.Deposit.handlerWithLoader({
  loader: async ({
    event,
    context,
  }): Promise<{
    user: AccountEarnBalance | undefined;
  }> => {
    const [user] = await Promise.all([
      context.AccountEarnBalance.get(
        event.params.user.toLowerCase() +
          event.params.pool.toLowerCase() +
          event.srcAddress.toLowerCase()
      ),
    ]);
    return { user };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { user } = loaderReturn;
    const pool = await getOrCreateClaggPool(event.params.pool.toLowerCase() as Address, context);
    // Update pool total shares
    context.ClaggPool.set({
      ...pool,
      totalShares: pool.totalShares + event.params.shares,
    });

    const createdUser: AccountEarnBalance_t = {
      id:
        event.params.user.toLowerCase() +
        event.params.pool.toLowerCase() +
        event.srcAddress.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        user == undefined ? event.params.shares : user.shareBalance + event.params.shares,
      protocol: "Clagg",
      poolAddress: event.params.pool.toLowerCase(),
    };

    context.AccountEarnBalance.set(createdUser);
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
    user: AccountEarnBalance | undefined;
  }> => {
    const [user] = await Promise.all([
      context.AccountEarnBalance.get(
        event.params.user.toLowerCase() +
          event.params.pool.toLowerCase() +
          event.srcAddress.toLowerCase()
      ),
    ]);
    return { user };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { user } = loaderReturn;
    const pool = await getOrCreateClaggPool(event.params.pool.toLowerCase() as Address, context);

    // Update pool total shares
    context.ClaggPool.set({
      ...pool,
      totalShares: pool.totalShares - event.params.shares,
    });

    const createdUser: AccountEarnBalance_t = {
      id:
        event.params.user.toLowerCase() +
        event.params.pool.toLowerCase() +
        event.srcAddress.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        user == undefined ? 0n - event.params.shares : user.shareBalance - event.params.shares,
      protocol: "Clagg",
      poolAddress: event.params.pool.toLowerCase(),
    };

    context.AccountEarnBalance.set(createdUser);
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
