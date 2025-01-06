//*************
//***ENTITIES**
//*************
@genType.as("Id")
type id = string

@genType
type contractRegistrations = {
  // TODO: only add contracts we've registered for the event in the config
  addClaggMain: (Address.t) => unit,
  addERC20: (Address.t) => unit,
  addSyncswapMaster: (Address.t) => unit,
}

@genType
type entityLoaderContext<'entity, 'indexedFieldOperations> = {
  get: id => promise<option<'entity>>,
  getWhere: 'indexedFieldOperations,
}

@genType
type loaderContext = {
  log: Logs.userLogger,
  @as("AccountClaggPosition") accountClaggPosition: entityLoaderContext<Entities.AccountClaggPosition.t, Entities.AccountClaggPosition.indexedFieldOperations>,
  @as("AccountIdleBalance") accountIdleBalance: entityLoaderContext<Entities.AccountIdleBalance.t, Entities.AccountIdleBalance.indexedFieldOperations>,
  @as("AccountSyncswapPosition") accountSyncswapPosition: entityLoaderContext<Entities.AccountSyncswapPosition.t, Entities.AccountSyncswapPosition.indexedFieldOperations>,
  @as("AccountVenusPosition") accountVenusPosition: entityLoaderContext<Entities.AccountVenusPosition.t, Entities.AccountVenusPosition.indexedFieldOperations>,
  @as("ClaggAdapter") claggAdapter: entityLoaderContext<Entities.ClaggAdapter.t, Entities.ClaggAdapter.indexedFieldOperations>,
  @as("ClaggPool") claggPool: entityLoaderContext<Entities.ClaggPool.t, Entities.ClaggPool.indexedFieldOperations>,
  @as("HistoricalAccountIdleBalance") historicalAccountIdleBalance: entityLoaderContext<Entities.HistoricalAccountIdleBalance.t, Entities.HistoricalAccountIdleBalance.indexedFieldOperations>,
  @as("SyncswapPool") syncswapPool: entityLoaderContext<Entities.SyncswapPool.t, Entities.SyncswapPool.indexedFieldOperations>,
  @as("Token") token: entityLoaderContext<Entities.Token.t, Entities.Token.indexedFieldOperations>,
  @as("VenusPool") venusPool: entityLoaderContext<Entities.VenusPool.t, Entities.VenusPool.indexedFieldOperations>,
}

@genType
type entityHandlerContext<'entity> = {
  get: id => promise<option<'entity>>,
  set: 'entity => unit,
  deleteUnsafe: id => unit,
}


@genType
type handlerContext = {
  log: Logs.userLogger,
  @as("AccountClaggPosition") accountClaggPosition: entityHandlerContext<Entities.AccountClaggPosition.t>,
  @as("AccountIdleBalance") accountIdleBalance: entityHandlerContext<Entities.AccountIdleBalance.t>,
  @as("AccountSyncswapPosition") accountSyncswapPosition: entityHandlerContext<Entities.AccountSyncswapPosition.t>,
  @as("AccountVenusPosition") accountVenusPosition: entityHandlerContext<Entities.AccountVenusPosition.t>,
  @as("ClaggAdapter") claggAdapter: entityHandlerContext<Entities.ClaggAdapter.t>,
  @as("ClaggPool") claggPool: entityHandlerContext<Entities.ClaggPool.t>,
  @as("HistoricalAccountIdleBalance") historicalAccountIdleBalance: entityHandlerContext<Entities.HistoricalAccountIdleBalance.t>,
  @as("SyncswapPool") syncswapPool: entityHandlerContext<Entities.SyncswapPool.t>,
  @as("Token") token: entityHandlerContext<Entities.Token.t>,
  @as("VenusPool") venusPool: entityHandlerContext<Entities.VenusPool.t>,
}

//Re-exporting types for backwards compatability
@genType.as("AccountClaggPosition")
type accountClaggPosition = Entities.AccountClaggPosition.t
@genType.as("AccountIdleBalance")
type accountIdleBalance = Entities.AccountIdleBalance.t
@genType.as("AccountSyncswapPosition")
type accountSyncswapPosition = Entities.AccountSyncswapPosition.t
@genType.as("AccountVenusPosition")
type accountVenusPosition = Entities.AccountVenusPosition.t
@genType.as("ClaggAdapter")
type claggAdapter = Entities.ClaggAdapter.t
@genType.as("ClaggPool")
type claggPool = Entities.ClaggPool.t
@genType.as("HistoricalAccountIdleBalance")
type historicalAccountIdleBalance = Entities.HistoricalAccountIdleBalance.t
@genType.as("SyncswapPool")
type syncswapPool = Entities.SyncswapPool.t
@genType.as("Token")
type token = Entities.Token.t
@genType.as("VenusPool")
type venusPool = Entities.VenusPool.t

