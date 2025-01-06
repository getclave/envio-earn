open Table
open Enums.EntityType
type id = string

type internalEntity
module type Entity = {
  type t
  let name: Enums.EntityType.t
  let schema: S.t<t>
  let rowsSchema: S.t<array<t>>
  let table: Table.table
  let entityHistory: EntityHistory.t<t>
}
module type InternalEntity = Entity with type t = internalEntity
external entityModToInternal: module(Entity with type t = 'a) => module(InternalEntity) = "%identity"
external entityModsToInternal: array<module(Entity)> => array<module(InternalEntity)> = "%identity"

@get
external getEntityId: internalEntity => string = "id"

exception UnexpectedIdNotDefinedOnEntity
let getEntityIdUnsafe = (entity: 'entity): id =>
  switch Utils.magic(entity)["id"] {
  | Some(id) => id
  | None =>
    UnexpectedIdNotDefinedOnEntity->ErrorHandling.mkLogAndRaise(
      ~msg="Property 'id' does not exist on expected entity object",
    )
  }

//shorthand for punning
let isPrimaryKey = true
let isNullable = true
let isArray = true
let isIndex = true

@genType
type whereOperations<'entity, 'fieldType> = {eq: 'fieldType => promise<array<'entity>>}

module AccountClaggPosition = {
  let name = AccountClaggPosition
  @genType
  type t = {
    claggPool_id: id,
    id: id,
    shareBalance: bigint,
    userAddress: string,
  }

  let schema = S.object((s): t => {
    claggPool_id: s.field("claggPool_id", S.string),
    id: s.field("id", S.string),
    shareBalance: s.field("shareBalance", BigInt.schema),
    userAddress: s.field("userAddress", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("claggPool_id") claggPool_id: whereOperations<t, id>,
    
      @as("userAddress") userAddress: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "claggPool", 
      Text,
      
      
      
      ~isIndex,
      ~linkedEntity="ClaggPool",
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "shareBalance", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "userAddress", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module AccountIdleBalance = {
  let name = AccountIdleBalance
  @genType
  type t = {
    address: string,
    balance: bigint,
    id: id,
    token_id: id,
  }

  let schema = S.object((s): t => {
    address: s.field("address", S.string),
    balance: s.field("balance", BigInt.schema),
    id: s.field("id", S.string),
    token_id: s.field("token_id", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("address") address: whereOperations<t, string>,
    
      @as("token_id") token_id: whereOperations<t, id>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "address", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "balance", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "token", 
      Text,
      
      
      
      ~isIndex,
      ~linkedEntity="Token",
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module AccountSyncswapPosition = {
  let name = AccountSyncswapPosition
  @genType
  type t = {
    id: id,
    shareBalance: bigint,
    syncswapPool_id: id,
    userAddress: string,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    shareBalance: s.field("shareBalance", BigInt.schema),
    syncswapPool_id: s.field("syncswapPool_id", S.string),
    userAddress: s.field("userAddress", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("syncswapPool_id") syncswapPool_id: whereOperations<t, id>,
    
      @as("userAddress") userAddress: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "shareBalance", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "syncswapPool", 
      Text,
      
      
      
      ~isIndex,
      ~linkedEntity="SyncswapPool",
      ),
      mkField(
      "userAddress", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module AccountVenusPosition = {
  let name = AccountVenusPosition
  @genType
  type t = {
    id: id,
    shareBalance: bigint,
    userAddress: string,
    venusPool_id: id,
  }

  let schema = S.object((s): t => {
    id: s.field("id", S.string),
    shareBalance: s.field("shareBalance", BigInt.schema),
    userAddress: s.field("userAddress", S.string),
    venusPool_id: s.field("venusPool_id", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("userAddress") userAddress: whereOperations<t, string>,
    
      @as("venusPool_id") venusPool_id: whereOperations<t, id>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "shareBalance", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "userAddress", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "venusPool", 
      Text,
      
      
      
      ~isIndex,
      ~linkedEntity="VenusPool",
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module ClaggAdapter = {
  let name = ClaggAdapter
  @genType
  type t = {
    address: string,
    id: id,
  }

  let schema = S.object((s): t => {
    address: s.field("address", S.string),
    id: s.field("id", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("address") address: whereOperations<t, string>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "address", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module ClaggPool = {
  let name = ClaggPool
  @genType
  type t = {
    adapter_id: option<id>,
    address: string,
    id: id,
    totalLiquidity: option<bigint>,
    totalSupply: option<bigint>,
    underlyingToken_id: option<id>,
  }

  let schema = S.object((s): t => {
    adapter_id: s.field("adapter_id", S.null(S.string)),
    address: s.field("address", S.string),
    id: s.field("id", S.string),
    totalLiquidity: s.field("totalLiquidity", S.null(BigInt.schema)),
    totalSupply: s.field("totalSupply", S.null(BigInt.schema)),
    underlyingToken_id: s.field("underlyingToken_id", S.null(S.string)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("address") address: whereOperations<t, string>,
    
      @as("underlyingToken_id") underlyingToken_id: whereOperations<t, option<id>>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "adapter", 
      Text,
      
      ~isNullable,
      
      
      ~linkedEntity="ClaggAdapter",
      ),
      mkField(
      "address", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "totalLiquidity", 
      Numeric,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "totalSupply", 
      Numeric,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "underlyingToken", 
      Text,
      
      ~isNullable,
      
      ~isIndex,
      ~linkedEntity="Token",
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module HistoricalAccountIdleBalance = {
  let name = HistoricalAccountIdleBalance
  @genType
  type t = {
    address: string,
    balance: bigint,
    id: id,
    timestamp: bigint,
    token_id: id,
  }

  let schema = S.object((s): t => {
    address: s.field("address", S.string),
    balance: s.field("balance", BigInt.schema),
    id: s.field("id", S.string),
    timestamp: s.field("timestamp", BigInt.schema),
    token_id: s.field("token_id", S.string),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("address") address: whereOperations<t, string>,
    
      @as("timestamp") timestamp: whereOperations<t, bigint>,
    
      @as("token_id") token_id: whereOperations<t, id>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "address", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "balance", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "timestamp", 
      Numeric,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "token", 
      Text,
      
      
      
      ~isIndex,
      ~linkedEntity="Token",
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module SyncswapPool = {
  let name = SyncswapPool
  @genType
  type t = {
    address: string,
    id: id,
    name: option<string>,
    poolType: option<bigint>,
    symbol: option<string>,
    tokenPerShare: bigint,
    tokenPerShare2: bigint,
    underlyingToken_id: option<id>,
    underlyingToken2_id: option<id>,
  }

  let schema = S.object((s): t => {
    address: s.field("address", S.string),
    id: s.field("id", S.string),
    name: s.field("name", S.null(S.string)),
    poolType: s.field("poolType", S.null(BigInt.schema)),
    symbol: s.field("symbol", S.null(S.string)),
    tokenPerShare: s.field("tokenPerShare", BigInt.schema),
    tokenPerShare2: s.field("tokenPerShare2", BigInt.schema),
    underlyingToken_id: s.field("underlyingToken_id", S.null(S.string)),
    underlyingToken2_id: s.field("underlyingToken2_id", S.null(S.string)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("address") address: whereOperations<t, string>,
    
      @as("underlyingToken_id") underlyingToken_id: whereOperations<t, option<id>>,
    
      @as("underlyingToken2_id") underlyingToken2_id: whereOperations<t, option<id>>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "address", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "name", 
      Text,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "poolType", 
      Numeric,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "symbol", 
      Text,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "tokenPerShare", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "tokenPerShare2", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "underlyingToken", 
      Text,
      
      ~isNullable,
      
      ~isIndex,
      ~linkedEntity="Token",
      ),
      mkField(
      "underlyingToken2", 
      Text,
      
      ~isNullable,
      
      ~isIndex,
      ~linkedEntity="Token",
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module Token = {
  let name = Token
  @genType
  type t = {
    decimals: option<int>,
    id: id,
    name: option<string>,
    price: option<GqlDbCustomTypes.Float.t>,
    symbol: option<string>,
  }

  let schema = S.object((s): t => {
    decimals: s.field("decimals", S.null(GqlDbCustomTypes.Int.schema)),
    id: s.field("id", S.string),
    name: s.field("name", S.null(S.string)),
    price: s.field("price", S.null(GqlDbCustomTypes.Float.schema)),
    symbol: s.field("symbol", S.null(S.string)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "decimals", 
      Integer,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "name", 
      Text,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "price", 
      DoublePrecision,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "symbol", 
      Text,
      
      ~isNullable,
      
      
      
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

module VenusPool = {
  let name = VenusPool
  @genType
  type t = {
    address: string,
    id: id,
    name: option<string>,
    symbol: option<string>,
    tokenPerShare: bigint,
    underlyingToken_id: option<id>,
  }

  let schema = S.object((s): t => {
    address: s.field("address", S.string),
    id: s.field("id", S.string),
    name: s.field("name", S.null(S.string)),
    symbol: s.field("symbol", S.null(S.string)),
    tokenPerShare: s.field("tokenPerShare", BigInt.schema),
    underlyingToken_id: s.field("underlyingToken_id", S.null(S.string)),
  })

  let rowsSchema = S.array(schema)

  @genType
  type indexedFieldOperations = {
    
      @as("address") address: whereOperations<t, string>,
    
      @as("underlyingToken_id") underlyingToken_id: whereOperations<t, option<id>>,
    
  }

  let table = mkTable(
     (name :> string),
    ~fields=[
      mkField(
      "address", 
      Text,
      
      
      
      ~isIndex,
      
      ),
      mkField(
      "id", 
      Text,
      ~isPrimaryKey,
      
      
      
      
      ),
      mkField(
      "name", 
      Text,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "symbol", 
      Text,
      
      ~isNullable,
      
      
      
      ),
      mkField(
      "tokenPerShare", 
      Numeric,
      
      
      
      
      
      ),
      mkField(
      "underlyingToken", 
      Text,
      
      ~isNullable,
      
      ~isIndex,
      ~linkedEntity="Token",
      ),
      mkField("db_write_timestamp", TimestampWithoutTimezone, ~default="CURRENT_TIMESTAMP"),
    ],
  )

  let entityHistory = table->EntityHistory.fromTable(~schema)
}

let allEntities = [
  module(AccountClaggPosition),
  module(AccountIdleBalance),
  module(AccountSyncswapPosition),
  module(AccountVenusPosition),
  module(ClaggAdapter),
  module(ClaggPool),
  module(HistoricalAccountIdleBalance),
  module(SyncswapPool),
  module(Token),
  module(VenusPool),
  module(TablesStatic.DynamicContractRegistry),
]->entityModsToInternal
