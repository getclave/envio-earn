/**
 * GetTokenData.ts
 * Provides utilities for fetching and caching ERC20 token data
 * Handles token metadata retrieval and storage in the database
 */

import { Address, erc20Abi } from "viem";
import { client } from "../viem/Client";
import { getContract } from "viem";
import { handlerContext, Token } from "generated";

/**
 * Fetches token metadata from the blockchain
 * Uses multicall for efficient data retrieval of name, symbol, and decimals
 * @param tokenAddress The address of the ERC20 token
 * @returns Object containing token name, symbol, and decimals
 */
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

/**
 * Gets or creates a token entry in the database
 * Fetches token data from blockchain if not already cached
 * @param tokenAddress The address of the ERC20 token
 * @param context The handler context for database operations
 * @returns Token object with metadata
 */
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
