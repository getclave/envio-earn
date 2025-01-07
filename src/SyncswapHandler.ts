import {
  AccountSyncswapPosition,
  ERC20_Transfer_event,
  handlerContext,
  SyncswapMaster,
  SyncswapPool,
} from "generated";
import { Address, getContract } from "viem";
import { SyncswapPool_t } from "generated/src/db/Entities.gen";
import { SyncswapPoolABI } from "./abi/SyncswapPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { walletCache } from "./utils/WalletCache";
import { ClaggMainAddress } from "./constants/ClaggAddresses";

SyncswapMaster.RegisterPool.contractRegister(
  async ({ event, context }) => {
    context.addSyncswapPool(event.params.pool.toLowerCase() as Address);
  },
  { preRegisterDynamicContracts: true }
);

SyncswapPool.Sync.handler(async ({ event, context }) => {
  const sender = event.transaction.from?.toLowerCase();
  const isClagg = sender && sender.toLowerCase() == ClaggMainAddress.toLowerCase();
  if (sender && !isClagg) {
    const claveAdd = await walletCache.bulkCheckClaveWallets([sender]);
    if (claveAdd.size == 0) {
      return;
    }
  }
  const syncPool = await getOrCreatePool(event.srcAddress as Address, context);

  context.SyncswapPool.set({
    ...syncPool,
    reserve0: event.params.reserve0,
    reserve1: event.params.reserve1,
  });
});

SyncswapPool.Mint.handler(async ({ event, context }) => {
  const sender = event.transaction.from?.toLowerCase();
  const isClagg = sender && sender.toLowerCase() == ClaggMainAddress.toLowerCase();
  if (sender && !isClagg) {
    const claveAdd = await walletCache.bulkCheckClaveWallets([sender]);
    if (claveAdd.size == 0) {
      return;
    }
  }
  const syncPool = await getOrCreatePool(event.srcAddress as Address, context);

  context.SyncswapPool.set({
    ...syncPool,
    totalSupply: syncPool.totalSupply + event.params.liquidity,
  });
});

SyncswapPool.Burn.handler(async ({ event, context }) => {
  const sender = event.transaction.from?.toLowerCase();
  const isClagg = sender && sender.toLowerCase() == ClaggMainAddress.toLowerCase();
  if (sender && !isClagg) {
    const claveAdd = await walletCache.bulkCheckClaveWallets([sender]);
    if (claveAdd.size == 0) {
      return;
    }
  }
  const syncPool = await getOrCreatePool(event.srcAddress as Address, context);

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

async function getOrCreatePool(poolAddress: Address, context: handlerContext) {
  const pool = await context.SyncswapPool.get(poolAddress.toLowerCase());
  if (!pool) {
    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: SyncswapPoolABI,
      client,
    });
    const [
      name,
      symbol,
      underlyingToken,
      underlyingToken2,
      poolType,
      token0Precision,
      token1Precision,
    ] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "token0" },
        { ...contract, functionName: "token1" },
        { ...contract, functionName: "poolType" },
        { ...contract, functionName: "token0PrecisionMultiplier" },
        { ...contract, functionName: "token1PrecisionMultiplier" },
      ],
    });
    const [createdToken, createdToken2] = await Promise.all([
      getOrCreateToken(underlyingToken.result as Address, context),
      getOrCreateToken(underlyingToken2.result as Address, context),
    ]);

    const newSyncswapPool: SyncswapPool_t = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken_id: createdToken.id,
      underlyingToken2_id: createdToken2.id,
      name: name.result as string,
      symbol: symbol.result as string,
      poolType: poolType.result as bigint,
      token0PrecisionMultiplier: (token0Precision.result as bigint) ?? 1n,
      token1PrecisionMultiplier: (token1Precision.result as bigint) ?? 1n,
      reserve0: 0n,
      reserve1: 0n,
      totalSupply: 0n,
    };

    return newSyncswapPool;
  }

  return pool;
}
