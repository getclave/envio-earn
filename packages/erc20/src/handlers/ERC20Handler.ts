/**
 * ERC20Handler.ts
 * Central handler for ERC20 token transfers across different protocols (Syncswap, Venus)
 * Manages token balances, account tracking, and protocol-specific logic for the Clave indexer.
 */

import { walletCache, ClaggMainAddress, roundTimestamp } from "@clave/shared";
import {
  ERC20,
  AccountIdleBalance,
  Account,
  ERC20_Transfer_event,
  handlerContext,
} from "../../generated";

/**
 * Main handler for all ERC20 Transfer events
 * Uses a loader pattern to pre-fetch necessary data for efficiency
 */
ERC20.Transfer.handlerWithLoader({
  /**
   * Loader function to pre-fetch account balances and Clave wallet status
   * Reduces database calls by batching queries
   */
  loader: async ({ event, context }) => {
    const [senderBalance, receiverBalance, claveAddresses, senderAccount, receiverAccount] =
      await Promise.all([
        context.AccountIdleBalance.get(
          event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
        ),
        context.AccountIdleBalance.get(
          event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
        ),
        walletCache.bulkCheckClaveWallets([
          event.params.from.toLowerCase(),
          event.params.to.toLowerCase(),
        ]),
        context.Account.get(event.params.from.toLowerCase()),
        context.Account.get(event.params.to.toLowerCase()),
      ]);
    return {
      senderBalance,
      receiverBalance,
      claveAddresses,
      senderAccount,
      receiverAccount,
    };
  },

  /**
   * Main transfer event handler
   * Routes transfers to appropriate protocol handlers and manages account balances
   */
  handler: async ({ event, context, loaderReturn }) => {
    try {
      let { claveAddresses, senderAccount, receiverAccount } = loaderReturn as {
        claveAddresses: Set<string>;
        senderAccount: Account;
        receiverAccount: Account;
      };

      if (event.params.from === event.params.to) {
        return;
      }

      if (process.env.NODE_ENV == "test") {
        claveAddresses = new Set([event.params.from.toLowerCase(), event.params.to.toLowerCase()]);
        loaderReturn.claveAddresses = claveAddresses;
      }

      if (!claveAddresses || claveAddresses.size === 0) {
        if (!isClaggTransfer(event)) {
          return;
        }
      }

      const fromAddress = event.params.from.toLowerCase();
      const toAddress = event.params.to.toLowerCase();

      // Create accounts for new Clave users
      if (!senderAccount && claveAddresses.has(fromAddress)) {
        context.Account.set({
          id: fromAddress,
          address: fromAddress,
        });
      }

      if (!receiverAccount && claveAddresses.has(toAddress)) {
        context.Account.set({
          id: toAddress,
          address: toAddress,
        });
      }

      await PlainTransferHandler(event, context, loaderReturn);
    } catch (error) {
      context.log.error(`Error in ERC20 Transfer handler: ${error}`);
      throw error;
    }
  },

  wildcard: true,
});

/**
 * Handles plain ERC20 transfers not associated with specific protocols
 * Updates account balances and maintains historical balance records
 * @param event The transfer event details
 * @param context The handler context
 * @param loaderReturn Pre-loaded data including balances and Clave addresses
 */
async function PlainTransferHandler(
  event: ERC20_Transfer_event,
  context: handlerContext,
  loaderReturn: any
) {
  const { claveAddresses, senderBalance, receiverBalance } = loaderReturn;

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // Update sender's balance
    let accountObject: AccountIdleBalance = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      balance:
        senderBalance == undefined
          ? 0n - event.params.value
          : senderBalance.balance - event.params.value,
      address: event.params.from.toLowerCase(),
      token: event.srcAddress.toLowerCase(),
    };

    context.AccountIdleBalance.set(accountObject);
    context.HistoricalAccountIdleBalance.set({
      ...accountObject,
      id: accountObject.id + roundTimestamp(event.block.timestamp, 3600),
      timestamp: BigInt(roundTimestamp(event.block.timestamp, 3600)),
    });
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // Update receiver's balance
    let accountObject: AccountIdleBalance = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      balance:
        receiverBalance == undefined
          ? event.params.value
          : event.params.value + receiverBalance.balance,
      address: event.params.to.toLowerCase(),
      token: event.srcAddress.toLowerCase(),
    };

    context.AccountIdleBalance.set(accountObject);
    context.HistoricalAccountIdleBalance.set({
      ...accountObject,
      id: accountObject.id + roundTimestamp(event.block.timestamp, 3600),
      timestamp: BigInt(roundTimestamp(event.block.timestamp, 3600)),
    });
  }
}

/**
 * Checks if a transfer event affects Venus pool's total supply
 * @param event The transfer event to check
 * @returns True if the event affects Venus total supply
 */
function isClaggTransfer(event: ERC20_Transfer_event) {
  return (
    event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase() ||
    event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()
  );
}
