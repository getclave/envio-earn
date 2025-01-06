import { Address, erc20Abi } from "viem";
import { client } from "./Client";
import { getContract } from "viem";
import { handlerContext, Token } from "generated";
import { TokensToFetchPrice } from "../utils/PriceFetcher";

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

export const getOrCreateToken = async (
  tokenAddress: string,
  context: handlerContext,
  token?: Token
) => {
  if (token != undefined && token.name != undefined) {
    return token;
  }

  const tokenData = await getTokenData(tokenAddress);

  const tokenObject: Token = {
    id: tokenAddress.toLowerCase(),
    name: tokenData.name.result,
    symbol: tokenData.symbol.result,
    decimals: tokenData.decimals.result,
    price: 0,
  };
  context.log.info("writing new token " + tokenObject.name + " " + tokenObject.id);
  context.Token.set(tokenObject);

  TokensToFetchPrice.add(tokenObject);

  return tokenObject;
};
