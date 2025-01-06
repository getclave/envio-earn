open Types

/**
The context holds all the state for a given events loader and handler.
*/
type t = {
  logger: Pino.t,
  eventItem: Internal.eventItem,
  addedDynamicContractRegistrations: array<TablesStatic.DynamicContractRegistry.t>,
}

let getUserLogger = (logger): Logs.userLogger => {
  info: (message: string) => logger->Logging.uinfo(message),
  debug: (message: string) => logger->Logging.udebug(message),
  warn: (message: string) => logger->Logging.uwarn(message),
  error: (message: string) => logger->Logging.uerror(message),
  errorWithExn: (exn: option<Js.Exn.t>, message: string) =>
    logger->Logging.uerrorWithExn(exn, message),
}

let makeEventIdentifier = (
  eventItem: Internal.eventItem,
): Types.eventIdentifier => {
  let {event, blockNumber, timestamp} = eventItem
  {
    chainId: event.chainId,
    blockTimestamp: timestamp,
    blockNumber,
    logIndex: event.logIndex,
  }
}

let getEventId = (eventItem: Internal.eventItem) => {
  EventUtils.packEventIndex(
    ~blockNumber=eventItem.blockNumber,
    ~logIndex=eventItem.event.logIndex,
  )
}

let make = (~eventItem: Internal.eventItem, ~logger) => {
  let {event, chain, eventName, contractName, blockNumber} = eventItem
  let logger = logger->(
    Logging.createChildFrom(
      ~logger=_,
      ~params={
        "context": `Event '${eventName}' for contract '${contractName}'`,
        "chainId": chain->ChainMap.Chain.toChainId,
        "block": blockNumber,
        "logIndex": event.logIndex,
      },
    )
  )

  {
    logger,
    eventItem,
    addedDynamicContractRegistrations: [],
  }
}

let getAddedDynamicContractRegistrations = (contextEnv: t) =>
  contextEnv.addedDynamicContractRegistrations

let makeDynamicContractId = (~chainId, ~contractAddress) => {
  chainId->Belt.Int.toString ++ "-" ++ contractAddress->Address.toString
}
let makeDynamicContractRegisterFn = (
  ~contextEnv: t,
  ~contractName,
  ~inMemoryStore,
  ~shouldSaveHistory,
) => (contractAddress: Address.t) => {
   
  // Even though it's the Address.t type on ReScript side, for TS side it's a string.
  // So we need to ensure that it's a valid checksummed address.
  let contractAddress = contractAddress->Address.Evm.fromAddressOrThrow

  let {eventItem, addedDynamicContractRegistrations} = contextEnv
  let {chain, timestamp, blockNumber, logIndex} = eventItem

  let chainId = chain->ChainMap.Chain.toChainId
  let dynamicContractRegistration: TablesStatic.DynamicContractRegistry.t = {
    id: makeDynamicContractId(~chainId, ~contractAddress),
    chainId,
    registeringEventBlockNumber: blockNumber,
    registeringEventLogIndex: logIndex,
    registeringEventName: eventItem.eventName,
    registeringEventContractName: eventItem.contractName,
    registeringEventSrcAddress: eventItem.event.srcAddress,
    registeringEventBlockTimestamp: timestamp,
    contractAddress,
    contractType: contractName,
  }

  addedDynamicContractRegistrations->Js.Array2.push(dynamicContractRegistration)->ignore

  let eventIdentifier: Types.eventIdentifier = {
    chainId,
    blockTimestamp: timestamp,
    blockNumber,
    logIndex,
  }

  inMemoryStore.InMemoryStore.entities
  ->InMemoryStore.EntityTables.get(module(TablesStatic.DynamicContractRegistry))
  ->InMemoryTable.Entity.set(
    Set(dynamicContractRegistration)->Types.mkEntityUpdate(
      ~eventIdentifier,
      ~entityId=dynamicContractRegistration.id,
    ),
    ~shouldSaveHistory,
  )
}

