/**
 * SyncswapHandler.ts
 * Handles events from Syncswap DEX contracts, managing pool creation, liquidity changes,
 * and user balances for the Clave indexer.
 */

import { Address, Client, getContract } from "viem";
import { getOrCreateClaggPool, setHistoricalClaggPool } from "./ClaggHandler";
import { handlerContext, SyncswapEarnBalance, SyncswapFactory, SyncswapPool } from "generated";
import { SyncswapPool_t } from "generated/src/db/Entities.gen";
import { roundTimestamp } from "./utils/helpers";
import { walletCache } from "./utils/WalletCache";
import { ClaggMainAddress } from "./constants/ClaggAddresses";
import { SyncswapPoolABI } from "./abi/SyncswapPool";
import { client } from "./viem/Client";

/**
 * Handles new pool creation events from the Syncswap Factory
 * Creates and stores pool data including token pairs and initial state
 */
SyncswapFactory.PoolCreated.handler(async ({ event, context }) => {
  await createOrGetSyncswapPool(event.params.pool.toLowerCase() as Address, context);
});

/**
 * Registers new Syncswap pools for dynamic contract tracking
 */
SyncswapFactory.PoolCreated.contractRegister(
  async ({ event, context }) => {
    context.addSyncswapPool(event.params.pool.toLowerCase() as Address);
  },
  { preRegisterDynamicContracts: true }
);

SyncswapPool.Mint.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([event.params.to.toLowerCase()]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn as {
      claveAddresses: Set<string>;
    };

    if (process.env.NODE_ENV === "test") {
      claveAddresses = new Set([event.params.to.toLowerCase()]);
    }
    if (
      !claveAddresses.has(event.params.to.toLowerCase()) &&
      ClaggMainAddress.toLowerCase() != event.params.to.toLowerCase()
    ) {
      return;
    }

    context.Account.set({
      id: event.params.to.toLowerCase(),
      address: event.params.to.toLowerCase(),
    });

    const poolAddress = event.srcAddress.toLowerCase();
    const toAddress = event.params.to.toLowerCase();

    const pool = await createOrGetSyncswapPool(
      poolAddress as Address,
      context,
      BigInt(event.block.number)
    );

    // Update historical pool records
    setHistoricalSyncswapPool(pool, context, event.block.timestamp);

    if (event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);

      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply + event.params.liquidity,
      };

      context.ClaggPool.set(adjustedPool);
      setHistoricalClaggPool(adjustedPool, context, event.block.timestamp);
      return;
    }

    const receiverAccountBalance = await context.SyncswapEarnBalance.get(toAddress + poolAddress);

    if (claveAddresses.has(toAddress)) {
      // Update receiver's account balance
      const prevAccountObject: SyncswapEarnBalance = {
        id: toAddress + poolAddress,
        shareBalance:
          receiverAccountBalance == undefined ? 0n : receiverAccountBalance.shareBalance,
        userAddress: toAddress,
        syncswapPool_id: poolAddress,
      };

      const accountObject = {
        ...prevAccountObject,
        shareBalance: prevAccountObject.shareBalance + event.params.liquidity,
      };

      context.SyncswapEarnBalance.set(accountObject);
      setHistoricalSyncswapPoolBalances(prevAccountObject, context, event.block.timestamp);
    }
  },
});

