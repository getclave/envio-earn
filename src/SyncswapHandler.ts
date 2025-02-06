/**
 * SyncswapHandler.ts
 * Handles events from Syncswap DEX contracts, managing pool creation, liquidity changes,
 * and user balances for the Clave indexer.
 */

import { Address } from "viem";
import { handlerContext, SyncswapEarnBalance, SyncswapFactory, SyncswapPool } from "generated";
import { roundTimestamp } from "./utils/helpers";
import { walletCache } from "./utils/WalletCache";
import { syncswapCache } from "./utils/SyncswapCache";
import { shareToAmountSyncswap } from "./shareToAmount";

/**
 * Handles new pool creation events from the Syncswap Factory
 * Creates and stores pool data including token pairs and initial state
 */
SyncswapFactory.PoolCreated.handler(async ({ event }) => {
  await syncswapCache.addPool(event.params.pool.toLowerCase() as Address);
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

SyncswapPool.Transfer.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([
        event.params.from.toLowerCase(),
        event.params.to.toLowerCase(),
      ]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    try {
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
        return;
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

      const fromAddress = event.params.from.toLowerCase();
      const toAddress = event.params.to.toLowerCase();
      const poolAddress = event.srcAddress.toLowerCase();

      const [senderAccountBalance, receiverAccountBalance] = await Promise.all([
        context.SyncswapEarnBalance.get(fromAddress + poolAddress),
        context.SyncswapEarnBalance.get(toAddress + poolAddress),
      ]);

      if (claveAddresses.has(fromAddress)) {
        const { token0Value, token1Value, poolDetails } = await shareToAmountSyncswap(
          poolAddress as Address,
          senderAccountBalance ? senderAccountBalance.shareBalance - event.params.value : 0n,
          BigInt(event.block.number),
          context,
          fromAddress as Address
        );
        // Update sender's account balance
        const prevAccountObject: SyncswapEarnBalance = {
          id: fromAddress + poolAddress,
          shareBalance: senderAccountBalance == undefined ? 0n : senderAccountBalance.shareBalance,
          tokenAmount0: senderAccountBalance == undefined ? 0n : senderAccountBalance.tokenAmount0,
          tokenAmount1: senderAccountBalance == undefined ? 0n : senderAccountBalance.tokenAmount1,
          userAddress: fromAddress,
          poolName: poolDetails.name,
          poolSymbol: poolDetails.symbol,
          underlyingToken0: poolDetails.underlyingToken,
          underlyingToken1: poolDetails.underlyingToken2,
          poolAddress: poolAddress,
        };

        const accountObject = {
          ...prevAccountObject,
          shareBalance: prevAccountObject.shareBalance - event.params.value,
          tokenAmount0: token0Value,
          tokenAmount1: token1Value,
        };

        context.SyncswapEarnBalance.set(accountObject);
        setHistoricalSyncswapPoolBalances(prevAccountObject, context, event.block.timestamp);
      }

      if (claveAddresses.has(toAddress)) {
        const { token0Value, token1Value, poolDetails } = await shareToAmountSyncswap(
          poolAddress as Address,
          receiverAccountBalance
            ? receiverAccountBalance.shareBalance + event.params.value
            : event.params.value,
          BigInt(event.block.number),
          context,
          toAddress as Address
        );
        // Update receiver's account balance
        const prevAccountObject: SyncswapEarnBalance = {
          id: toAddress + poolAddress,
          shareBalance:
            receiverAccountBalance == undefined ? 0n : receiverAccountBalance.shareBalance,
          tokenAmount0:
            receiverAccountBalance == undefined ? 0n : receiverAccountBalance.tokenAmount0,
          tokenAmount1:
            receiverAccountBalance == undefined ? 0n : receiverAccountBalance.tokenAmount1,
          userAddress: toAddress,
          poolName: poolDetails.name,
          poolSymbol: poolDetails.symbol,
          underlyingToken0: poolDetails.underlyingToken,
          underlyingToken1: poolDetails.underlyingToken2,
          poolAddress: poolAddress,
        };

        const accountObject = {
          ...prevAccountObject,
          shareBalance: prevAccountObject.shareBalance + event.params.value,
          tokenAmount0: token0Value,
          tokenAmount1: token1Value,
        };

        context.SyncswapEarnBalance.set(accountObject);
        setHistoricalSyncswapPoolBalances(prevAccountObject, context, event.block.timestamp);
      }
    } catch (error) {
      context.log.error(`Error in SyncswapAccountHandler: ${error}`);
      throw error;
    }
  },
});

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
