import { Address, Client, getContract } from "viem";
import { AaveEarnBalance, AavePool, handlerContext, Aave, Aave_Transfer_event } from "generated";
import { getOrCreateClaggPool, setHistoricalClaggPool } from "./ClaggHandler";
import { walletCache } from "./utils/WalletCache";
import { roundTimestamp } from "./utils/helpers";
import { ClaggMainAddress } from "./constants/ClaggAddresses";
import { client } from "./viem/Client";
import { AaveEarnBalance_t, AavePool_t } from "generated/src/db/Entities.gen";

Aave.Mint.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [userBalance, claveAddresses] = await Promise.all([
      context.AaveEarnBalance.get(event.params.onBehalfOf.toLowerCase()),
      walletCache.bulkCheckClaveWallets([event.params.onBehalfOf.toLowerCase()]),
    ]);

    return { userBalance, claveAddresses };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance, claveAddresses } = loaderReturn;

    if (
      !claveAddresses.has(event.params.onBehalfOf.toLowerCase()) &&
      process.env.NODE_ENV !== "test"
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

    setHistoricalAavePool(adjustedPool, context, event.block.timestamp);

    const previousAaveEarnBalance: AaveEarnBalance = {
      id: event.params.onBehalfOf.toLowerCase() + createdPool.id,
      userAddress: event.params.onBehalfOf.toLowerCase(),
      aavePool_id: createdPool.id,
      userIndex: userBalance ? userBalance.userIndex : 0n,
      shareBalance: userBalance ? userBalance.shareBalance : 0n,
    };

    const aaveEarnBalance: AaveEarnBalance = {
      ...previousAaveEarnBalance,
      userIndex: event.params.index,
    };

    context.AaveEarnBalance.set(aaveEarnBalance);
    setHistoricalAaveEarnBalance(previousAaveEarnBalance, context, event.block.timestamp);
  },
});

