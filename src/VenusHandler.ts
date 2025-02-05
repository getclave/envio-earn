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

Venus.Transfer.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([
        event.params.from.toLowerCase(),
        event.params.to.toLowerCase(),
      ]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn as {
      claveAddresses: Set<string>;
    };

    if (process.env.NODE_ENV === "test") {
      claveAddresses = new Set([event.params.from.toLowerCase(), event.params.to.toLowerCase()]);
    }

    if (event.params.from === event.params.to) {
      return;
    }

    if (!claveAddresses || claveAddresses.size === 0) {
      if (!isClaggTransfer(event)) {
        return;
      }
    }

    if (claveAddresses.has(event.params.from.toLowerCase())) {
      context.Account.set({
        id: event.params.from.toLowerCase(),
        address: event.params.from.toLowerCase(),
      });
    }

    if (claveAddresses.has(event.params.to.toLowerCase())) {
      context.Account.set({
        id: event.params.to.toLowerCase(),
        address: event.params.to.toLowerCase(),
      });
    }

    const pool = await getOrCreateVenusPool(event.srcAddress.toLowerCase() as Address, context);

    await setNewExchangeRate(
      event.srcAddress.toLowerCase() as Address,
      context,
      event.block.timestamp,
      BigInt(event.block.number)
    );

    if (event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);

      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply - event.params.value,
      };

      context.ClaggPool.set(adjustedPool);
      return;
    }

    if (event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply + event.params.value,
      };

      context.ClaggPool.set(adjustedPool);
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
      const prevAccountObject: VenusEarnBalance = {
        id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
        shareBalance: senderAccountBalance == undefined ? 0n : senderAccountBalance.shareBalance,
        userAddress: event.params.from.toLowerCase(),
        venusPool_id: pool.id,
      };

      const updatedAccountObject: VenusEarnBalance = {
        ...prevAccountObject,
        shareBalance: prevAccountObject.shareBalance - event.params.value,
      };

      context.VenusEarnBalance.set(updatedAccountObject);
      setHistoricalVenusEarnBalance(prevAccountObject, context, event.block.timestamp);
    }

    if (claveAddresses.has(event.params.to.toLowerCase())) {
      // Update receiver's account balance
      const prevAccountObject: VenusEarnBalance = {
        id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
        shareBalance:
          receiverAccountBalance == undefined ? 0n : receiverAccountBalance.shareBalance,
        userAddress: event.params.to.toLowerCase(),
        venusPool_id: pool.id,
      };

      const updatedAccountObject: VenusEarnBalance = {
        ...prevAccountObject,
        shareBalance: prevAccountObject.shareBalance + event.params.value,
      };

      context.VenusEarnBalance.set(updatedAccountObject);
      setHistoricalVenusEarnBalance(prevAccountObject, context, event.block.timestamp);
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
  timestamp: number,
  blockNumber?: bigint
) {
  const contract = getContract({
    address: poolAddress.toLowerCase() as Address,
    abi: VenusPoolABI,
    client: client as Client,
  });

  const [exchangeRate] = await client.multicall({
    contracts: [{ ...contract, functionName: "exchangeRateStored" }],
    blockNumber,
  });

  const pool = await getOrCreateVenusPool(poolAddress, context);

  const adjustedPool = {
    ...pool,
    exchangeRate: exchangeRate.result as bigint,
  };

  context.VenusPool.set(adjustedPool);
}

function setHistoricalVenusEarnBalance(
  accountObject: VenusEarnBalance,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalVenusEarnBalance4Hours.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 3600 * 4),
    timestamp: BigInt(roundTimestamp(timestamp, 3600 * 4)),
  });

  context.HistoricalVenusEarnBalance1Day.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400),
    timestamp: BigInt(roundTimestamp(timestamp, 86400)),
  });

  context.HistoricalVenusEarnBalance7Days.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });

  context.HistoricalVenusEarnBalance1Month.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
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
