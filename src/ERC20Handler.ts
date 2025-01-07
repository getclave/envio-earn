import { ERC20, AccountIdleBalance, Token } from "generated";
import { getOrCreateToken } from "./utils/GetTokenData";
import { walletCache } from "./utils/WalletCache";
import { VenusPoolAddresses } from "./constants/VenusPools";
import { venusShareFetcher } from "./utils/VenusShareFetcher";
import { SyncswapPoolsToFetchShare } from "./utils/SyncswapFetcher";
import { SyncswapAccountHandler } from "./SyncswapHandler";
import { Address } from "viem";
import { claggShareFetcher } from "./utils/ClaggFetcher";
import { VenusAccountHandler } from "./VenusHandler";

ERC20.Transfer.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [senderAccount, receiverAccount, token, claveAddresses] = await Promise.all([
      context.AccountIdleBalance.get(
        event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
      ),
      context.AccountIdleBalance.get(
        event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
      ),
      context.Token.get(event.srcAddress.toLowerCase()),
      walletCache.bulkCheckClaveWallets([
        event.params.from.toLowerCase(),
        event.params.to.toLowerCase(),
      ]),
    ]);
    return {
      senderAccount,
      receiverAccount,
      token,
      claveAddresses,
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { senderAccount, receiverAccount, token, claveAddresses } = loaderReturn as {
      senderAccount: AccountIdleBalance;
      receiverAccount: AccountIdleBalance;
      token: Token;
      claveAddresses: Set<string>;
    };

    try {
      //? Disabled: await priceFetcher.genOdosTokenPrices(context, event);
      await venusShareFetcher.genVenusPoolShares(context, event);
      //? Disabled: await syncswapShareFetcher.genSyncswapPoolShares(context, event);
      await claggShareFetcher.genClaggPoolShares(context, event);
    } catch (e: any) {
      context.log.error(e?.message as string);
    }

    //* Route to earn handlers from ERC20
    if (VenusPoolAddresses.includes(event.srcAddress.toLowerCase())) {
      return await VenusAccountHandler({ event, context, loaderReturn });
    }
    if (SyncswapPoolsToFetchShare.has(event.srcAddress.toLowerCase() as Address)) {
      return await SyncswapAccountHandler({ event, context, loaderReturn });
    }

    if (claveAddresses.size == 0) {
      return;
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
          senderAccount == undefined
            ? 0n - event.params.value
            : senderAccount.balance - event.params.value,
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
          receiverAccount == undefined
            ? event.params.value
            : event.params.value + receiverAccount.balance,
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
