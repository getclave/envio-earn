/**
 * SyncswapHandler.ts
 * Handles events from Syncswap DEX contracts, managing pool creation, liquidity changes,
 * and user balances for the Clave indexer.
 */

import {
  AccountEarnBalance,
  ERC20_Transfer_event,
  handlerContext,
  SyncswapFactory,
  SyncswapFactory_PoolCreated_event,
  SyncswapPool,
} from "generated";
import { Address, getContract } from "viem";
import { SyncswapPool_t } from "generated/src/db/Entities.gen";
import { SyncswapPoolABI } from "./abi/SyncswapPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { SyncswapPools } from "./ERC20Handler";

/**
 * Handles new pool creation events from the Syncswap Factory
 * Creates and stores pool data including token pairs and initial state
 */
SyncswapFactory.PoolCreated.handler(async ({ event, context }) => {
  await createPool(event, context);
  SyncswapPools.add(event.params.pool.toLowerCase() as Address);
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

/**
 * Updates pool reserves when sync events occur
 * Tracks the current state of liquidity in the pool
 */
SyncswapPool.Sync.handler(async ({ event, context }) => {
  const syncPool = (await context.SyncswapPool.get(
    event.srcAddress.toLowerCase() as Address
  )) as SyncswapPool_t;

  context.SyncswapPool.set({
    ...syncPool,
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
  });
});

/**
 * Handles liquidity addition events
 * Updates pool's total supply when new liquidity is added
 */
SyncswapPool.Mint.handler(async ({ event, context }) => {
  const syncPool = (await context.SyncswapPool.get(
    event.srcAddress.toLowerCase() as Address
  )) as SyncswapPool_t;
  context.SyncswapPool.set({
    ...syncPool,
    totalSupply: syncPool.totalSupply + event.params.liquidity,
  });
});

/**
 * Handles liquidity removal events
 * Updates pool's total supply when liquidity is removed
 */
SyncswapPool.Burn.handler(async ({ event, context }) => {
  const syncPool = (await context.SyncswapPool.get(
    event.srcAddress.toLowerCase() as Address
  )) as SyncswapPool_t;

  context.SyncswapPool.set({
    ...syncPool,
    totalSupply: syncPool.totalSupply - event.params.liquidity,
  });
});

/**
 * Handles LP token transfers for Syncswap pools
 * Updates user account balances when LP tokens are transferred
 * @param event The transfer event details
 * @param context The handler context for database operations
 * @param loaderReturn Contains pre-loaded data including Clave addresses
 */
export const SyncswapAccountHandler = async ({
  event,
  context,
  loaderReturn,
}: {
  event: ERC20_Transfer_event;
  context: handlerContext;
  loaderReturn: any;
}) => {
  try {
    if (!event.srcAddress || !event.params.from || !event.params.to) {
      context.log.error(`Missing required parameters in SyncswapAccountHandler`);
      return;
    }

    const { claveAddresses } = loaderReturn as {
      claveAddresses: Set<string>;
    };

    if (!claveAddresses) {
      context.log.error(`Missing claveAddresses in loaderReturn`);
      return;
    }

    const fromAddress = event.params.from.toLowerCase();
    const toAddress = event.params.to.toLowerCase();
    const poolAddress = event.srcAddress.toLowerCase();

    const [senderAccountBalance, receiverAccountBalance] = await Promise.all([
      context.AccountEarnBalance.get(fromAddress + poolAddress),
      context.AccountEarnBalance.get(toAddress + poolAddress),
    ]);

    if (claveAddresses.has(fromAddress)) {
      // Update sender's account balance
      let accountObject: AccountEarnBalance = {
        id: fromAddress + poolAddress,
        shareBalance:
          senderAccountBalance == undefined
            ? 0n - event.params.value
            : senderAccountBalance.shareBalance - event.params.value,
        userAddress: fromAddress,
        poolAddress: poolAddress,
        protocol: "Syncswap",
      };

      context.AccountEarnBalance.set(accountObject);
      context.log.debug(`Updated sender balance in Syncswap pool`);
    }

    if (claveAddresses.has(toAddress)) {
      // Update receiver's account balance
      let accountObject: AccountEarnBalance = {
        id: toAddress + poolAddress,
        shareBalance:
          receiverAccountBalance == undefined
            ? event.params.value
            : event.params.value + receiverAccountBalance.shareBalance,
        userAddress: toAddress,
        poolAddress: poolAddress,
        protocol: "Syncswap",
      };

      context.AccountEarnBalance.set(accountObject);
      context.log.debug(`Updated receiver balance in Syncswap pool`);
    }
  } catch (error) {
    context.log.error(`Error in SyncswapAccountHandler: ${error}`);
    throw error;
  }
};

/**
 * Creates a new Syncswap pool entry in the database
 * Fetches pool details including name, symbol, and precision multipliers
 * @param event The pool creation event
 * @param context The handler context
 * @returns The newly created pool object
 */
async function createPool(event: SyncswapFactory_PoolCreated_event, context: handlerContext) {
  const contract = getContract({
    address: event.params.pool.toLowerCase() as Address,
    abi: SyncswapPoolABI,
    client,
  });
  const [name, symbol, poolType, token0Precision, token1Precision, totalSupply] =
    await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "poolType" },
        { ...contract, functionName: "token0PrecisionMultiplier" },
        { ...contract, functionName: "token1PrecisionMultiplier" },
        { ...contract, functionName: "totalSupply" },
      ],
    });
  const [createdToken, createdToken2] = await Promise.all([
    getOrCreateToken(event.params.token0.toLowerCase() as Address, context),
    getOrCreateToken(event.params.token1.toLowerCase() as Address, context),
  ]);

  const newSyncswapPool: SyncswapPool_t = {
    id: event.params.pool.toLowerCase(),
    address: event.params.pool.toLowerCase(),
    underlyingToken_id: createdToken.id,
    underlyingToken2_id: createdToken2.id,
    name: name.result as string,
    symbol: symbol.result as string,
    poolType: poolType.result as bigint,
    token0PrecisionMultiplier: (token0Precision.result as bigint) ?? 1n,
    token1PrecisionMultiplier: (token1Precision.result as bigint) ?? 1n,
    reserve0: 0n,
    reserve1: 0n,
    totalSupply: totalSupply.result as bigint,
    protocol: "Syncswap",
  };

  context.PoolRegistry.set({
    id: event.params.pool.toLowerCase(),
    protocol: "Syncswap",
  });

  context.SyncswapPool.set(newSyncswapPool);

  return newSyncswapPool;
}
