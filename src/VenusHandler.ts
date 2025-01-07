import { Account, ERC20_Transfer_event, handlerContext, Venus } from "generated";
import { Address, getContract } from "viem";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./utils/GetTokenData";
import { AccountEarnBalance_t, VenusPool_t } from "generated/src/db/Entities.gen";

Venus.Mint.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalSupply: venusPool.totalSupply + event.params.mintTokens,
    totalCash: venusPool.totalCash + event.params.actualMintAmount,
  });
});

Venus.Redeem.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalSupply: venusPool.totalSupply - event.params.redeemTokens,
    totalCash: venusPool.totalCash - event.params.redeemAmount,
  });
});

Venus.ProtocolSeize.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalSupply: venusPool.totalSupply - event.params.amount,
  });
});

Venus.Borrow.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalBorrows: event.params.totalBorrows,
    totalCash: venusPool.totalCash - event.params.borrowAmount,
  });
});

Venus.RepayBorrow.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalBorrows: event.params.totalBorrowsNew,
    totalCash: venusPool.totalCash + event.params.repayAmount,
  });
});

Venus.BadDebtIncreased.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    badDebt: event.params.badDebtNew,
  });
});

Venus.BadDebtRecovered.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    badDebt: event.params.badDebtNew,
  });
});

Venus.ReservesAdded.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalReserves: event.params.newTotalReserves,
  });
});

Venus.ReservesReduced.handler(async ({ event, context }) => {
  const venusPool = await getOrCreateVenusPool(event.srcAddress as Address, context);
  context.VenusPool.set({
    ...venusPool,
    totalReserves: event.params.newTotalReserves,
  });
});

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
    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: VenusPoolABI,
      client,
    });

    const [name, symbol, underlyingToken] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "underlying" },
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
      totalCash: 0n,
      totalBorrows: 0n,
      totalReserves: 0n,
      badDebt: 0n,
      totalSupply: 0n,
    };

    context.VenusPool.set(newVenusPool);
    context.PoolRegistry.set({
      id: poolAddress.toLowerCase(),
      protocol: "Venus",
    });

    return newVenusPool;
  }
}
