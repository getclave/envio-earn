import {
  AccountSyncswapPosition,
  ERC20_Transfer_event,
  handlerContext,
  SyncswapMaster,
  SyncswapPool,
} from "generated";
import { Address, getContract } from "viem";
import { SyncswapPool_t } from "generated/src/db/Entities.gen";
import { SyncswapPoolsToFetchShare } from "./utils/SyncswapFetcher";
import { SyncswapPoolABI } from "./abi/SyncswapPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./viem/Contract";

SyncswapMaster.RegisterPool.handler(async ({ event, context }) => {
  const contract = getContract({
    address: event.params.pool.toLowerCase() as Address,
    abi: SyncswapPoolABI,
    client,
  });

  const [name, symbol, underlyingToken, underlyingToken2, poolType] = await client.multicall({
    contracts: [
      { ...contract, functionName: "name" },
      { ...contract, functionName: "symbol" },
      { ...contract, functionName: "token0" },
      { ...contract, functionName: "token1" },
      { ...contract, functionName: "poolType" },
    ],
  });

  const token = await context.Token.get((underlyingToken.result as Address).toLowerCase());
  const createdToken = await getOrCreateToken(underlyingToken.result as Address, context, token);

  const token2 = await context.Token.get((underlyingToken2.result as Address).toLowerCase());
  const createdToken2 = await getOrCreateToken(underlyingToken2.result as Address, context, token2);

  const newSyncswapPool: SyncswapPool_t = {
    id: event.params.pool.toLowerCase(),
    address: event.params.pool.toLowerCase(),
    tokenPerShare: 0n,
    tokenPerShare2: 0n,
    underlyingToken_id: createdToken.id,
    underlyingToken2_id: createdToken2.id,
    name: name.result as string,
    symbol: symbol.result as string,
    poolType: poolType.result as bigint,
  };

  context.SyncswapPool.set(newSyncswapPool);
  SyncswapPoolsToFetchShare.add(newSyncswapPool.address as Address);
});

export const SyncswapHandler = async ({
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

  if (claveAddresses.size == 0) {
    return;
  }

  if (event.params.from === event.params.to) {
    return;
  }

  const senderAccount = await context.AccountSyncswapPosition.get(
    event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
  );
  const receiverAccount = await context.AccountSyncswapPosition.get(
    event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
  );

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // create the account
    let accountObject: AccountSyncswapPosition = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        senderAccount == undefined
          ? 0n - event.params.value
          : senderAccount.shareBalance - event.params.value,
      userAddress: event.params.from.toLowerCase(),
      syncswapPool_id: event.srcAddress.toLowerCase(),
    };

    context.AccountSyncswapPosition.set(accountObject);
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // create new account
    let accountObject: AccountSyncswapPosition = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        receiverAccount == undefined
          ? event.params.value
          : event.params.value + receiverAccount.shareBalance,
      userAddress: event.params.to.toLowerCase(),
      syncswapPool_id: event.srcAddress.toLowerCase(),
    };

    context.AccountSyncswapPosition.set(accountObject);
  }
};
