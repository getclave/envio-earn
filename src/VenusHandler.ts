import { AccountVenusPosition, VenusPool, ERC20_Transfer_event, handlerContext } from "generated";
import { VenusPoolsToFetchShare } from "./utils/VenusShareFetcher";
import { Address, getContract } from "viem";
import { VenusPoolABI } from "./abi/VenusPool";
import { client } from "./viem/Client";
import { getOrCreateToken } from "./viem/Contract";
import { VenusPool_t } from "generated/src/db/Entities.gen";

export const VenusHandler = async ({
  event,
  context,
  loaderReturn,
}: {
  event: ERC20_Transfer_event;
  context: handlerContext;
  loaderReturn: any;
}) => {
  const { claveAddresses } = loaderReturn as {
    claveAddresses: Set<string>;
  };

  const venusPool = await context.VenusPool.get(event.srcAddress.toLowerCase());

  if (venusPool === undefined) {
    const contract = getContract({
      address: event.srcAddress.toLowerCase() as Address,
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

    const token = await context.Token.get((underlyingToken.result as Address).toLowerCase());
    const createdToken = await getOrCreateToken(underlyingToken.result as Address, context, token);

    const newVenusPool: VenusPool_t = {
      id: event.srcAddress.toLowerCase(),
      address: event.srcAddress.toLowerCase(),
      tokenPerShare: 0n,
      underlyingToken_id: createdToken.id,
      name: name.result as string,
      symbol: symbol.result as string,
    };

    context.VenusPool.set(newVenusPool);
    VenusPoolsToFetchShare.add(newVenusPool.address as Address);
  }

  if (claveAddresses.size == 0) {
    return;
  }

  if (event.params.from === event.params.to) {
    return;
  }

  const senderAccount = await context.AccountVenusPosition.get(
    event.params.from.toLowerCase() + event.srcAddress.toLowerCase()
  );
  const receiverAccount = await context.AccountVenusPosition.get(
    event.params.to.toLowerCase() + event.srcAddress.toLowerCase()
  );

  if (claveAddresses.has(event.params.from.toLowerCase())) {
    // create the account
    let accountObject: AccountVenusPosition = {
      id: event.params.from.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        senderAccount == undefined
          ? 0n - event.params.value
          : senderAccount.shareBalance - event.params.value,
      userAddress: event.params.from.toLowerCase(),
      venusPool_id: event.srcAddress.toLowerCase(),
    };

    context.AccountVenusPosition.set(accountObject);
  }

  if (claveAddresses.has(event.params.to.toLowerCase())) {
    // create new account
    let accountObject: AccountVenusPosition = {
      id: event.params.to.toLowerCase() + event.srcAddress.toLowerCase(),
      shareBalance:
        receiverAccount == undefined
          ? event.params.value
          : event.params.value + receiverAccount.shareBalance,
      userAddress: event.params.to.toLowerCase(),
      venusPool_id: event.srcAddress.toLowerCase(),
    };

    context.AccountVenusPosition.set(accountObject);
  }
};
