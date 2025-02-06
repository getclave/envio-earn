/**
 * VenusHandler.ts
 * Handles events from Venus Protocol contracts, managing lending pools, interest accrual,
 * borrowing activities, and user balances for the Clave indexer.
 */

import { Address } from "viem";
import { Venus } from "generated";
import { handlerContext, VenusEarnBalance } from "generated";
import { roundTimestamp } from "./utils/helpers";
import { walletCache } from "./utils/WalletCache";
import { shareToAmountVenus } from "./shareToAmount";

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

    const senderAccountBalance = await context.VenusEarnBalance.get(
      event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
    );
    const receiverAccountBalance = await context.VenusEarnBalance.get(
      event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
    );

    if (claveAddresses.has(event.params.from.toLowerCase())) {
      const previousAmount =
        senderAccountBalance == undefined ? 0n : senderAccountBalance.tokenAmount;

      const { tokenAmount, poolDetails } = await shareToAmountVenus(
        previousAmount - event.params.value,
        event.srcAddress.toLowerCase() as Address,
        context
      );

      // Update sender's account balance
      const prevAccountObject: VenusEarnBalance = {
        id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
        shareBalance: senderAccountBalance == undefined ? 0n : senderAccountBalance.shareBalance,
        userAddress: event.params.from.toLowerCase(),
        poolAddress: poolDetails.id,
        poolName: poolDetails.name,
        poolSymbol: poolDetails.symbol,
        underlyingToken: poolDetails.underlyingToken,
        tokenAmount: previousAmount,
      };

      const updatedAccountObject: VenusEarnBalance = {
        ...prevAccountObject,
        shareBalance: prevAccountObject.shareBalance - event.params.value,
        tokenAmount: tokenAmount,
      };

      context.VenusEarnBalance.set(updatedAccountObject);
      setHistoricalVenusEarnBalance(prevAccountObject, context, event.block.timestamp);
    }

    if (claveAddresses.has(event.params.to.toLowerCase())) {
      const previousAmount =
        senderAccountBalance == undefined ? 0n : senderAccountBalance.tokenAmount;

      const { tokenAmount, poolDetails } = await shareToAmountVenus(
        previousAmount + event.params.value,
        event.srcAddress.toLowerCase() as Address,
        context
      );
      // Update receiver's account balance
      const prevAccountObject: VenusEarnBalance = {
        id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
        shareBalance:
          receiverAccountBalance == undefined ? 0n : receiverAccountBalance.shareBalance,
        userAddress: event.params.to.toLowerCase(),
        poolAddress: poolDetails.id,
        poolName: poolDetails.name,
        poolSymbol: poolDetails.symbol,
        underlyingToken: poolDetails.underlyingToken,
        tokenAmount: previousAmount,
      };

      const updatedAccountObject: VenusEarnBalance = {
        ...prevAccountObject,
        shareBalance: prevAccountObject.shareBalance + event.params.value,
        tokenAmount: tokenAmount,
      };

      context.VenusEarnBalance.set(updatedAccountObject);
      setHistoricalVenusEarnBalance(prevAccountObject, context, event.block.timestamp);
    }
  },
});

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
