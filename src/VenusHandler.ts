/**
 * VenusHandler.ts
 * Handles events from Venus Protocol contracts, managing lending pools, interest accrual,
 * borrowing activities, and user balances for the Clave indexer.
 */

import { ERC20_Transfer_event, handlerContext, Venus } from "generated";
import { Address, getContract } from "viem";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { VenusEarnBalance_t, VenusPool_t } from "generated/src/db/Entities.gen";
import { venusExchangeRateInterval } from "./utils/intervals";
import { getOrCreateClaggPool } from "./ClaggHandler";
import { ClaggMainAddress } from "./constants/ClaggAddresses";
import { roundTimestamp } from "./utils/helpers";

Venus.AccrueInterest.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(
      event.srcAddress.toLowerCase() as Address,
      context,
      event.block.timestamp
    );
  }
});

Venus.Borrow.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(
      event.srcAddress.toLowerCase() as Address,
      context,
      event.block.timestamp
    );
  }
});

Venus.RepayBorrow.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(
      event.srcAddress.toLowerCase() as Address,
      context,
      event.block.timestamp
    );
  }
});

Venus.BadDebtIncreased.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(
      event.srcAddress.toLowerCase() as Address,
      context,
      event.block.timestamp
    );
  }
});

Venus.BadDebtRecovered.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(
      event.srcAddress.toLowerCase() as Address,
      context,
      event.block.timestamp
    );
  }
});

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

  const pool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);

  if (event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase()) {
    const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);

    const adjustedPool = {
      ...pool,
      totalSupply: pool.totalSupply - event.params.value,
    };

    context.ClaggPool.set(adjustedPool);
    context.HistoricalClaggPool.set({
      ...adjustedPool,
      id: adjustedPool.id + roundTimestamp(event.block.timestamp),
      timestamp: BigInt(roundTimestamp(event.block.timestamp)),
    });
    return;
  }

  if (event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()) {
    const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
    const adjustedPool = {
      ...pool,
      totalSupply: pool.totalSupply + event.params.value,
    };

    context.ClaggPool.set(adjustedPool);
    context.HistoricalClaggPool.set({
      ...adjustedPool,
      id: adjustedPool.id + roundTimestamp(event.block.timestamp),
      timestamp: BigInt(roundTimestamp(event.block.timestamp)),
    });
    return;
  }

  const senderAccountBalance = await context.VenusEarnBalance.get(
    event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
  );
  const receiverAccountBalance = await context.VenusEarnBalance.get(
    event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
  );

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // Update sender's account balance
    let accountObject: VenusEarnBalance_t = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        senderAccountBalance == undefined
          ? 0n - event.params.value
          : senderAccountBalance.shareBalance - event.params.value,
      userAddress: event.params.from.toLowerCase(),
      venusPool_id: pool.id,
    };

    context.VenusEarnBalance.set(accountObject);
    context.HistoricalVenusEarnBalance.set({
      ...accountObject,
      id: accountObject.id + roundTimestamp(event.block.timestamp, 3600),
      timestamp: BigInt(roundTimestamp(event.block.timestamp, 3600)),
    });
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // Update receiver's account balance
    let accountObject: VenusEarnBalance_t = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        receiverAccountBalance == undefined
          ? event.params.value
          : event.params.value + receiverAccountBalance.shareBalance,
      userAddress: event.params.to.toLowerCase(),
      venusPool_id: pool.id,
    };

    context.VenusEarnBalance.set(accountObject);
    context.HistoricalVenusEarnBalance.set({
      ...accountObject,
      id: accountObject.id + roundTimestamp(event.block.timestamp, 3600),
      timestamp: BigInt(roundTimestamp(event.block.timestamp, 3600)),
    });
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

    const [name, symbol, underlyingToken, exchangeRate] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "underlying" },
        { ...contract, functionName: "exchangeRateStored" },
      ],
    });

    const newVenusPool: VenusPool_t = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken: (underlyingToken.result as Address).toLowerCase(),
      name: name.result as string,
      symbol: symbol.result as string,
      exchangeRate: exchangeRate.result as bigint,
    };

    context.PoolRegistry.set({
      id: poolAddress.toLowerCase(),
      protocol: "Venus",
      pool: poolAddress.toLowerCase(),
    });
    context.VenusPool.set(newVenusPool);

    return newVenusPool;
  }
}

async function setNewExchangeRate(
  poolAddress: Address,
  context: handlerContext,
  timestamp: number
) {
  const contract = getContract({
    address: poolAddress.toLowerCase() as Address,
    abi: VenusPoolABI,
    client,
  });

  const [exchangeRate] = await client.multicall({
    contracts: [{ ...contract, functionName: "exchangeRateStored" }],
  });

  const pool = await getOrCreateVenusPool(poolAddress, context);

  const adjustedPool = {
    ...pool,
    exchangeRate: exchangeRate.result as bigint,
  };

  context.VenusPool.set(adjustedPool);

  context.HistoricalVenusPool.set({
    ...adjustedPool,
    id: adjustedPool.id + roundTimestamp(timestamp),
    timestamp: BigInt(roundTimestamp(timestamp)),
  });
}
