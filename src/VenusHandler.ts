import {
  Account,
  ERC20_Transfer_event,
  handlerContext,
  loaderContext,
  Venus,
  Venus_Mint_event,
  Venus_Redeem_event,
} from "generated";
import { Address, getContract } from "viem";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { AccountEarnBalance_t, VenusPool_t } from "generated/src/db/Entities.gen";

let latestExchangeRateBlock = 0;

type LoaderEvent = Venus_Mint_event;

// Common loader for all Venus handlers
const venusPoolLoader = async ({
  event,
  context,
}: {
  event: LoaderEvent;
  context: loaderContext;
}) => {
  latestExchangeRateBlock = event.block.number;

  const [exchangeRate, pool] = await Promise.all([
    client.readContract({
      address: event.srcAddress.toLowerCase() as Address,
      abi: VenusPoolABI,
      functionName: "exchangeRateStored",
    }),
    context.VenusPool.get(event.srcAddress.toLowerCase()),
  ]);
  return { pool, exchangeRate };
};

Venus.Mint.handlerWithLoader({
  loader: venusPoolLoader,
  handler: async ({ event, context, loaderReturn }) => {
    const { pool } = loaderReturn;
    const venusPool = pool || (await getOrCreateVenusPool(event.srcAddress as Address, context));

    context.VenusPool.set({
      ...venusPool,
      exchangeRate: 0n,
    });
  },
});

// Keep the VenusAccountHandler as is
export const VenusAccountHandler = async ({
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
    senderAccount: Account | undefined;
    receiverAccount: Account | undefined;
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
    let accountObject: AccountEarnBalance_t = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        senderAccountBalance == undefined
          ? 0n - event.params.value
          : senderAccountBalance.shareBalance - event.params.value,
      userAddress: event.params.from.toLowerCase(),
      protocol: "Venus",
      poolAddress: event.srcAddress.toLowerCase(),
    };

    context.AccountEarnBalance.set(accountObject);
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // create new account
    let accountObject: AccountEarnBalance_t = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        receiverAccountBalance == undefined
          ? event.params.value
          : event.params.value + receiverAccountBalance.shareBalance,
      userAddress: event.params.to.toLowerCase(),
      protocol: "Venus",
      poolAddress: event.srcAddress.toLowerCase(),
    };

    context.AccountEarnBalance.set(accountObject);
  }
};

async function getOrCreateVenusPool(poolAddress: Address, context: handlerContext) {
  const pool = await context.VenusPool.get(poolAddress.toLowerCase());
  if (pool != undefined) {
    return pool;
  } else {
    venusInterval.addNewKey(poolAddress.toLowerCase());

    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: VenusPoolABI,
      client,
    });

    const [name, symbol, underlyingToken, exchangeRate] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "underlying" },
        { ...contract, functionName: "exchangeRateStored" },
      ],
    });

    const createdToken = await getOrCreateToken(underlyingToken.result as Address, context);

    const newVenusPool: VenusPool_t = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken_id: createdToken.id,
      name: name.result as string,
      symbol: symbol.result as string,
      protocol: "Venus",
      exchangeRate: exchangeRate.result as bigint,
    };

    context.VenusPool.set(newVenusPool);
    context.PoolRegistry.set({
      id: poolAddress.toLowerCase(),
      protocol: "Venus",
    });

    return newVenusPool;
  }
}
