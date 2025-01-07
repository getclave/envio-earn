import { ERC20, AccountIdleBalance, Token, Account } from "generated";
import { getOrCreateToken } from "./utils/GetTokenData";
import { walletCache } from "./utils/WalletCache";
import { venusShareFetcher } from "./utils/VenusShareFetcher";
import { SyncswapAccountHandler } from "./SyncswapHandler";
import { Address } from "viem";
import { claggShareFetcher } from "./utils/ClaggFetcher";

export const SyncswapPools = new Set<Address>();

ERC20.Transfer.handlerWithLoader({
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
  handler: async ({ event, context, loaderReturn }) => {
    const { senderBalance, receiverBalance, claveAddresses, senderAccount, receiverAccount } =
      loaderReturn as {
        senderBalance: AccountIdleBalance;
        receiverBalance: AccountIdleBalance;
        claveAddresses: Set<string>;
        senderAccount: Account;
        receiverAccount: Account;
      };

    try {
      //? Disabled: await priceFetcher.genOdosTokenPrices(context, event);
      //? Disabled: await venusShareFetcher.genVenusPoolShares(context, event);
      //? Disabled: await syncswapShareFetcher.genSyncswapPoolShares(context, event);
      //? Disabled: await claggShareFetcher.genClaggPoolShares(context, event);
    } catch (e: any) {
      context.log.error(e?.message as string);
    }

    if (claveAddresses.size == 0) {
      return;
    }

    //* Route to earn handlers from ERC20

    //* if (VenusPoolAddresses.includes(event.srcAddress.toLowerCase())) {
    //   return await VenusAccountHandler({ event, context, loaderReturn });
    // }
    if (SyncswapPools.has(event.srcAddress.toLowerCase() as Address)) {
      return await SyncswapAccountHandler({ event, context, loaderReturn });
    }

    if (senderAccount == null) {
      context.Account.set({
        id: event.params.from.toLowerCase(),
        address: event.params.from.toLowerCase(),
      });
    }

    if (receiverAccount == null) {
      context.Account.set({
        id: event.params.to.toLowerCase(),
        address: event.params.to.toLowerCase(),
      });
    }

    const generatedToken = await getOrCreateToken(event.srcAddress.toLowerCase(), context);

    if (event.params.from === event.params.to) {
      return;
    }

    if (claveAddresses.has(event.params.from.toLowerCase())) {
      // create the account
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
      // create new account
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
  },

  wildcard: true,
});
