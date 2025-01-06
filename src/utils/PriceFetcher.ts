import { ERC20_Transfer_event, handlerContext, Token } from "generated";
import { zeroAddress } from "viem";

const THRESHOLD_BLOCK_NUMBER = 52500000;

export const TOKEN_ADDRESS = {
  ETHER: "0x000000000000000000000000000000000000800a",
  WRAPPED_ETHER: "0x5aea5775959fbc2557cc8789bc1bf90a239d9a91",
  USDC: "0x1d17cbcf0d6d143135ae902365d2e5e2a16538d4",
  BRIDGED_USDC: "0x3355df6d4c9c3035724fd0e3914de96a5a83aaf4",
  DAI: "0x4b9eb6c0b6ea15176bbf62841c6b2a8a398cb656",
  USDT: "0x493257fd37edb34451f62edf8d2a0c418852ba4c",
};

export const TokensToFetchPrice = new Set<Partial<Token>>();

export type PriceResponse = {
  currencyId: string;
  tokenPrices: Record<string, number>;
};

class PriceFetcher {
  ODOS_BASE_URL = "https://api.odos.xyz/pricing/token";
  latestHandledBlock = 0;
  syncInterval = 300;
  asyncInterval = 100000;

  public async genOdosTokenPrices(
    context: handlerContext,
    event: ERC20_Transfer_event
  ): Promise<void> {
    const interval =
      event.block.number > THRESHOLD_BLOCK_NUMBER ? this.syncInterval : this.asyncInterval;
    if (event.block.number <= this.latestHandledBlock + interval) {
      return;
    }
    if (TokensToFetchPrice.size == 0) {
      return;
    }

    this.latestHandledBlock = event.block.number;

    const tokenList = Array.from(TokensToFetchPrice);

    const chainId = 324;

    context.log.info("fetching prices for " + tokenList.flat());
    // Map token addresses to query
    const chainSpecificTokenAddresses = tokenList.map((item) =>
      item.id == TOKEN_ADDRESS.ETHER ? zeroAddress : item.id
    );
    // Prepare request url
    const tokenAddressesQuery = chainSpecificTokenAddresses.join("&token_addresses=");
    const requestUrl = `${this.ODOS_BASE_URL}/${chainId}?token_addresses=${tokenAddressesQuery}`;
    const odosData: PriceResponse = (await fetch(requestUrl).then((res) =>
      res.json()
    )) as PriceResponse;
    // Replace zero address with eth address
    const odosTokenPrices = odosData.tokenPrices;
    odosTokenPrices[TOKEN_ADDRESS.ETHER] = odosTokenPrices[zeroAddress];

    let lowerCaseResponse: PriceResponse["tokenPrices"] = {};
    Object.keys(odosTokenPrices).forEach((key) => {
      lowerCaseResponse[key.trim().toLowerCase()] = odosTokenPrices[key];
    });
    lowerCaseResponse = this.handleStablePrices(lowerCaseResponse);
    const lowercaseResponse = lowerCaseResponse;
    Object.keys(lowercaseResponse).forEach(async (address) => {
      const token = await context.Token.get(address);
      if (token && typeof lowercaseResponse[address] === "number") {
        const tokenObject: Token = {
          id: token.id,
          name: token.name,
          symbol: token.symbol,
          decimals: token.decimals,
          price: lowercaseResponse[address],
        };
        context.Token.set(tokenObject);
        context.log.info("set token " + tokenObject.name + " price " + tokenObject.price);
      }
    });
  }

  private handleStablePrices = (
    lowerCaseResponse: Record<string, number>
  ): Record<string, number> => {
    const stableAddresses = [
      TOKEN_ADDRESS.USDC,
      TOKEN_ADDRESS.BRIDGED_USDC,
      TOKEN_ADDRESS.DAI,
      TOKEN_ADDRESS.USDT,
    ];

    stableAddresses.forEach((address) => {
      if (lowerCaseResponse[address] == null) {
        lowerCaseResponse[address] = 1;
      } else {
        // Check the price margin and set to 1 if it is too low
        if (Math.abs(lowerCaseResponse[address] - 1) <= 0.005) {
          lowerCaseResponse[address] = 1;
        }
      }
    });
    return lowerCaseResponse;
  };
}

export const priceFetcher = new PriceFetcher();
