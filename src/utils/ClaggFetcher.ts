import { ERC20_Transfer_event, handlerContext } from "generated";
import { Address, decodeFunctionResult, encodeFunctionData, getContract } from "viem";
import { client } from "../viem/Client";
import { ClaggAdapterABI } from "../abi/ClaggAdapter";
import { ClaggMainAddress } from "../constants/ClaggAddresses";

const THRESHOLD_BLOCK_NUMBER = 52500000;

export const ClaggPoolsToFetchShare = new Set<Address>();
export const ClaggAdaptersToAskPools = new Set<Address>();

class ClaggShareFetcher {
  latestHandledBlock = 0;
  syncInterval = 300;
  asyncInterval = 100000;

  public async genClaggPoolShares(
    context: handlerContext,
    event: ERC20_Transfer_event
  ): Promise<void> {
    const interval =
      event.block.number > THRESHOLD_BLOCK_NUMBER ? this.syncInterval : this.asyncInterval;
    if (event.block.number <= this.latestHandledBlock + interval) {
      return;
    }
    if (ClaggPoolsToFetchShare.size == 0) {
      return;
    }

    this.latestHandledBlock = event.block.number;

    const poolList = Array.from(ClaggPoolsToFetchShare);
    context.log.info("fetching clagg shares for " + poolList.flat());
    for (let address of poolList) {
      const pool = await context.ClaggPool.get(address);
      if (pool?.adapter_id == null) {
        return;
      }
      const poolInfoCalldata =
        encodeFunctionData({
          abi: ClaggAdapterABI,
          functionName: "getPoolInfo",
          args: [address],
        }) + pool.adapter_id.slice(2);
      const poolInfoResponse = await client.call({
        to: ClaggMainAddress as `0x${string}`,
        data: poolInfoCalldata as `0x${string}`,
      });
      const decodedPoolInfo = decodeFunctionResult({
        abi: ClaggAdapterABI,
        functionName: "getPoolInfo",
        data: poolInfoResponse.data as `0x${string}`,
      }) as { totalLiquidity: bigint; totalSupply: bigint };

      context.ClaggPool.set({
        ...pool,
        totalLiquidity: decodedPoolInfo.totalLiquidity,
        totalSupply: decodedPoolInfo.totalSupply,
      });
    }
  }
}

export const claggShareFetcher = new ClaggShareFetcher();