type eventIdentifier = {
  chainId: int,
  blockTimestamp: int,
  blockNumber: int,
  logIndex: int,
}

type entityUpdateAction<'entityType> =
  | Set('entityType)
  | Delete

type entityUpdate<'entityType> = {
  eventIdentifier: eventIdentifier,
  entityId: id,
  entityUpdateAction: entityUpdateAction<'entityType>,
}

let mkEntityUpdate = (~eventIdentifier, ~entityId, entityUpdateAction) => {
  entityId,
  eventIdentifier,
  entityUpdateAction,
}

type entityValueAtStartOfBatch<'entityType> =
  | NotSet // The entity isn't in the DB yet
  | AlreadySet('entityType)

type updatedValue<'entityType> = {
  latest: entityUpdate<'entityType>,
  history: array<entityUpdate<'entityType>>,
}

@genType
type inMemoryStoreRowEntity<'entityType> =
  | Updated(updatedValue<'entityType>)
  | InitialReadFromDb(entityValueAtStartOfBatch<'entityType>) // This means there is no change from the db.

//*************
//**CONTRACTS**
//*************

module Transaction = {
  @genType
  type t = {}

  let schema = S.object((_): t => {})
}

module Block = {
  @genType
  type t = {number: int, timestamp: int, hash: string}

  let schema = S.object((s): t => {number: s.field("number", GqlDbCustomTypes.Int.schema), timestamp: s.field("timestamp", GqlDbCustomTypes.Int.schema), hash: s.field("hash", S.string)})

  @get
  external getNumber: Internal.eventBlock => int = "number"

  @get
  external getTimestamp: Internal.eventBlock => int = "timestamp"
 
  @get
  external getId: Internal.eventBlock => string = "hash"

  let cleanUpRawEventFieldsInPlace: Js.Json.t => () = %raw(`fields => {
    delete fields.hash
    delete fields.number
    delete fields.timestamp
  }`)
}

module AggregatedBlock = {
  @genType
  type t = {number: int, timestamp: int, hash: string}
  let schema = S.object((s): t => {number: s.field("number", GqlDbCustomTypes.Int.schema), timestamp: s.field("timestamp", GqlDbCustomTypes.Int.schema), hash: s.field("hash", S.string)})
    ->(Utils.magic: S.t<t> => S.t<Internal.eventBlock>)
}
module AggregatedTransaction = {
  @genType
  type t = {}
  let schema = S.object((_): t => {})
    ->(Utils.magic: S.t<t> => S.t<Internal.eventTransaction>)
}

@genType.as("EventLog")
type eventLog<'params> = Internal.genericEvent<'params, Block.t, Transaction.t>

module SingleOrMultiple: {
  @genType.import(("./bindings/OpaqueTypes", "SingleOrMultiple"))
  type t<'a>
  let normalizeOrThrow: (t<'a>, ~nestedArrayDepth: int=?) => array<'a>
  let single: 'a => t<'a>
  let multiple: array<'a> => t<'a>
} = {
  type t<'a> = Js.Json.t

  external single: 'a => t<'a> = "%identity"
  external multiple: array<'a> => t<'a> = "%identity"
  external castMultiple: t<'a> => array<'a> = "%identity"
  external castSingle: t<'a> => 'a = "%identity"

  exception AmbiguousEmptyNestedArray

  let rec isMultiple = (t: t<'a>, ~nestedArrayDepth): bool =>
    switch t->Js.Json.decodeArray {
    | None => false
    | Some(_arr) if nestedArrayDepth == 0 => true
    | Some([]) if nestedArrayDepth > 0 =>
      AmbiguousEmptyNestedArray->ErrorHandling.mkLogAndRaise(
        ~msg="The given empty array could be interperated as a flat array (value) or nested array. Since it's ambiguous,
        please pass in a nested empty array if the intention is to provide an empty array as a value",
      )
    | Some(arr) => arr->Js.Array2.unsafe_get(0)->isMultiple(~nestedArrayDepth=nestedArrayDepth - 1)
    }

  let normalizeOrThrow = (t: t<'a>, ~nestedArrayDepth=0): array<'a> => {
    if t->isMultiple(~nestedArrayDepth) {
      t->castMultiple
    } else {
      [t->castSingle]
    }
  }
}

module HandlerTypes = {
  @genType
  type args<'eventArgs, 'context> = {
    event: eventLog<'eventArgs>,
    context: 'context,
  }

  @genType
  type contractRegisterArgs<'eventArgs> = Internal.genericContractRegisterArgs<eventLog<'eventArgs>, contractRegistrations>
  @genType
  type contractRegister<'eventArgs> = Internal.genericContractRegister<contractRegisterArgs<'eventArgs>>

  @genType
  type loaderArgs<'eventArgs> = Internal.genericLoaderArgs<eventLog<'eventArgs>, loaderContext>
  @genType
  type loader<'eventArgs, 'loaderReturn> = Internal.genericLoader<loaderArgs<'eventArgs>, 'loaderReturn>

  @genType
  type handlerArgs<'eventArgs, 'loaderReturn> = Internal.genericHandlerArgs<eventLog<'eventArgs>, handlerContext, 'loaderReturn>

  @genType
  type handler<'eventArgs, 'loaderReturn> = Internal.genericHandler<handlerArgs<'eventArgs, 'loaderReturn>>

  @genType
  type loaderHandler<'eventArgs, 'loaderReturn, 'eventFilter> = Internal.genericHandlerWithLoader<
    loader<'eventArgs, 'loaderReturn>,
    handler<'eventArgs, 'loaderReturn>,
    SingleOrMultiple.t<'eventFilter>
  >

  @genType
  type eventConfig<'eventFilter> = {
    wildcard?: bool,
    eventFilters?: SingleOrMultiple.t<'eventFilter>,
    preRegisterDynamicContracts?: bool,
  }

  module EventOptions = {
    type t = {
      isWildcard: bool,
      topicSelections: array<LogSelection.topicSelection>,
      preRegisterDynamicContracts: bool,
    }

    let getDefault = (~topic0) => {
      isWildcard: false,
      topicSelections: [LogSelection.makeTopicSelection(~topic0=[topic0])->Utils.unwrapResultExn],
      preRegisterDynamicContracts: false,
    }

    let make = (
      ~isWildcard,
      ~topicSelections: array<LogSelection.topicSelection>,
      ~preRegisterDynamicContracts,
    ) => {
      let topic0sGrouped = []
      let topicSelectionWithFilters = []
      topicSelections->Belt.Array.forEach(ts =>
        if ts->LogSelection.hasFilters {
          topicSelectionWithFilters->Js.Array2.push(ts)->ignore
        } else {
          ts.topic0->Belt.Array.forEach(topic0 => {
            topic0sGrouped->Js.Array2.push(topic0)->ignore
          })
        }
      )
      let topicSelections = switch topic0sGrouped {
      | [] => topicSelectionWithFilters
      | topic0sGrouped =>
        [
          LogSelection.makeTopicSelection(~topic0=topic0sGrouped)->Utils.unwrapResultExn,
        ]->Belt.Array.concat(topicSelectionWithFilters)
      }

      {
        isWildcard,
        topicSelections,
        preRegisterDynamicContracts,
      }
    }
  }

  module Register: {
    type t
    let make: (~topic0: EvmTypes.Hex.t, ~contractName: string, ~eventName: string) => t
    let setLoaderHandler: (
      t,
      Internal.genericHandlerWithLoader<'loader, 'handler, 'eventFilters>,
      ~getEventOptions: Internal.genericHandlerWithLoader<'loader, 'handler, 'eventFilters> => option<
        EventOptions.t,
      >,
      ~logger: Pino.t=?,
    ) => unit
    let setContractRegister: (
      t,
      Internal.genericContractRegister<Internal.genericContractRegisterArgs<'event, 'context>>,
      ~eventOptions: option<EventOptions.t>,
      ~logger: Pino.t=?,
    ) => unit
    let noopLoader: Internal.genericLoader<'event, ()>
    let getLoader: t => option<Internal.loader>
    let getHandler: t => option<Internal.handler>
    let getContractRegister: t => option<Internal.contractRegister>
    let getEventOptions: t => EventOptions.t
    let hasRegistration: t => bool
  } = {
    type eventFilter
    type handlerWithLoader = Internal.genericHandlerWithLoader<Internal.loader, Internal.handler, SingleOrMultiple.t<eventFilter>>

    type t = {
      contractName: string,
      eventName: string,
      topic0: EvmTypes.Hex.t,
      mutable loaderHandler: option<handlerWithLoader>,
      mutable contractRegister: option<Internal.contractRegister>,
      mutable eventOptions: option<EventOptions.t>,
    }

    let noopLoader = _ => Promise.resolve()

    let getLoader = (t: t) => 
      switch t.loaderHandler {
        | Some({loader}) => {
          if loader === noopLoader->(Utils.magic: Internal.genericLoader<'event, ()> => Internal.loader) {
            None
          } else {
            Some(loader)
          }
        }
        | None => None
      }

    let getHandler = (t: t) => 
      switch t.loaderHandler {
        | Some({handler}) => Some(handler)
        | None => None
      }

    let getContractRegister = (t: t) => t.contractRegister

    let getEventOptions = ({eventOptions, topic0}: t): EventOptions.t =>
      switch eventOptions {
      | Some(eventOptions) => eventOptions
      | None => EventOptions.getDefault(~topic0)
      }

    let hasRegistration = ({loaderHandler, contractRegister}) =>
      loaderHandler->Belt.Option.isSome || contractRegister->Belt.Option.isSome

    let make = (~topic0, ~contractName, ~eventName) => {
      contractName,
      eventName,
      topic0,
      loaderHandler: None,
      contractRegister: None,
      eventOptions: None,
    }

    type eventNamespace = {contractName: string, eventName: string}
    exception DuplicateEventRegistration(eventNamespace)

    let setEventOptions = (t: t, value: EventOptions.t, ~logger=Logging.logger) => {
      switch t.eventOptions {
      | None => t.eventOptions = Some(value)
      | Some(_) =>
        let eventNamespace = {contractName: t.contractName, eventName: t.eventName}
        DuplicateEventRegistration(eventNamespace)->ErrorHandling.mkLogAndRaise(
          ~logger=Logging.createChildFrom(~logger, ~params=eventNamespace),
          ~msg="Duplicate eventOptions in handlers not allowed",
        )
      }
    }

    let setLoaderHandler = (
      t: t,
      value,
      ~getEventOptions,
      ~logger=Logging.logger,
    ) => {
      switch t.loaderHandler {
      | None =>
        t.loaderHandler =
          value
          ->(Utils.magic: Internal.genericHandlerWithLoader<'loader, 'handler, 'eventFilters> => handlerWithLoader)
          ->Some
      | Some(_) =>
        let eventNamespace = {contractName: t.contractName, eventName: t.eventName}
        DuplicateEventRegistration(eventNamespace)->ErrorHandling.mkLogAndRaise(
          ~logger=Logging.createChildFrom(~logger, ~params=eventNamespace),
          ~msg="Duplicate registration of event handlers not allowed",
        )
      }

      switch getEventOptions(value) {
      | Some(eventOptions) => t->setEventOptions(eventOptions, ~logger)
      | None => ()
      }
    }

    let setContractRegister = (
      t: t,
      value,
      ~eventOptions,
      ~logger=Logging.logger,
    ) => {
      switch t.contractRegister {
      | None => t.contractRegister = Some(value->(Utils.magic: Internal.genericContractRegister<Internal.genericContractRegisterArgs<'event, 'context>> => Internal.contractRegister))
      | Some(_) =>
        let eventNamespace = {contractName: t.contractName, eventName: t.eventName}
        DuplicateEventRegistration(eventNamespace)->ErrorHandling.mkLogAndRaise(
          ~logger=Logging.createChildFrom(~logger, ~params=eventNamespace),
          ~msg="Duplicate contractRegister handlers not allowed",
        )
      }
      switch eventOptions {
      | Some(eventOptions) => t->setEventOptions(eventOptions, ~logger)
      | None => ()
      }
    }
  }
}

module type Event = {
  let sighash: string // topic0 for Evm and rb for Fuel receipts
  let topicCount: int // Number of topics for evm, always 0 for fuel
  let name: string
  let contractName: string

  type eventArgs
  type block
  type transaction

  type event = Internal.genericEvent<eventArgs, block, transaction>
  type loader<'loaderReturn> = Internal.genericLoader<Internal.genericLoaderArgs<event, loaderContext>, 'loaderReturn>
  type handler<'loaderReturn> = Internal.genericHandler<Internal.genericHandlerArgs<event, handlerContext, 'loaderReturn>>
  type contractRegister = Internal.genericContractRegister<Internal.genericContractRegisterArgs<event, contractRegistrations>>

  let paramsRawEventSchema: S.schema<eventArgs>
  let blockSchema: S.schema<block>
  let transactionSchema: S.schema<transaction>

  let convertHyperSyncEventArgs: HyperSyncClient.Decoder.decodedEvent => eventArgs
  let handlerRegister: HandlerTypes.Register.t

  type eventFilter
  let getTopicSelection: SingleOrMultiple.t<eventFilter> => array<LogSelection.topicSelection>
}
module type InternalEvent = Event
  with type eventArgs = Internal.eventParams
  and type transaction = Internal.eventTransaction
  and type block = Internal.eventBlock
external eventModToInternal: module(Event with type eventArgs = 'a) => module(InternalEvent) = "%identity"
external eventModWithoutArgTypeToInternal: module(Event) => module(InternalEvent) = "%identity"

let makeEventOptions = (
  type eventFilter,
  eventConfig: option<HandlerTypes.eventConfig<eventFilter>>,
  eventMod: module(Event with type eventFilter = eventFilter),
) => {
  let module(Event) = eventMod
  open Belt
  eventConfig->Option.map(({?wildcard, ?eventFilters, ?preRegisterDynamicContracts}) =>
    HandlerTypes.EventOptions.make(
      ~isWildcard=wildcard->Option.getWithDefault(false),
      ~topicSelections=eventFilters->Option.mapWithDefault(
        [
          LogSelection.makeTopicSelection(
            ~topic0=[Event.sighash->EvmTypes.Hex.fromStringUnsafe],
          )->Utils.unwrapResultExn,
        ],
        v => v->Event.getTopicSelection,
      ),
      ~preRegisterDynamicContracts=preRegisterDynamicContracts->Option.getWithDefault(false),
    )
  )
}

let makeGetEventOptions = (
  type eventFilter eventArgs,
  eventMod: module(Event with type eventFilter = eventFilter and type eventArgs = eventArgs),
) => {
  open Belt
  let module(Event) = eventMod
  (loaderHandler: Internal.genericHandlerWithLoader<'loader, 'handler, SingleOrMultiple.t<Event.eventFilter>>) =>
    switch loaderHandler {
    | {wildcard: ?None, eventFilters: ?None, preRegisterDynamicContracts: ?None} => None
    | {?wildcard, ?eventFilters, ?preRegisterDynamicContracts} =>
      let topicSelections =
        eventFilters->Option.mapWithDefault(
          [
            LogSelection.makeTopicSelection(
              ~topic0=[Event.sighash->EvmTypes.Hex.fromStringUnsafe],
            )->Utils.unwrapResultExn,
          ],
          v => v->Event.getTopicSelection,
        )
      HandlerTypes.EventOptions.make(
        ~isWildcard=wildcard->Option.getWithDefault(false),
        ~topicSelections,
        ~preRegisterDynamicContracts=preRegisterDynamicContracts->Option.getWithDefault(false),
      )->Some
    }
}

@genType.import(("./bindings/OpaqueTypes.ts", "HandlerWithOptions"))
type fnWithEventConfig<'fn, 'eventConfig> = ('fn, ~eventConfig: 'eventConfig=?) => unit

@genType
type handlerWithOptions<'eventArgs, 'loaderReturn, 'eventFilter> = fnWithEventConfig<
  HandlerTypes.handler<'eventArgs, 'loaderReturn>,
  HandlerTypes.eventConfig<'eventFilter>,
>

@genType
type contractRegisterWithOptions<'eventArgs, 'eventFilter> = fnWithEventConfig<
  HandlerTypes.contractRegister<'eventArgs>,
  HandlerTypes.eventConfig<'eventFilter>,
>

module MakeRegister = (Event: Event) => {
  let handler: fnWithEventConfig<
    Event.handler<unit>,
    HandlerTypes.eventConfig<Event.eventFilter>,
  > = (
    handler,
    ~eventConfig=?,
  ) => {
    Event.handlerRegister->HandlerTypes.Register.setLoaderHandler(
      {
        loader: HandlerTypes.Register.noopLoader,
        handler,
        wildcard: ?eventConfig->Belt.Option.flatMap(c => c.wildcard),
        eventFilters: ?eventConfig->Belt.Option.flatMap(c => c.eventFilters),
        preRegisterDynamicContracts: ?eventConfig->Belt.Option.flatMap(c =>
          c.preRegisterDynamicContracts
        ),
      },
      ~getEventOptions=makeGetEventOptions(module(Event)),
    )
  }

  let contractRegister: fnWithEventConfig<
    Event.contractRegister,
    HandlerTypes.eventConfig<Event.eventFilter>,
  > = (
    contractRegister,
    ~eventConfig=?,
  ) =>
    Event.handlerRegister->HandlerTypes.Register.setContractRegister(
      contractRegister,
      ~eventOptions=makeEventOptions(eventConfig, module(Event)),
    )

  let handlerWithLoader = (args: Internal.genericHandlerWithLoader<
    Event.loader<'loaderReturn>, Event.handler<'loaderReturn>, SingleOrMultiple.t<Event.eventFilter>
  >) =>
    Event.handlerRegister->HandlerTypes.Register.setLoaderHandler(
      args,
      ~getEventOptions=makeGetEventOptions(module(Event)),
    )
}

module ClaggMain = {
let abi = Ethers.makeAbi((%raw(`[{"type":"event","name":"AdapterAdded","inputs":[{"name":"adapter","type":"address","indexed":true}],"anonymous":false},{"type":"event","name":"Deposit","inputs":[{"name":"user","type":"address","indexed":true},{"name":"pool","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"shares","type":"uint256","indexed":false}],"anonymous":false},{"type":"event","name":"Withdraw","inputs":[{"name":"user","type":"address","indexed":true},{"name":"pool","type":"address","indexed":true},{"name":"amount","type":"uint256","indexed":false},{"name":"shares","type":"uint256","indexed":false}],"anonymous":false}]`): Js.Json.t))
let eventSignatures = ["AdapterAdded(address indexed adapter)", "Deposit(address indexed user, address indexed pool, uint256 amount, uint256 shares)", "Withdraw(address indexed user, address indexed pool, uint256 amount, uint256 shares)"]
let contractName = "ClaggMain"

module AdapterAdded = {

let sighash = "0xcf9c2c7f9adbb156bd76affb04df84595f8f5e69cab2e61221b05b05a902fa26"
let topicCount = 2
let name = "AdapterAdded"
let contractName = contractName

@genType
type eventArgs = {adapter: Address.t}
@genType
type block = Block.t
@genType
type transaction = Transaction.t

@genType
type event = Internal.genericEvent<eventArgs, block, transaction>
@genType
type loader<'loaderReturn> = Internal.genericLoader<Internal.genericLoaderArgs<event, loaderContext>, 'loaderReturn>
@genType
type handler<'loaderReturn> = Internal.genericHandler<Internal.genericHandlerArgs<event, handlerContext, 'loaderReturn>>
@genType
type contractRegister = Internal.genericContractRegister<Internal.genericContractRegisterArgs<event, contractRegistrations>>

let paramsRawEventSchema = S.object((s): eventArgs => {adapter: s.field("adapter", Address.schema)})
let blockSchema = Block.schema
let transactionSchema = Transaction.schema

let convertHyperSyncEventArgs = (decodedEvent: HyperSyncClient.Decoder.decodedEvent): eventArgs => {
      {
        adapter: decodedEvent.indexed->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
      }
    }

let handlerRegister: HandlerTypes.Register.t = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = { @as("adapter") adapter?: SingleOrMultiple.t<Address.t> }

let getTopicSelection = (eventFilters) => eventFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(_eventFilter => LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe], ~topic1=?_eventFilter.adapter->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), )->Utils.unwrapResultExn)

}

module Deposit = {

let sighash = "0xdcbc1c05240f31ff3ad067ef1ee35ce4997762752e3a095284754544f4c709d7"
let topicCount = 3
let name = "Deposit"
let contractName = contractName

@genType
type eventArgs = {user: Address.t, pool: Address.t, amount: bigint, shares: bigint}
@genType
type block = Block.t
@genType
type transaction = Transaction.t

@genType
type event = Internal.genericEvent<eventArgs, block, transaction>
@genType
type loader<'loaderReturn> = Internal.genericLoader<Internal.genericLoaderArgs<event, loaderContext>, 'loaderReturn>
@genType
type handler<'loaderReturn> = Internal.genericHandler<Internal.genericHandlerArgs<event, handlerContext, 'loaderReturn>>
@genType
type contractRegister = Internal.genericContractRegister<Internal.genericContractRegisterArgs<event, contractRegistrations>>

let paramsRawEventSchema = S.object((s): eventArgs => {user: s.field("user", Address.schema), pool: s.field("pool", Address.schema), amount: s.field("amount", BigInt.schema), shares: s.field("shares", BigInt.schema)})
let blockSchema = Block.schema
let transactionSchema = Transaction.schema

let convertHyperSyncEventArgs = (decodedEvent: HyperSyncClient.Decoder.decodedEvent): eventArgs => {
      {
        user: decodedEvent.indexed->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        pool: decodedEvent.indexed->Js.Array2.unsafe_get(1)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        amount: decodedEvent.body->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        shares: decodedEvent.body->Js.Array2.unsafe_get(1)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
      }
    }

let handlerRegister: HandlerTypes.Register.t = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = { @as("user") user?: SingleOrMultiple.t<Address.t>, @as("pool") pool?: SingleOrMultiple.t<Address.t> }

let getTopicSelection = (eventFilters) => eventFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(_eventFilter => LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe], ~topic1=?_eventFilter.user->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), ~topic2=?_eventFilter.pool->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), )->Utils.unwrapResultExn)

}