let makeWhereLoader = (
  loadLayer,
  ~entityMod,
  ~inMemoryStore,
  ~fieldName,
  ~fieldValueSchema,
  ~logger,
) => {
  Entities.eq: loadLayer->LoadLayer.makeWhereEqLoader(
    ~entityMod,
    ~fieldName,
    ~fieldValueSchema,
    ~inMemoryStore,
    ~logger,
  ),
}

let makeEntityHandlerContext = (
  type entity,
  ~eventIdentifier,
  ~inMemoryStore,
  ~entityMod: module(Entities.Entity with type t = entity),
  ~logger,
  ~getKey,
  ~loadLayer,
  ~shouldSaveHistory,
): entityHandlerContext<entity> => {
  let inMemTable = inMemoryStore->InMemoryStore.getInMemTable(~entityMod)
  {
    set: entity => {
      inMemTable->InMemoryTable.Entity.set(
        Set(entity)->Types.mkEntityUpdate(~eventIdentifier, ~entityId=getKey(entity)),
        ~shouldSaveHistory,
      )
    },
    deleteUnsafe: entityId => {
      inMemTable->InMemoryTable.Entity.set(
        Delete->Types.mkEntityUpdate(~eventIdentifier, ~entityId),
        ~shouldSaveHistory,
      )
    },
    get: loadLayer->LoadLayer.makeLoader(~entityMod, ~logger, ~inMemoryStore),
  }
}

let getContractRegisterContext = (contextEnv, ~inMemoryStore, ~shouldSaveHistory) => {
  //TODO only add contracts we've registered for the event in the config
  addClaggMain:  makeDynamicContractRegisterFn(~contextEnv, ~inMemoryStore, ~contractName=ClaggMain, ~shouldSaveHistory),
  addERC20:  makeDynamicContractRegisterFn(~contextEnv, ~inMemoryStore, ~contractName=ERC20, ~shouldSaveHistory),
  addSyncswapMaster:  makeDynamicContractRegisterFn(~contextEnv, ~inMemoryStore, ~contractName=SyncswapMaster, ~shouldSaveHistory),
}->(Utils.magic: Types.contractRegistrations => Internal.contractRegisterContext)

