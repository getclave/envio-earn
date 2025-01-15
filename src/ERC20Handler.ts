/**
 * ERC20Handler.ts
 * Central handler for ERC20 token transfers across different protocols (Syncswap, Venus)
 * Manages token balances, account tracking, and protocol-specific logic for the Clave indexer.
 */

import {
  ERC20,
  AccountIdleBalance,
  Account,
  ERC20_Transfer_event,
  handlerContext,
} from "generated";
import { getOrCreateToken } from "./utils/GetTokenData";
import { walletCache } from "./utils/WalletCache";
import { SyncswapAccountHandler } from "./SyncswapHandler";
import { Address, zeroAddress } from "viem";
import { VenusPoolAddresses } from "./constants/VenusPools";
import {
  VenusAccountHandler,
  VenusTotalCashHandler,
  VenusTotalSupplyHandler,
} from "./VenusHandler";

/**
 * Set of Syncswap pool addresses for quick lookup
 */
export const SyncswapPools = new Set<Address>();

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

      // Handle Venus protocol specific events
      if (isVenusTotalSupplyChange(event)) {
        await VenusTotalSupplyHandler({ event, context });
      }

      if (isVenusTotalCashChange(event)) {
        context.log.debug(`VenusTotalCashChange`);
        await VenusTotalCashHandler({ event, context });
      }

      if (!claveAddresses || claveAddresses.size === 0) {
        return;
      }

      const fromAddress = event.params.from.toLowerCase();
      const toAddress = event.params.to.toLowerCase();
      const srcAddress = event.srcAddress.toLowerCase() as Address;

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
      // Route to protocol-specific handlers
      if (SyncswapPools.has(srcAddress)) {
        context.log.debug(`Routing to SyncswapAccountHandler`);
        return await SyncswapAccountHandler({ event, context, loaderReturn });
      }

      if (VenusPoolAddresses.includes(srcAddress)) {
        context.log.debug(`Routing to VenusAccountHandler`);
        return await VenusAccountHandler({ event, context, loaderReturn });
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
  const generatedToken = await getOrCreateToken(event.srcAddress.toLowerCase(), context);

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // Update sender's balance
    let accountObject: AccountIdleBalance = {
      id: event.params.from.toLowerCase() + generatedToken.id,
      balance:
        senderBalance == undefined
          ? 0n - event.params.value
          : senderBalance.balance - event.params.value,
      address: event.params.from.toLowerCase(),
      token_id: generatedToken.id,
    };

    context.AccountIdleBalance.set(accountObject);
    context.HistoricalAccountIdleBalance.set({
      ...accountObject,
      id: accountObject.id + event.block.timestamp.toString(),
      timestamp: BigInt(event.block.timestamp),
    });
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // Update receiver's balance
    let accountObject: AccountIdleBalance = {
      id: event.params.to.toLowerCase() + generatedToken.id,
      balance:
        receiverBalance == undefined
          ? event.params.value
          : event.params.value + receiverBalance.balance,
      address: event.params.to.toLowerCase(),
      token_id: generatedToken.id,
    };

    context.AccountIdleBalance.set(accountObject);
    context.HistoricalAccountIdleBalance.set({
      ...accountObject,
      id: accountObject.id + event.block.timestamp.toString(),
      timestamp: BigInt(event.block.timestamp),
    });
  }
}

/**
 * Checks if a transfer event affects Venus pool's total supply
 * @param event The transfer event to check
 * @returns True if the event affects Venus total supply
 */
function isVenusTotalSupplyChange(event: ERC20_Transfer_event) {
  return (
    (event.params.to.toLowerCase() == zeroAddress ||
      event.params.from.toLowerCase() == zeroAddress) &&
    VenusPoolAddresses.includes(event.srcAddress.toLowerCase())
  );
}

/**
 * Checks if a transfer event affects Venus pool's total cash
 * @param event The transfer event to check
 * @returns True if the event affects Venus total cash
 */
function isVenusTotalCashChange(event: ERC20_Transfer_event) {
  return (
    VenusPoolAddresses.includes(event.params.from.toLowerCase()) ||
    VenusPoolAddresses.includes(event.params.to.toLowerCase())
  );
}
