import { handlerContext } from "generated/src/Types.gen";
import { Address, Client, getContract } from "viem";
import { client } from "../viem/Client";

export async function shareToAmountAave(
  userAddress: Address,
  poolAddress: Address,
  context: handlerContext,
  blockNumber: bigint
) {
  const { pool, balance } = await getPoolAndUserBalance(
    poolAddress,
    context,
    userAddress,
    blockNumber
  );
  return { balance, pool };
}

async function getPoolAndUserBalance(
  poolAddress: Address,
  context: handlerContext,
  userAddress: Address,
  blockNumber: bigint
) {
  const contract = getContract({
    address: poolAddress.toLowerCase() as Address,
    abi: AAVE_ABI,
    client: client as Client,
  });

  const [name, symbol, underlyingToken, balance] = await client.multicall({
    contracts: [
      {
        ...contract,
        functionName: "name",
        args: [],
      },
      {
        ...contract,
        functionName: "symbol",
        args: [],
      },
      {
        ...contract,
        functionName: "UNDERLYING_ASSET_ADDRESS",
        args: [],
      },
      {
        ...contract,
        functionName: "balanceOf",
        args: [userAddress],
      },
    ],
    blockNumber,
  });

  const newAavePool = {
    id: poolAddress.toLowerCase(),
    address: poolAddress.toLowerCase(),
    underlyingToken: underlyingToken.result as Address,
    name: name.result as string,
    symbol: symbol.result as string,
  };

  context.PoolRegistry.set({
    id: poolAddress.toLowerCase(),
    protocol: "Aave",
    pool: poolAddress.toLowerCase(),
    underlyingToken0: underlyingToken.result as Address,
    underlyingToken1: underlyingToken.result as Address,
  });

  return { pool: newAavePool, balance: balance.result as bigint };
}

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
  {
    inputs: [
      {
        internalType: "address",
        name: "",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;
