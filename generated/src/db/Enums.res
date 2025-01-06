module ContractType = {
  @genType
  type t = 
    | @as("ClaggMain") ClaggMain
    | @as("ERC20") ERC20
    | @as("SyncswapMaster") SyncswapMaster

  let name = "CONTRACT_TYPE"
  let variants = [
    ClaggMain,
    ERC20,
    SyncswapMaster,
  ]
  let enum = Enum.make(~name, ~variants)
}

module EntityType = {
  @genType
  type t = 
    | @as("AccountClaggPosition") AccountClaggPosition
    | @as("AccountIdleBalance") AccountIdleBalance
    | @as("AccountSyncswapPosition") AccountSyncswapPosition
    | @as("AccountVenusPosition") AccountVenusPosition
    | @as("ClaggAdapter") ClaggAdapter
    | @as("ClaggPool") ClaggPool
    | @as("HistoricalAccountIdleBalance") HistoricalAccountIdleBalance
    | @as("SyncswapPool") SyncswapPool
    | @as("Token") Token
    | @as("VenusPool") VenusPool
    | @as("dynamic_contract_registry") DynamicContractRegistry

  let name = "ENTITY_TYPE"
  let variants = [
    AccountClaggPosition,
    AccountIdleBalance,
    AccountSyncswapPosition,
    AccountVenusPosition,
    ClaggAdapter,
    ClaggPool,
    HistoricalAccountIdleBalance,
    SyncswapPool,
    Token,
    VenusPool,
    DynamicContractRegistry,
  ]

  let enum = Enum.make(~name, ~variants)
}

let allEnums: array<module(Enum.S)> = [
  module(EntityHistory.RowAction),
  module(ContractType), 
  module(EntityType),
]
