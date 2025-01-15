/**
 * VenusHandler.ts
 * Handles events from Venus Protocol contracts, managing lending pools, interest accrual,
 * borrowing activities, and user balances for the Clave indexer.
 */

import { ERC20_Transfer_event, handlerContext, Venus } from "generated";
import { Address, getContract, zeroAddress } from "viem";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { AccountEarnBalance_t, VenusPool_t } from "generated/src/db/Entities.gen";

/**
 * Handles repayment of borrowed assets
 * Updates the pool's total borrows when users repay their debt
 */
Venus.RepayBorrow.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalBorrows: event.params.totalBorrows,
  });
});

/**
 * Handles new borrowing events
 * Updates the pool's total borrows when users borrow assets
 */
Venus.Borrow.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalBorrows: event.params.totalBorrows,
  });
});

/**
 * Handles interest accrual events
 * Updates the pool's total borrows when interest is accrued
 */
Venus.AccrueInterest.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalBorrows: event.params.totalBorrows,
  });
});

/**
 * Handles bad debt increase events
 * Updates the pool's bad debt tracking when borrower defaults
 */
Venus.BadDebtIncreased.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    badDebt: event.params.badDebtNew,
  });
});

/**
 * Handles bad debt recovery events
 * Updates the pool's bad debt tracking when debt is recovered
 */
Venus.BadDebtRecovered.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    badDebt: event.params.badDebtNew,
  });
});

/**
 * Handles reduction in spread reserves
 * Updates the pool's total reserves when spread reserves are reduced
 */
Venus.SpreadReservesReduced.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalReserves: event.params.newTotalReserves,
  });
});

/**
 * Handles addition to reserves
 * Updates the pool's total reserves when new reserves are added
 */
Venus.ReservesAdded.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalReserves: event.params.newTotalReserves,
  });
});

/**
 * Handles changes in Venus pool's total supply
 * Updates the pool's total supply tracking for mints and burns
 * @param event The transfer event details
 * @param context The handler context
 */
export const VenusTotalSupplyHandler = async ({
  event,
  context,
}: {
  event: ERC20_Transfer_event;
  context: handlerContext;
}) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalSupply:
      event.params.from === zeroAddress
        ? venusPool.totalSupply + event.params.value
        : venusPool.totalSupply - event.params.value,
  });
};

/**
 * Handles changes in Venus pool's total cash
 * Updates the pool's total cash when assets flow in or out
 * @param event The transfer event details
 * @param context The handler context
 */
export const VenusTotalCashHandler = async ({
  event,
  context,
}: {
  event: ERC20_Transfer_event;
  context: handlerContext;
}) => {
  try {
    if (!event.srcAddress || !event.params.from || !event.params.to) {
      context.log.error(`Missing required parameters in VenusTotalCashHandler`);
      return;
    }

    const venusPool = await getOrCreateVenusPool(
      event.srcAddress.toLowerCase() as Address,
      context
    );
    if (!venusPool || !venusPool.address) {
      context.log.error(`Failed to get or create Venus pool`);
      return;
    }

    const fromAddress = event.params.from.toLowerCase();
    const toAddress = event.params.to.toLowerCase();
    const poolAddress = venusPool.address.toLowerCase();

    if (fromAddress === poolAddress) {
      context.log.debug(`Updating total cash for outgoing transfer`);
      context.VenusPool.set({
        ...venusPool,
        totalCash: venusPool.totalCash + event.params.value,
      });
    } else if (toAddress === poolAddress) {
      context.log.debug(`Updating total cash for incoming transfer`);
      context.VenusPool.set({
        ...venusPool,
        totalCash: venusPool.totalCash - event.params.value,
      });
    }
  } catch (error) {
    context.log.error(`Error in VenusTotalCashHandler: ${error}`);
    throw error;
  }
};

/**
 * Handles Venus token transfers for tracked accounts
 * Updates user account balances when Venus tokens are transferred
 * @param event The transfer event details
 * @param context The handler context
 * @param loaderReturn Contains pre-loaded data including Clave addresses
 */
export const VenusAccountHandler = async ({
  event,
  context,
  loaderReturn,
}: {
  event: ERC20_Transfer_event;
  context: handlerContext;
  loaderReturn: any;
}) => {
  const { claveAddresses } = loaderReturn as {
    claveAddresses: Set<string>;
  };

  const senderAccountBalance = await context.AccountEarnBalance.get(
    event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
  );
  const receiverAccountBalance = await context.AccountEarnBalance.get(
    event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
  );

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // Update sender's account balance
    let accountObject: AccountEarnBalance_t = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        senderAccountBalance == undefined
          ? 0n - event.params.value
          : senderAccountBalance.shareBalance - event.params.value,
      userAddress: event.params.from.toLowerCase(),
      protocol: "Venus",
      poolAddress: event.srcAddress.toLowerCase(),
    };

    context.AccountEarnBalance.set(accountObject);
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // Update receiver's account balance
    let accountObject: AccountEarnBalance_t = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        receiverAccountBalance == undefined
          ? event.params.value
          : event.params.value + receiverAccountBalance.shareBalance,
      userAddress: event.params.to.toLowerCase(),
      protocol: "Venus",
      poolAddress: event.srcAddress.toLowerCase(),
    };

    context.AccountEarnBalance.set(accountObject);
  }
};

/**
 * Gets or creates a Venus pool entry in the database
 * Fetches pool details including name, symbol, and underlying token
 * @param poolAddress The address of the Venus pool
 * @param context The handler context
 * @returns The Venus pool object
 */
async function getOrCreateVenusPool(poolAddress: Address, context: handlerContext) {
  const pool = await context.VenusPool.get(poolAddress.toLowerCase());
  if (pool != undefined) {
    return pool;
  } else {
    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: VenusPoolABI,
      client,
    });

    const [name, symbol, underlyingToken] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "underlying" },
      ],
    });

    const createdToken = await getOrCreateToken(underlyingToken.result as Address, context);

    const newVenusPool: VenusPool_t = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken_id: createdToken.id,
      name: name.result as string,
      symbol: symbol.result as string,
      protocol: "Venus",
      totalSupply: 0n,
      totalCash: 0n,
      totalBorrows: 0n,
      badDebt: 0n,
      totalReserves: 0n,
    };

    context.VenusPool.set(newVenusPool);
    context.PoolRegistry.set({
      id: poolAddress.toLowerCase(),
      protocol: "Venus",
    });

    return newVenusPool;
  }
}
