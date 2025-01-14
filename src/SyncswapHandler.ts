import {
  Account,
  AccountEarnBalance,
  ERC20_Transfer_event,
  handlerContext,
  SyncswapFactory,
  SyncswapFactory_PoolCreated_event,
  SyncswapPool,
} from "generated";
import { Address, getContract } from "viem";
import { SyncswapPool_t } from "generated/src/db/Entities.gen";
import { SyncswapPoolABI } from "./abi/SyncswapPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { SyncswapPools } from "./ERC20Handler";

SyncswapFactory.PoolCreated.handler(async ({ event, context }) => {
  await createPool(event, context);
  SyncswapPools.add(event.params.pool.toLowerCase() as Address);
});

SyncswapFactory.PoolCreated.contractRegister(
  async ({ event, context }) => {
    context.addSyncswapPool(event.params.pool.toLowerCase() as Address);
  },
  { preRegisterDynamicContracts: true }
);

SyncswapPool.Sync.handler(async ({ event, context }) => {
  const syncPool = (await context.SyncswapPool.get(
    event.srcAddress.toLowerCase() as Address
  )) as SyncswapPool_t;

  context.SyncswapPool.set({
    ...syncPool,
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
  });
});

SyncswapPool.Mint.handler(async ({ event, context }) => {
  const syncPool = (await context.SyncswapPool.get(
    event.srcAddress.toLowerCase() as Address
  )) as SyncswapPool_t;
  context.SyncswapPool.set({
    ...syncPool,
    totalSupply: syncPool.totalSupply + event.params.liquidity,
  });
});

SyncswapPool.Burn.handler(async ({ event, context }) => {
  const syncPool = (await context.SyncswapPool.get(
    event.srcAddress.toLowerCase() as Address
  )) as SyncswapPool_t;

  context.SyncswapPool.set({
    ...syncPool,
    totalSupply: syncPool.totalSupply - event.params.liquidity,
  });
});

export const SyncswapAccountHandler = async ({
  event,
  context,
  loaderReturn,
}: {
  event: ERC20_Transfer_event;
  context: handlerContext;
  loaderReturn: any;
}) => {
  const { claveAddresses, senderAccount, receiverAccount } = loaderReturn as {
    claveAddresses: Set<string>;
    senderAccount: Account;
    receiverAccount: Account;
  };

  if (claveAddresses.size == 0) {
    return;
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

  if (event.params.from === event.params.to) {
    return;
  }

  const senderAccountBalance = await context.AccountEarnBalance.get(
    event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
  );
  const receiverAccountBalance = await context.AccountEarnBalance.get(
    event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
  );

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // create the account
    let accountObject: AccountEarnBalance = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        senderAccountBalance == undefined
          ? 0n - event.params.value
          : senderAccountBalance.shareBalance - event.params.value,
      userAddress: event.params.from.toLowerCase(),
      poolAddress: event.srcAddress.toLowerCase(),
      protocol: "Syncswap",
    };

    context.AccountEarnBalance.set(accountObject);
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // create new account
    let accountObject: AccountEarnBalance = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        receiverAccountBalance == undefined
          ? event.params.value
          : event.params.value + receiverAccountBalance.shareBalance,
      userAddress: event.params.to.toLowerCase(),
      poolAddress: event.srcAddress.toLowerCase(),
      protocol: "Syncswap",
    };

    context.AccountEarnBalance.set(accountObject);
  }
};

async function createPool(event: SyncswapFactory_PoolCreated_event, context: handlerContext) {
  const contract = getContract({
    address: event.params.pool.toLowerCase() as Address,
    abi: SyncswapPoolABI,
    client,
  });
  const [name, symbol, poolType, token0Precision, token1Precision, totalSupply] =
    await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "poolType" },
        { ...contract, functionName: "token0PrecisionMultiplier" },
        { ...contract, functionName: "token1PrecisionMultiplier" },
        { ...contract, functionName: "totalSupply" },
      ],
    });
  const [createdToken, createdToken2] = await Promise.all([
    getOrCreateToken(event.params.token0.toLowerCase() as Address, context),
    getOrCreateToken(event.params.token1.toLowerCase() as Address, context),
  ]);

  const newSyncswapPool: SyncswapPool_t = {
    id: event.params.pool.toLowerCase(),
    address: event.params.pool.toLowerCase(),
    underlyingToken_id: createdToken.id,
    underlyingToken2_id: createdToken2.id,
    name: name.result as string,
    symbol: symbol.result as string,
    poolType: poolType.result as bigint,
    token0PrecisionMultiplier: (token0Precision.result as bigint) ?? 1n,
    token1PrecisionMultiplier: (token1Precision.result as bigint) ?? 1n,
    reserve0: 0n,
    reserve1: 0n,
    totalSupply: totalSupply.result as bigint,
    protocol: "Syncswap",
  };

  context.PoolRegistry.set({
    id: event.params.pool.toLowerCase(),
    protocol: "Syncswap",
  });

  context.SyncswapPool.set(newSyncswapPool);

  return newSyncswapPool;
}
