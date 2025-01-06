import { AccountClaggPosition, ClaggMain, ClaggPool } from "generated";
import { AccountClaggPosition_t, ClaggPool_t } from "generated/src/db/Entities.gen";
import { ClaggAdaptersToAskPools, ClaggPoolsToFetchShare } from "./utils/ClaggFetcher";
import { Address, decodeFunctionResult, encodeFunctionData, zeroAddress } from "viem";
import { ClaggAdapterABI } from "./abi/ClaggAdapter";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./viem/Contract";
import { ClaggMainAddress } from "./constants/ClaggAddresses";

ClaggMain.AdapterAdded.handler(async ({ event, context }) => {
  context.ClaggAdapter.set({
    address: event.params.adapter.toLowerCase(),
    id: event.params.adapter.toLowerCase(),
  });
  ClaggAdaptersToAskPools.add(event.params.adapter.toLowerCase() as Address);
});

ClaggMain.Deposit.handlerWithLoader({
  loader: async ({
    event,
    context,
  }): Promise<{ pool: ClaggPool | undefined; user: AccountClaggPosition | undefined }> => {
    const [pool, user] = await Promise.all([
      context.ClaggPool.get(event.params.pool.toLowerCase()),
      context.AccountClaggPosition.get(event.params.user.toLowerCase()),
    ]);
    return { pool, user };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { pool, user } = loaderReturn;

    if (!pool || pool.adapter_id == null) {
      for (let adapter of Array.from(ClaggAdaptersToAskPools)) {
        try {
          const poolConfigCalldata =
            encodeFunctionData({
              abi: ClaggAdapterABI,
              functionName: "getPoolConfig",
              args: [event.params.pool.toLowerCase()],
            }) + adapter.slice(2);
          const poolConfigResponse = await client.call({
            to: ClaggMainAddress as `0x${string}`,
            data: poolConfigCalldata as `0x${string}`,
          });
          const decodedPoolConfig = decodeFunctionResult({
            abi: ClaggAdapterABI,
            functionName: "getPoolConfig",
            data: poolConfigResponse.data as `0x${string}`,
          }) as { token: string; performanceFee: bigint; nonClaveFee: bigint };
          if (decodedPoolConfig.token != zeroAddress) {
            const token = await context.Token.get(decodedPoolConfig.token.toLowerCase());
            await getOrCreateToken(decodedPoolConfig.token.toLowerCase(), context, token);
            const pool: ClaggPool_t = {
              id: event.params.pool.toLowerCase(),
              address: event.params.pool.toLowerCase(),
              adapter_id: adapter,
              totalLiquidity: 0n,
              totalSupply: 0n,
              underlyingToken_id: decodedPoolConfig.token.toLowerCase(),
            };
            context.log.info("created pool " + pool.id + " with adapter " + adapter);
            context.ClaggPool.set(pool);
            ClaggPoolsToFetchShare.add(event.params.pool.toLowerCase() as Address);
            break;
          }
        } catch (e) {
          console.log(e);
        }
      }
      //TODO Add pool to claggfetcher for calculating sharepertoken
    }
    const createdUser: AccountClaggPosition_t = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        user == undefined ? event.params.shares : user.shareBalance + event.params.shares,
      claggPool_id: pool?.id ?? event.params.pool.toLowerCase(),
    };

    context.AccountClaggPosition.set(createdUser);
  },
});

ClaggMain.Withdraw.handlerWithLoader({
  loader: async ({
    event,
    context,
  }): Promise<{ pool: ClaggPool | undefined; user: AccountClaggPosition | undefined }> => {
    const [pool, user] = await Promise.all([
      context.ClaggPool.get(event.params.pool.toLowerCase()),
      context.AccountClaggPosition.get(event.params.user.toLowerCase()),
    ]);
    return { pool, user };
  },
  handler: async ({ event, context, loaderReturn }) => {
    const { pool, user } = loaderReturn;

    if (!pool) {
      //TODO Ask adapters if pool belongs to them until one returns true
      //TODO Add pool to claggfetcher for calculating sharepertoken
      return;
    }
    const createdUser: AccountClaggPosition_t = {
      id: event.params.user.toLowerCase() + event.params.pool.toLowerCase(),
      userAddress: event.params.user.toLowerCase(),
      shareBalance:
        user == undefined ? 0n - event.params.shares : user.shareBalance - event.params.shares,
      claggPool_id: pool?.id,
    };

    context.AccountClaggPosition.set(createdUser);
  },
});