SyncswapPool.Burn.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([event.params.to.toLowerCase()]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn as {
      claveAddresses: Set<string>;
    };

    if (process.env.NODE_ENV === "test") {
      claveAddresses = new Set([event.params.to.toLowerCase()]);
    }
    if (
      !claveAddresses.has(event.params.to.toLowerCase()) &&
      ClaggMainAddress.toLowerCase() != event.params.to.toLowerCase()
    ) {
      return;
    }

    context.Account.set({
      id: event.params.to.toLowerCase(),
      address: event.params.to.toLowerCase(),
    });

    const poolAddress = event.srcAddress.toLowerCase();
    const toAddress = event.params.to.toLowerCase();

    const pool = await createOrGetSyncswapPool(
      poolAddress as Address,
      context,
      BigInt(event.block.number)
    );

    // Update historical pool records
    setHistoricalSyncswapPool(pool, context, event.block.timestamp);

    if (event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);

      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply - event.params.liquidity,
      };

      context.ClaggPool.set(adjustedPool);
      setHistoricalClaggPool(adjustedPool, context, event.block.timestamp);
      return;
    }

    const receiverAccountBalance = await context.SyncswapEarnBalance.get(toAddress + poolAddress);

    if (claveAddresses.has(toAddress)) {
      // Update receiver's account balance
      const prevAccountObject: SyncswapEarnBalance = {
        id: toAddress + poolAddress,
        shareBalance:
          receiverAccountBalance == undefined ? 0n : receiverAccountBalance.shareBalance,
        userAddress: toAddress,
        syncswapPool_id: poolAddress,
      };

      const accountObject = {
        ...prevAccountObject,
        shareBalance: prevAccountObject.shareBalance - event.params.liquidity,
      };

      context.SyncswapEarnBalance.set(accountObject);
      setHistoricalSyncswapPoolBalances(prevAccountObject, context, event.block.timestamp);
    }
  },
});

async function createOrGetSyncswapPool(
  poolAddress: Address,
  context: handlerContext,
  blockNumber?: bigint
) {
  const existingPool = await context.SyncswapPool.get(poolAddress.toLowerCase());
  if (existingPool != undefined) {
    return existingPool;
  }

  try {
    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: SyncswapPoolABI,
      client: client as Client,
    });

    const [name, symbol, poolType, token0Precision, token1Precision, totalSupply, token0, token1] =
      await client.multicall({
        contracts: [
          { ...contract, functionName: "name" },
          { ...contract, functionName: "symbol" },
          { ...contract, functionName: "poolType" },
          { ...contract, functionName: "token0PrecisionMultiplier" },
          { ...contract, functionName: "token1PrecisionMultiplier" },
          { ...contract, functionName: "totalSupply" },
          { ...contract, functionName: "token0" },
          { ...contract, functionName: "token1" },
        ],
        blockNumber,
      });

    // Validate results
    if (!name.result || !symbol.result || !poolType.result) {
      context.log.error(`Failed to fetch pool data for ${poolAddress} on Syncswap`);
    }

    const newSyncswapPool: SyncswapPool_t = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken: token0.result
        ? (token0.result as Address).toLowerCase()
        : poolAddress.toLowerCase(),
      underlyingToken2: token1.result
        ? (token1.result as Address).toLowerCase()
        : poolAddress.toLowerCase(),
      name: name.result as string,
      symbol: symbol.result as string,
      poolType: poolType.result as bigint,
      token0PrecisionMultiplier: (token0Precision.result as bigint) ?? 1n,
      token1PrecisionMultiplier: (token1Precision.result as bigint) ?? 1n,
      reserve0: 0n,
      reserve1: 0n,
      totalSupply: (totalSupply.result as bigint) ?? 0n,
    };

    await Promise.all([
      context.PoolRegistry.set({
        id: poolAddress.toLowerCase(),
        protocol: "Syncswap",
        pool: poolAddress.toLowerCase(),
      }),
      context.SyncswapPool.set(newSyncswapPool),
    ]);

    return newSyncswapPool;
  } catch (error) {
    context.log.error(`Failed to create/get Syncswap pool ${poolAddress}: ${error}`);
    throw error;
  }
}

function setHistoricalSyncswapPoolBalances(
  accountObject: SyncswapEarnBalance,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalSyncswapEarnBalance4Hours.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 3600 * 4),
    timestamp: BigInt(roundTimestamp(timestamp, 3600 * 4)),
  });
  context.HistoricalSyncswapEarnBalance1Day.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400),
    timestamp: BigInt(roundTimestamp(timestamp, 86400)),
  });
  context.HistoricalSyncswapEarnBalance7Days.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalSyncswapEarnBalance1Month.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
}

function setHistoricalSyncswapPool(
  poolObject: SyncswapPool_t,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalSyncswapPoolDaily.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp),
    timestamp: BigInt(roundTimestamp(timestamp)),
  });
  context.HistoricalSyncswapPoolWeekly.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalSyncswapPoolMonthly.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
}