module Withdraw = {

let sighash = "0xf341246adaac6f497bc2a656f546ab9e182111d630394f0c57c710a59a2cb567"
let topicCount = 3
let name = "Withdraw"
let contractName = contractName

@genType
type eventArgs = {user: Address.t, pool: Address.t, amount: bigint, shares: bigint}
@genType
type block = Block.t
@genType
type transaction = Transaction.t

@genType
type event = Internal.genericEvent<eventArgs, block, transaction>
@genType
type loader<'loaderReturn> = Internal.genericLoader<Internal.genericLoaderArgs<event, loaderContext>, 'loaderReturn>
@genType
type handler<'loaderReturn> = Internal.genericHandler<Internal.genericHandlerArgs<event, handlerContext, 'loaderReturn>>
@genType
type contractRegister = Internal.genericContractRegister<Internal.genericContractRegisterArgs<event, contractRegistrations>>

let paramsRawEventSchema = S.object((s): eventArgs => {user: s.field("user", Address.schema), pool: s.field("pool", Address.schema), amount: s.field("amount", BigInt.schema), shares: s.field("shares", BigInt.schema)})
let blockSchema = Block.schema
let transactionSchema = Transaction.schema

let convertHyperSyncEventArgs = (decodedEvent: HyperSyncClient.Decoder.decodedEvent): eventArgs => {
      {
        user: decodedEvent.indexed->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        pool: decodedEvent.indexed->Js.Array2.unsafe_get(1)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        amount: decodedEvent.body->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        shares: decodedEvent.body->Js.Array2.unsafe_get(1)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
      }
    }

let handlerRegister: HandlerTypes.Register.t = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = { @as("user") user?: SingleOrMultiple.t<Address.t>, @as("pool") pool?: SingleOrMultiple.t<Address.t> }

let getTopicSelection = (eventFilters) => eventFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(_eventFilter => LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe], ~topic1=?_eventFilter.user->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), ~topic2=?_eventFilter.pool->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), )->Utils.unwrapResultExn)

}
}