let getLoaderContext = (contextEnv: t, ~inMemoryStore: InMemoryStore.t, ~loadLayer: LoadLayer.t) => {
  let {logger} = contextEnv
  {
    log: logger->getUserLogger,
    accountClaggPosition: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.AccountClaggPosition),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        claggPool_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountClaggPosition),
          ~inMemoryStore,
          ~fieldName="claggPool_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        userAddress: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountClaggPosition),
          ~inMemoryStore,
          ~fieldName="userAddress",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    accountIdleBalance: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.AccountIdleBalance),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        address: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountIdleBalance),
          ~inMemoryStore,
          ~fieldName="address",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        token_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountIdleBalance),
          ~inMemoryStore,
          ~fieldName="token_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    accountSyncswapPosition: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.AccountSyncswapPosition),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        syncswapPool_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountSyncswapPosition),
          ~inMemoryStore,
          ~fieldName="syncswapPool_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        userAddress: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountSyncswapPosition),
          ~inMemoryStore,
          ~fieldName="userAddress",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    accountVenusPosition: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.AccountVenusPosition),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        userAddress: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountVenusPosition),
          ~inMemoryStore,
          ~fieldName="userAddress",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        venusPool_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.AccountVenusPosition),
          ~inMemoryStore,
          ~fieldName="venusPool_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    claggAdapter: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.ClaggAdapter),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        address: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ClaggAdapter),
          ~inMemoryStore,
          ~fieldName="address",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    claggPool: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.ClaggPool),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        address: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ClaggPool),
          ~inMemoryStore,
          ~fieldName="address",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        underlyingToken_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.ClaggPool),
          ~inMemoryStore,
          ~fieldName="underlyingToken_id",
          ~fieldValueSchema=S.null(S.string),
          ~logger,
        ),
      
      },
    },
    historicalAccountIdleBalance: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.HistoricalAccountIdleBalance),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        address: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.HistoricalAccountIdleBalance),
          ~inMemoryStore,
          ~fieldName="address",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        timestamp: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.HistoricalAccountIdleBalance),
          ~inMemoryStore,
          ~fieldName="timestamp",
          ~fieldValueSchema=BigInt.schema,
          ~logger,
        ),
      
        token_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.HistoricalAccountIdleBalance),
          ~inMemoryStore,
          ~fieldName="token_id",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
      },
    },
    syncswapPool: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.SyncswapPool),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        address: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.SyncswapPool),
          ~inMemoryStore,
          ~fieldName="address",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        underlyingToken_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.SyncswapPool),
          ~inMemoryStore,
          ~fieldName="underlyingToken_id",
          ~fieldValueSchema=S.null(S.string),
          ~logger,
        ),
      
        underlyingToken2_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.SyncswapPool),
          ~inMemoryStore,
          ~fieldName="underlyingToken2_id",
          ~fieldValueSchema=S.null(S.string),
          ~logger,
        ),
      
      },
    },
    token: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.Token),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
      },
    },
    venusPool: {
      get: loadLayer->LoadLayer.makeLoader(
        ~entityMod=module(Entities.VenusPool),
        ~inMemoryStore,
        ~logger,
      ),
      getWhere: {
        
        address: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.VenusPool),
          ~inMemoryStore,
          ~fieldName="address",
          ~fieldValueSchema=S.string,
          ~logger,
        ),
      
        underlyingToken_id: loadLayer->makeWhereLoader(
          ~entityMod=module(Entities.VenusPool),
          ~inMemoryStore,
          ~fieldName="underlyingToken_id",
          ~fieldValueSchema=S.null(S.string),
          ~logger,
        ),
      
      },
    },
  }->(Utils.magic: Types.loaderContext => Internal.loaderContext)
}

let getHandlerContext = (
  context,
  ~inMemoryStore: InMemoryStore.t,
  ~loadLayer,
  ~shouldSaveHistory,
) => {
  let {eventItem, logger} = context

  let eventIdentifier = eventItem->makeEventIdentifier
  {
    log: logger->getUserLogger,
    accountClaggPosition: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.AccountClaggPosition),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    accountIdleBalance: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.AccountIdleBalance),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    accountSyncswapPosition: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.AccountSyncswapPosition),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    accountVenusPosition: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.AccountVenusPosition),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    claggAdapter: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.ClaggAdapter),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    claggPool: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.ClaggPool),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    historicalAccountIdleBalance: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.HistoricalAccountIdleBalance),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    syncswapPool: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.SyncswapPool),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    token: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.Token),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
    venusPool: makeEntityHandlerContext(
      ~eventIdentifier,
      ~inMemoryStore,
      ~entityMod=module(Entities.VenusPool),
      ~getKey=entity => entity.id,
      ~logger,
      ~loadLayer,
      ~shouldSaveHistory,
    ),
  }->(Utils.magic: Types.handlerContext => Internal.handlerContext)
}

let getContractRegisterArgs = (contextEnv, ~inMemoryStore, ~shouldSaveHistory): Internal.contractRegisterArgs => {
  event: contextEnv.eventItem.event,
  context: contextEnv->getContractRegisterContext(~inMemoryStore, ~shouldSaveHistory),
}

let getLoaderArgs = (contextEnv, ~inMemoryStore, ~loadLayer): Internal.loaderArgs => {
  event: contextEnv.eventItem.event,
  context: contextEnv->getLoaderContext(~inMemoryStore, ~loadLayer),
}

let getHandlerArgs = (
  contextEnv,
  ~inMemoryStore,
  ~loaderReturn,
  ~loadLayer,
  ~shouldSaveHistory,
): Internal.handlerArgs => {
  event: contextEnv.eventItem.event,
  context: contextEnv->getHandlerContext(~inMemoryStore, ~loadLayer, ~shouldSaveHistory),
  loaderReturn,
}