Aave.Burn.handlerWithLoader({
  loader: async ({ event, context }) => {
    const [userBalance, claveAddresses] = await Promise.all([
      context.AaveEarnBalance.get(event.params.from.toLowerCase()),
      walletCache.bulkCheckClaveWallets([event.params.from.toLowerCase()]),
    ]);

    return { userBalance, claveAddresses };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { userBalance, claveAddresses } = loaderReturn;

    if (!claveAddresses.has(event.params.from.toLowerCase()) && process.env.NODE_ENV !== "test") {
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

    setHistoricalAavePool(adjustedPool, context, event.block.timestamp);

    const previousAaveEarnBalance: AaveEarnBalance = {
      id: event.params.from.toLowerCase() + createdPool.id,
      userAddress: event.params.from.toLowerCase(),
      aavePool_id: createdPool.id,
      userIndex: userBalance ? userBalance.userIndex : 0n,
      shareBalance: userBalance ? userBalance.shareBalance : 0n,
    };

    const aaveEarnBalance: AaveEarnBalance = {
      ...previousAaveEarnBalance,
      userIndex: event.params.index,
    };

    context.AaveEarnBalance.set(aaveEarnBalance);
    setHistoricalAaveEarnBalance(previousAaveEarnBalance, context, event.block.timestamp);
  },
});

Aave.Transfer.handlerWithLoader({
  loader: async ({ event }) => {
    return {
      claveAddresses: await walletCache.bulkCheckClaveWallets([event.params.from.toLowerCase()]),
    };
  },
  handler: async ({ event, context, loaderReturn }) => {
    let { claveAddresses } = loaderReturn;

    if (process.env.NODE_ENV === "test") {
      claveAddresses = new Set([event.params.from.toLowerCase(), event.params.to.toLowerCase()]);
    }

    if (event.params.from === event.params.to) {
      return;
    }

    if (!claveAddresses || claveAddresses.size === 0) {
      if (!isClaggTransfer(event)) {
        return;
      }
    }

    const pool = await getOrCreateAavePool(event.srcAddress.toLowerCase() as Address, context);

    if (event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply - event.params.value,
      };
      context.ClaggPool.set(adjustedPool);
      setHistoricalClaggPool(adjustedPool, context, event.block.timestamp);
      return;
    }

    if (event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()) {
      const pool = await getOrCreateClaggPool(event.srcAddress.toLowerCase() as Address, context);
      const adjustedPool = {
        ...pool,
        totalSupply: pool.totalSupply + event.params.value,
      };
      context.ClaggPool.set(adjustedPool);
      setHistoricalClaggPool(adjustedPool, context, event.block.timestamp);
      return;
    }

    if (claveAddresses.has(event.params.from.toLowerCase())) {
      context.Account.set({
        id: event.params.from.toLowerCase(),
        address: event.params.from.toLowerCase(),
      });
    }

    if (claveAddresses.has(event.params.to.toLowerCase())) {
      context.Account.set({
        id: event.params.to.toLowerCase(),
        address: event.params.to.toLowerCase(),
      });
    }

    const senderAccountBalance = await context.AaveEarnBalance.get(
      event.params.from.toLowerCase() + pool.id
    );

    const receiverAccountBalance = await context.AaveEarnBalance.get(
      event.params.to.toLowerCase() + pool.id
    );

    if (claveAddresses.has(event.params.from.toLowerCase())) {
      const previousSenderAccountBalance: AaveEarnBalance = {
        id: event.params.from.toLowerCase() + pool.id,
        userAddress: event.params.from.toLowerCase(),
        aavePool_id: pool.id,
        userIndex: senderAccountBalance ? senderAccountBalance.userIndex : 0n,
        shareBalance: senderAccountBalance ? senderAccountBalance.shareBalance : 0n,
      };
      // Update sender's account balance
      const accountObject: AaveEarnBalance = {
        ...previousSenderAccountBalance,
        shareBalance: previousSenderAccountBalance.shareBalance - BigInt(event.params.value),
      };

      context.AaveEarnBalance.set(accountObject);
      setHistoricalAaveEarnBalance(previousSenderAccountBalance, context, event.block.timestamp);
    }

    if (claveAddresses.has(event.params.to.toLowerCase())) {
      const previousReceiverAccountBalance: AaveEarnBalance = {
        id: event.params.to.toLowerCase() + pool.id,
        userAddress: event.params.to.toLowerCase(),
        aavePool_id: pool.id,
        userIndex: receiverAccountBalance ? receiverAccountBalance.userIndex : 0n,
        shareBalance: receiverAccountBalance ? receiverAccountBalance.shareBalance : 0n,
      };
      // Update receiver's account balance
      const accountObject: AaveEarnBalance = {
        ...previousReceiverAccountBalance,
        shareBalance: previousReceiverAccountBalance.shareBalance + BigInt(event.params.value),
      };

      context.AaveEarnBalance.set(accountObject);
      setHistoricalAaveEarnBalance(previousReceiverAccountBalance, context, event.block.timestamp);
    }
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

/**
 * Checks if a transfer event affects Aave pool's total supply
 * @param event The transfer event to check
 * @returns True if the event affects Aave total supply
 */
function isClaggTransfer(event: Aave_Transfer_event) {
  return (
    event.params.from.toLowerCase() == ClaggMainAddress.toLowerCase() ||
    event.params.to.toLowerCase() == ClaggMainAddress.toLowerCase()
  );
}

function setHistoricalAavePool(poolObject: AavePool_t, context: handlerContext, timestamp: number) {
  context.HistoricalAavePoolDaily.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp),
    timestamp: BigInt(roundTimestamp(timestamp)),
  });
  context.HistoricalAavePoolWeekly.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp, 86400 * 7),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 7)),
  });
  context.HistoricalAavePoolMonthly.set({
    ...poolObject,
    id: poolObject.id + roundTimestamp(timestamp, 86400 * 30),
    timestamp: BigInt(roundTimestamp(timestamp, 86400 * 30)),
  });
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