module ERC20 = {
let abi = Ethers.makeAbi((%raw(`[{"type":"event","name":"Transfer","inputs":[{"name":"from","type":"address","indexed":true},{"name":"to","type":"address","indexed":true},{"name":"value","type":"uint256","indexed":false}],"anonymous":false}]`): Js.Json.t))
let eventSignatures = ["Transfer(address indexed from, address indexed to, uint256 value)"]
let contractName = "ERC20"

module Transfer = {

let sighash = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
let topicCount = 3
let name = "Transfer"
let contractName = contractName

@genType
type eventArgs = {from: Address.t, to: Address.t, value: bigint}
@genType
type block = Block.t
@genType
type transaction = Transaction.t

@genType
type event = Internal.genericEvent<eventArgs, block, transaction>
@genType
type loader<'loaderReturn> = Internal.genericLoader<Internal.genericLoaderArgs<event, loaderContext>, 'loaderReturn>
@genType
type handler<'loaderReturn> = Internal.genericHandler<Internal.genericHandlerArgs<event, handlerContext, 'loaderReturn>>
@genType
type contractRegister = Internal.genericContractRegister<Internal.genericContractRegisterArgs<event, contractRegistrations>>

let paramsRawEventSchema = S.object((s): eventArgs => {from: s.field("from", Address.schema), to: s.field("to", Address.schema), value: s.field("value", BigInt.schema)})
let blockSchema = Block.schema
let transactionSchema = Transaction.schema

let convertHyperSyncEventArgs = (decodedEvent: HyperSyncClient.Decoder.decodedEvent): eventArgs => {
      {
        from: decodedEvent.indexed->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        to: decodedEvent.indexed->Js.Array2.unsafe_get(1)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        value: decodedEvent.body->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
      }
    }

let handlerRegister: HandlerTypes.Register.t = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = { @as("from") from?: SingleOrMultiple.t<Address.t>, @as("to") to?: SingleOrMultiple.t<Address.t> }

let getTopicSelection = (eventFilters) => eventFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(_eventFilter => LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe], ~topic1=?_eventFilter.from->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), ~topic2=?_eventFilter.to->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), )->Utils.unwrapResultExn)

}
}

