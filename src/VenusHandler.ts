/**
 * VenusHandler.ts
 * Handles events from Venus Protocol contracts, managing lending pools, interest accrual,
 * borrowing activities, and user balances for the Clave indexer.
 */

import { Address, Client, getContract } from "viem";
import { getOrCreateClaggPool } from "./ClaggHandler";
import { Venus } from "generated";
import { handlerContext, Venus_Transfer_event, VenusEarnBalance, VenusPool } from "generated";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { roundTimestamp } from "./utils/helpers";
import { walletCache } from "./utils/WalletCache";
import { ClaggMainAddress } from "./constants/ClaggAddresses";
import { venusExchangeRateInterval } from "./utils/intervals";

Venus.AccrueInterest.handler(async ({ context, event }) => {
  if (
    process.env.NODE_ENV === "test" ||
    venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)
  ) {
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

Venus.Transfer.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([event.params.from.toLowerCase()]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn as {
      claveAddresses: Set<string>;
    };

    if (process.env.NODE_ENV === "test") {
      claveAddresses = new Set([event.params.from.toLowerCase(), event.params.to.toLowerCase()]);
    }

    const pool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);

    if (event.params.from === event.params.to) {
      return;
    }

    if (!claveAddresses || claveAddresses.size === 0) {
      if (!isClaggTransfer(event)) {
        return;
      }
    }

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
      let accountObject: VenusEarnBalance = {
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
      let accountObject: VenusEarnBalance = {
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
  },
});

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
      client: client as Client,
    });

    const [name, symbol, underlyingToken, exchangeRate] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "underlying" },
        { ...contract, functionName: "exchangeRateStored" },
      ],
    });

    const newVenusPool: VenusPool = {
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
    client: client as Client,
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

/**
 * Checks if a transfer event affects Venus pool's total supply
 * @param event The transfer event to check
 * @returns True if the event affects Venus total supply
 */
function isClaggTransfer(event: Venus_Transfer_event) {
  return (
    event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase() ||
    event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()
  );
}
