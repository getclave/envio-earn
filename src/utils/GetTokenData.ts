import { Address, erc20Abi } from "viem";
import { client } from "../viem/Client";
import { getContract } from "viem";
import { handlerContext, Token } from "generated";

const getTokenData = async (tokenAddress: string) => {
  const tokenContract = getContract({
    address: tokenAddress as Address,
    abi: erc20Abi,
    client,
  });

  const results = await client.multicall({
    contracts: [
      {
        ...tokenContract,
        functionName: "name",
      },
      {
        ...tokenContract,
        functionName: "symbol",
      },
      {
        ...tokenContract,
        functionName: "decimals",
      },
    ],
  });

  const name = results[0];
  const symbol = results[1];
  const decimals = results[2];

  return { name, symbol, decimals };
};

export const getOrCreateToken = async (tokenAddress: string, context: handlerContext) => {
  const token = await context.Token.get(tokenAddress.toLowerCase());
  if (token != undefined && token.name != undefined) {
    return token;
  }

  const tokenData = await getTokenData(tokenAddress);

  const tokenObject: Token = {
    id: tokenAddress.toLowerCase(),
    name: tokenData.name.result,
    symbol: tokenData.symbol.result,
    decimals: tokenData.decimals.result,
  };

  context.Token.set(tokenObject);

  return tokenObject;
};
