import { Address, Client, getContract } from "viem";
import { AaveEarnBalance, AavePool, handlerContext, Aave } from "generated";
import { getOrCreateClaggPool } from "./ClaggHandler";
import { walletCache } from "./utils/WalletCache";
import { roundTimestamp } from "./utils/helpers";
import { ClaggMainAddress } from "./constants/ClaggAddresses";
import { client } from "./viem/Client";
import { AaveEarnBalance_t } from "generated/src/db/Entities.gen";
import { shareToAmountAave } from "./shareToAmount";

Aave.Mint.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [userBalance, claveAddresses] = await Promise.all([
      context.AaveEarnBalance.get(
        event.params.onBehalfOf.toLowerCase() + event.srcAddress.toLowerCase()
      ),
      walletCache.bulkCheckClaveWallets([event.params.onBehalfOf.toLowerCase()]),
    ]);

    return { userBalance, claveAddresses };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance, claveAddresses } = loaderReturn;

    if (
      !claveAddresses.has(event.params.onBehalfOf.toLowerCase()) &&
      process.env.NODE_ENV !== "test" &&
      event.params.onBehalfOf.toLowerCase() !== ClaggMainAddress.toLowerCase()
    ) {
      return;
    }

    const createdPool = await getOrCreateAavePool(
      event.srcAddress.toLowerCase() as Address,
      context
    );

    const adjustedPool = {
      ...createdPool,
      lastIndex: event.params.index,
    };

    context.AavePool.set(adjustedPool);

    if (event.params.onBehalfOf.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply + event.params.value,
      };
      context.ClaggPool.set(adjustedPool);
      return;
    }

    context.Account.set({
      id: event.params.onBehalfOf.toLowerCase(),
      address: event.params.onBehalfOf.toLowerCase(),
    });

    const previousAaveEarnBalance: AaveEarnBalance = {
      id: event.params.onBehalfOf.toLowerCase() + createdPool.id,
      userAddress: event.params.onBehalfOf.toLowerCase(),
      aavePool_id: createdPool.id,
      userIndex: userBalance ? userBalance.userIndex : 0n,
      shareBalance: userBalance ? userBalance.shareBalance : 0n,
      tokenAmount: userBalance ? userBalance.tokenAmount : 0n,
    };

    const aaveEarnBalance: AaveEarnBalance = {
      ...previousAaveEarnBalance,
      userIndex: event.params.index,
      shareBalance: previousAaveEarnBalance.shareBalance + BigInt(event.params.value),
      tokenAmount:
        (await shareToAmountAave(
          previousAaveEarnBalance.shareBalance,
          event.params.index,
          userBalance ? userBalance.userIndex : 0n
        )) + BigInt(event.params.value),
    };

    context.AaveEarnBalance.set(aaveEarnBalance);
    setHistoricalAaveEarnBalance(previousAaveEarnBalance, context, event.block.timestamp);
  },
});

Aave.Burn.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [userBalance, claveAddresses] = await Promise.all([
      context.AaveEarnBalance.get(event.params.from.toLowerCase() + event.srcAddress.toLowerCase()),
      walletCache.bulkCheckClaveWallets([event.params.from.toLowerCase()]),
    ]);

    return { userBalance, claveAddresses };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance, claveAddresses } = loaderReturn;

    if (
      !claveAddresses.has(event.params.from.toLowerCase()) &&
      process.env.NODE_ENV !== "test" &&
      event.params.from.toLowerCase() !== ClaggMainAddress.toLowerCase()
    ) {
      return;
    }

    const createdPool = await getOrCreateAavePool(
      event.srcAddress.toLowerCase() as Address,
      context
    );

    const adjustedPool = {
      ...createdPool,
      lastIndex: event.params.index,
    };

    context.AavePool.set(adjustedPool);

    if (event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply - event.params.value,
      };
      context.ClaggPool.set(adjustedPool);
      return;
    }

    context.Account.set({
      id: event.params.from.toLowerCase(),
      address: event.params.from.toLowerCase(),
    });

    const previousAaveEarnBalance: AaveEarnBalance = {
      id: event.params.from.toLowerCase() + createdPool.id,
      userAddress: event.params.from.toLowerCase(),
      aavePool_id: createdPool.id,
      userIndex: userBalance ? userBalance.userIndex : 0n,
      shareBalance: userBalance ? userBalance.shareBalance : 0n,
      tokenAmount: userBalance ? userBalance.tokenAmount : 0n,
    };

    const aaveEarnBalance: AaveEarnBalance = {
      ...previousAaveEarnBalance,
      userIndex: event.params.index,
      shareBalance: previousAaveEarnBalance.shareBalance - BigInt(event.params.value),
      tokenAmount: await shareToAmountAave(
        previousAaveEarnBalance.shareBalance - BigInt(event.params.value),
        event.params.index,
        userBalance ? userBalance.userIndex : 0n
      ),
    };
    context.AaveEarnBalance.set(aaveEarnBalance);
    setHistoricalAaveEarnBalance(previousAaveEarnBalance, context, event.block.timestamp);
  },
});

const AAVE_ABI = [
  {
    inputs: [],
    name: "UNDERLYING_ASSET_ADDRESS",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

async function getOrCreateAavePool(poolAddress: Address, context: handlerContext) {
  const pool = await context.AavePool.get(poolAddress.toLowerCase());

  if (pool != undefined) {
    return pool;
  } else {
    const contract = getContract({
      address: poolAddress.toLowerCase() as Address,
      abi: AAVE_ABI,
      client: client as Client,
    });

    const [name, symbol, underlyingToken] = await client.multicall({
      contracts: [
        { ...contract, functionName: "name" },
        { ...contract, functionName: "symbol" },
        { ...contract, functionName: "UNDERLYING_ASSET_ADDRESS" },
      ],
    });

    const newAavePool: AavePool = {
      id: poolAddress.toLowerCase(),
      address: poolAddress.toLowerCase(),
      underlyingToken: underlyingToken.result as Address,
      name: name.result as string,
      symbol: symbol.result as string,
      lastIndex: 0n,
    };

    context.PoolRegistry.set({
      id: poolAddress.toLowerCase(),
      protocol: "Aave",
      pool: poolAddress.toLowerCase(),
    });
    context.AavePool.set(newAavePool);

    return newAavePool;
  }
}

function setHistoricalAaveEarnBalance(
  accountObject: AaveEarnBalance_t,
  context: handlerContext,
  timestamp: number
) {
  context.HistoricalAaveEarnBalance4Hours.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 3600 * 4),
    timestamp: BigInt(roundTimestamp(timestamp, 3600 * 4)),
  });
  context.HistoricalAaveEarnBalance1Day.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400),
    timestamp: BigInt(roundTimestamp(timestamp, 86400)),
  });
  context.HistoricalAaveEarnBalance7Days.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalAaveEarnBalance1Month.set({
    ...accountObject,
    id: accountObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
}
