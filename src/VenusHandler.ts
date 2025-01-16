/**
 * VenusHandler.ts
 * Handles events from Venus Protocol contracts, managing lending pools, interest accrual,
 * borrowing activities, and user balances for the Clave indexer.
 */

import { ERC20_Transfer_event, handlerContext, Venus } from "generated";
import { Address, getContract } from "viem";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { AccountEarnBalance_t, VenusPool_t } from "generated/src/db/Entities.gen";
import { venusExchangeRateInterval } from "./utils/intervals";
import { getOrCreateClaggPool } from "./ClaggHandler";
import { ClaggMainAddress } from "./constants/ClaggAddresses";

Venus.AccrueInterest.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(event.srcAddress.toLowerCase() as Address, context);
  }
});

Venus.Borrow.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(event.srcAddress.toLowerCase() as Address, context);
  }
});

Venus.RepayBorrow.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(event.srcAddress.toLowerCase() as Address, context);
  }
});

Venus.BadDebtIncreased.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(event.srcAddress.toLowerCase() as Address, context);
  }
});

Venus.BadDebtRecovered.handler(async ({ context, event }) => {
  if (venusExchangeRateInterval.shouldFetch(event.srcAddress.toLowerCase(), event.block.number)) {
    await setNewExchangeRate(event.srcAddress.toLowerCase() as Address, context);
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

    context.ClaggPool.set({
      ...pool,
      totalSupply: pool.totalSupply - event.params.value,
    });
    return;
  }

  if (event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()) {
    const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
    context.ClaggPool.set({
      ...pool,
      totalSupply: pool.totalSupply + event.params.value,
    });
    return;
  }

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
      poolAddress: pool.id,
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
      poolAddress: pool.id,
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

    const [name, symbol, underlyingToken, exchangeRate] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "underlying" },
        { ...contract, functionName: "exchangeRateStored" },
      ],
    });

    const createdToken = await getOrCreateToken(underlyingToken.result as Address, context);

    const newVenusPool: VenusPool_t = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken_id: createdToken.id,
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

async function setNewExchangeRate(poolAddress: Address, context: handlerContext) {
  const contract = getContract({
    address: poolAddress.toLowerCase() as Address,
    abi: VenusPoolABI,
    client,
  });

  const [exchangeRate] = await client.multicall({
    contracts: [{ ...contract, functionName: "exchangeRateStored" }],
  });

  const pool = await getOrCreateVenusPool(poolAddress, context);

  context.VenusPool.set({
    ...pool,
    exchangeRate: exchangeRate.result as bigint,
  });
}