module SyncswapMaster = {
let abi = Ethers.makeAbi((%raw(`[{"type":"event","name":"RegisterPool","inputs":[{"name":"factory","type":"address","indexed":true},{"name":"pool","type":"address","indexed":true},{"name":"poolType","type":"uint16","indexed":true},{"name":"data","type":"bytes","indexed":false}],"anonymous":false}]`): Js.Json.t))
let eventSignatures = ["RegisterPool(address indexed factory, address indexed pool, uint16 indexed poolType, bytes data)"]
let contractName = "SyncswapMaster"

module RegisterPool = {

let sighash = "0x4318beca5ca4f759b99c1f5f581fa8255b077a82e4c07f17213c471af5a0f56a"
let topicCount = 4
let name = "RegisterPool"
let contractName = contractName

@genType
type eventArgs = {factory: Address.t, pool: Address.t, poolType: bigint, data: string}
@genType
type block = Block.t
@genType
type transaction = Transaction.t

@genType
type event = Internal.genericEvent<eventArgs, block, transaction>
@genType
type loader<'loaderReturn> = Internal.genericLoader<Internal.genericLoaderArgs<event, loaderContext>, 'loaderReturn>
@genType
type handler<'loaderReturn> = Internal.genericHandler<Internal.genericHandlerArgs<event, handlerContext, 'loaderReturn>>
@genType
type contractRegister = Internal.genericContractRegister<Internal.genericContractRegisterArgs<event, contractRegistrations>>

let paramsRawEventSchema = S.object((s): eventArgs => {factory: s.field("factory", Address.schema), pool: s.field("pool", Address.schema), poolType: s.field("poolType", BigInt.schema), data: s.field("data", S.string)})
let blockSchema = Block.schema
let transactionSchema = Transaction.schema

let convertHyperSyncEventArgs = (decodedEvent: HyperSyncClient.Decoder.decodedEvent): eventArgs => {
      {
        factory: decodedEvent.indexed->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        pool: decodedEvent.indexed->Js.Array2.unsafe_get(1)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        poolType: decodedEvent.indexed->Js.Array2.unsafe_get(2)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
        data: decodedEvent.body->Js.Array2.unsafe_get(0)->HyperSyncClient.Decoder.toUnderlying->Utils.magic,
      }
    }

let handlerRegister: HandlerTypes.Register.t = HandlerTypes.Register.make(
  ~topic0=sighash->EvmTypes.Hex.fromStringUnsafe,
  ~contractName,
  ~eventName=name,
)

@genType
type eventFilter = { @as("factory") factory?: SingleOrMultiple.t<Address.t>, @as("pool") pool?: SingleOrMultiple.t<Address.t>, @as("poolType") poolType?: SingleOrMultiple.t<bigint> }

let getTopicSelection = (eventFilters) => eventFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(_eventFilter => LogSelection.makeTopicSelection(~topic0=[sighash->EvmTypes.Hex.fromStringUnsafe], ~topic1=?_eventFilter.factory->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), ~topic2=?_eventFilter.pool->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromAddress)), ~topic3=?_eventFilter.poolType->Belt.Option.map(topicFilters => topicFilters->SingleOrMultiple.normalizeOrThrow->Belt.Array.map(TopicFilter.fromBigInt)), )->Utils.unwrapResultExn)

}
}

@genType
type chainId = int
