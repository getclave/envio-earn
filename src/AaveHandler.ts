import { Address } from "viem";
import { AaveEarnBalance, handlerContext, Aave } from "generated";
import { walletCache } from "./utils/WalletCache";
import { roundTimestamp } from "./utils/helpers";
import { AaveEarnBalance_t } from "generated/src/db/Entities.gen";
import { shareToAmountAave } from "./shareToAmount/aave";

Aave.Transfer.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([
        event.params.from.toLowerCase(),
        event.params.to.toLowerCase(),
      ]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn;
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
    const senderAccountBalance = await context.AaveEarnBalance.get(
      event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
    );
    const receiverAccountBalance = await context.AaveEarnBalance.get(
      event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
    );
    if (claveAddresses.has(event.params.from.toLowerCase())) {
      const { pool, balance } = await shareToAmountAave(
        event.params.from.toLowerCase() as Address,
        event.srcAddress.toLowerCase() as Address,
        context,
        BigInt(event.block.number)
      );

      const previousSenderAccountBalance: AaveEarnBalance = {
        id: event.params.from.toLowerCase() + pool.id,
        userAddress: event.params.from.toLowerCase(),
        poolAddress: pool.id,
        poolName: pool.name,
        poolSymbol: pool.symbol,
        underlyingToken: pool.underlyingToken,
        shareBalance: senderAccountBalance ? senderAccountBalance.shareBalance : 0n,
        tokenAmount: senderAccountBalance ? senderAccountBalance.tokenAmount : 0n,
      };
      // Update sender's account balance
      const accountObject: AaveEarnBalance = {
        ...previousSenderAccountBalance,
        shareBalance: previousSenderAccountBalance.shareBalance - BigInt(event.params.value),
        tokenAmount: balance,
      };
      context.AaveEarnBalance.set(accountObject);
      setHistoricalAaveEarnBalance(previousSenderAccountBalance, context, event.block.timestamp);
    }
    if (claveAddresses.has(event.params.to.toLowerCase())) {
      const { pool, balance } = await shareToAmountAave(
        event.params.to.toLowerCase() as Address,
        event.srcAddress.toLowerCase() as Address,
        context,
        BigInt(event.block.number)
      );
      const previousReceiverAccountBalance: AaveEarnBalance = {
        id: event.params.to.toLowerCase() + pool.id,
        userAddress: event.params.to.toLowerCase(),
        poolAddress: pool.id,
        poolName: pool.name,
        poolSymbol: pool.symbol,
        underlyingToken: pool.underlyingToken,
        shareBalance: receiverAccountBalance ? receiverAccountBalance.shareBalance : 0n,
        tokenAmount: receiverAccountBalance ? receiverAccountBalance.tokenAmount : 0n,
      };
      // Update receiver's account balance
      const accountObject: AaveEarnBalance = {
        ...previousReceiverAccountBalance,
        shareBalance: previousReceiverAccountBalance.shareBalance + BigInt(event.params.value),
        tokenAmount: balance,
      };
      context.AaveEarnBalance.set(accountObject);
      setHistoricalAaveEarnBalance(previousReceiverAccountBalance, context, event.block.timestamp);
    }
  },
});

function setHistoricalAaveEarnBalance(
  accountObject: AaveEarnBalance_t,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalAaveEarnBalance4Hours.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 3600 * 4),
    timestamp: BigInt(roundTimestamp(timestamp, 3600 * 4)),
  });
  context.HistoricalAaveEarnBalance1Day.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400),
    timestamp: BigInt(roundTimestamp(timestamp, 86400)),
  });
  context.HistoricalAaveEarnBalance7Days.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalAaveEarnBalance1Month.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
}
