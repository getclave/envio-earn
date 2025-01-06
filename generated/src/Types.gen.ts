/* TypeScript file generated from Types.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {AccountClaggPosition_indexedFieldOperations as Entities_AccountClaggPosition_indexedFieldOperations} from '../src/db/Entities.gen';

import type {AccountClaggPosition_t as Entities_AccountClaggPosition_t} from '../src/db/Entities.gen';

import type {AccountIdleBalance_indexedFieldOperations as Entities_AccountIdleBalance_indexedFieldOperations} from '../src/db/Entities.gen';

import type {AccountIdleBalance_t as Entities_AccountIdleBalance_t} from '../src/db/Entities.gen';

import type {AccountSyncswapPosition_indexedFieldOperations as Entities_AccountSyncswapPosition_indexedFieldOperations} from '../src/db/Entities.gen';

import type {AccountSyncswapPosition_t as Entities_AccountSyncswapPosition_t} from '../src/db/Entities.gen';

import type {AccountVenusPosition_indexedFieldOperations as Entities_AccountVenusPosition_indexedFieldOperations} from '../src/db/Entities.gen';

import type {AccountVenusPosition_t as Entities_AccountVenusPosition_t} from '../src/db/Entities.gen';

import type {ClaggAdapter_indexedFieldOperations as Entities_ClaggAdapter_indexedFieldOperations} from '../src/db/Entities.gen';

import type {ClaggAdapter_t as Entities_ClaggAdapter_t} from '../src/db/Entities.gen';

import type {ClaggPool_indexedFieldOperations as Entities_ClaggPool_indexedFieldOperations} from '../src/db/Entities.gen';

import type {ClaggPool_t as Entities_ClaggPool_t} from '../src/db/Entities.gen';

import type {HandlerWithOptions as $$fnWithEventConfig} from './bindings/OpaqueTypes.ts';

import type {HistoricalAccountIdleBalance_indexedFieldOperations as Entities_HistoricalAccountIdleBalance_indexedFieldOperations} from '../src/db/Entities.gen';

import type {HistoricalAccountIdleBalance_t as Entities_HistoricalAccountIdleBalance_t} from '../src/db/Entities.gen';

import type {SingleOrMultiple as $$SingleOrMultiple_t} from './bindings/OpaqueTypes';

import type {SyncswapPool_indexedFieldOperations as Entities_SyncswapPool_indexedFieldOperations} from '../src/db/Entities.gen';

import type {SyncswapPool_t as Entities_SyncswapPool_t} from '../src/db/Entities.gen';

import type {Token_indexedFieldOperations as Entities_Token_indexedFieldOperations} from '../src/db/Entities.gen';

import type {Token_t as Entities_Token_t} from '../src/db/Entities.gen';

import type {VenusPool_indexedFieldOperations as Entities_VenusPool_indexedFieldOperations} from '../src/db/Entities.gen';

import type {VenusPool_t as Entities_VenusPool_t} from '../src/db/Entities.gen';

import type {genericContractRegisterArgs as Internal_genericContractRegisterArgs} from 'envio/src/Internal.gen';

import type {genericContractRegister as Internal_genericContractRegister} from 'envio/src/Internal.gen';

import type {genericEvent as Internal_genericEvent} from 'envio/src/Internal.gen';

import type {genericHandlerArgs as Internal_genericHandlerArgs} from 'envio/src/Internal.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

import type {genericHandler as Internal_genericHandler} from 'envio/src/Internal.gen';

import type {genericLoaderArgs as Internal_genericLoaderArgs} from 'envio/src/Internal.gen';

import type {genericLoader as Internal_genericLoader} from 'envio/src/Internal.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {userLogger as Logs_userLogger} from './Logs.gen';

export type id = string;
export type Id = id;

export type contractRegistrations = {
  readonly addClaggMain: (_1:Address_t) => void; 
  readonly addERC20: (_1:Address_t) => void; 
  readonly addSyncswapMaster: (_1:Address_t) => void
};

export type entityLoaderContext<entity,indexedFieldOperations> = { readonly get: (_1:id) => Promise<(undefined | entity)>; readonly getWhere: indexedFieldOperations };

export type loaderContext = {
  readonly log: Logs_userLogger; 
  readonly AccountClaggPosition: entityLoaderContext<Entities_AccountClaggPosition_t,Entities_AccountClaggPosition_indexedFieldOperations>; 
  readonly AccountIdleBalance: entityLoaderContext<Entities_AccountIdleBalance_t,Entities_AccountIdleBalance_indexedFieldOperations>; 
  readonly AccountSyncswapPosition: entityLoaderContext<Entities_AccountSyncswapPosition_t,Entities_AccountSyncswapPosition_indexedFieldOperations>; 
  readonly AccountVenusPosition: entityLoaderContext<Entities_AccountVenusPosition_t,Entities_AccountVenusPosition_indexedFieldOperations>; 
  readonly ClaggAdapter: entityLoaderContext<Entities_ClaggAdapter_t,Entities_ClaggAdapter_indexedFieldOperations>; 
  readonly ClaggPool: entityLoaderContext<Entities_ClaggPool_t,Entities_ClaggPool_indexedFieldOperations>; 
  readonly HistoricalAccountIdleBalance: entityLoaderContext<Entities_HistoricalAccountIdleBalance_t,Entities_HistoricalAccountIdleBalance_indexedFieldOperations>; 
  readonly SyncswapPool: entityLoaderContext<Entities_SyncswapPool_t,Entities_SyncswapPool_indexedFieldOperations>; 
  readonly Token: entityLoaderContext<Entities_Token_t,Entities_Token_indexedFieldOperations>; 
  readonly VenusPool: entityLoaderContext<Entities_VenusPool_t,Entities_VenusPool_indexedFieldOperations>
};

export type entityHandlerContext<entity> = {
  readonly get: (_1:id) => Promise<(undefined | entity)>; 
  readonly set: (_1:entity) => void; 
  readonly deleteUnsafe: (_1:id) => void
};

export type handlerContext = {
  readonly log: Logs_userLogger; 
  readonly AccountClaggPosition: entityHandlerContext<Entities_AccountClaggPosition_t>; 
  readonly AccountIdleBalance: entityHandlerContext<Entities_AccountIdleBalance_t>; 
  readonly AccountSyncswapPosition: entityHandlerContext<Entities_AccountSyncswapPosition_t>; 
  readonly AccountVenusPosition: entityHandlerContext<Entities_AccountVenusPosition_t>; 
  readonly ClaggAdapter: entityHandlerContext<Entities_ClaggAdapter_t>; 
  readonly ClaggPool: entityHandlerContext<Entities_ClaggPool_t>; 
  readonly HistoricalAccountIdleBalance: entityHandlerContext<Entities_HistoricalAccountIdleBalance_t>; 
  readonly SyncswapPool: entityHandlerContext<Entities_SyncswapPool_t>; 
  readonly Token: entityHandlerContext<Entities_Token_t>; 
  readonly VenusPool: entityHandlerContext<Entities_VenusPool_t>
};

export type accountClaggPosition = Entities_AccountClaggPosition_t;
export type AccountClaggPosition = accountClaggPosition;

export type accountIdleBalance = Entities_AccountIdleBalance_t;
export type AccountIdleBalance = accountIdleBalance;

export type accountSyncswapPosition = Entities_AccountSyncswapPosition_t;
export type AccountSyncswapPosition = accountSyncswapPosition;

export type accountVenusPosition = Entities_AccountVenusPosition_t;
export type AccountVenusPosition = accountVenusPosition;

export type claggAdapter = Entities_ClaggAdapter_t;
export type ClaggAdapter = claggAdapter;

export type claggPool = Entities_ClaggPool_t;
export type ClaggPool = claggPool;

export type historicalAccountIdleBalance = Entities_HistoricalAccountIdleBalance_t;
export type HistoricalAccountIdleBalance = historicalAccountIdleBalance;

export type syncswapPool = Entities_SyncswapPool_t;
export type SyncswapPool = syncswapPool;

export type token = Entities_Token_t;
export type Token = token;

export type venusPool = Entities_VenusPool_t;
export type VenusPool = venusPool;

export type eventIdentifier = {
  readonly chainId: number; 
  readonly blockTimestamp: number; 
  readonly blockNumber: number; 
  readonly logIndex: number
};

export type entityUpdateAction<entityType> = "Delete" | { TAG: "Set"; _0: entityType };

export type entityUpdate<entityType> = {
  readonly eventIdentifier: eventIdentifier; 
  readonly entityId: id; 
  readonly entityUpdateAction: entityUpdateAction<entityType>
};

export type entityValueAtStartOfBatch<entityType> = 
    "NotSet"
  | { TAG: "AlreadySet"; _0: entityType };

export type updatedValue<entityType> = { readonly latest: entityUpdate<entityType>; readonly history: entityUpdate<entityType>[] };

export type inMemoryStoreRowEntity<entityType> = 
    { TAG: "Updated"; _0: updatedValue<entityType> }
  | { TAG: "InitialReadFromDb"; _0: entityValueAtStartOfBatch<entityType> };

export type Transaction_t = {};

export type Block_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedBlock_t = {
  readonly number: number; 
  readonly timestamp: number; 
  readonly hash: string
};

export type AggregatedTransaction_t = {};

export type eventLog<params> = Internal_genericEvent<params,Block_t,Transaction_t>;
export type EventLog<params> = eventLog<params>;

export type SingleOrMultiple_t<a> = $$SingleOrMultiple_t<a>;

export type HandlerTypes_args<eventArgs,context> = { readonly event: eventLog<eventArgs>; readonly context: context };

export type HandlerTypes_contractRegisterArgs<eventArgs> = Internal_genericContractRegisterArgs<eventLog<eventArgs>,contractRegistrations>;

export type HandlerTypes_contractRegister<eventArgs> = Internal_genericContractRegister<HandlerTypes_contractRegisterArgs<eventArgs>>;

export type HandlerTypes_loaderArgs<eventArgs> = Internal_genericLoaderArgs<eventLog<eventArgs>,loaderContext>;

export type HandlerTypes_loader<eventArgs,loaderReturn> = Internal_genericLoader<HandlerTypes_loaderArgs<eventArgs>,loaderReturn>;

export type HandlerTypes_handlerArgs<eventArgs,loaderReturn> = Internal_genericHandlerArgs<eventLog<eventArgs>,handlerContext,loaderReturn>;

export type HandlerTypes_handler<eventArgs,loaderReturn> = Internal_genericHandler<HandlerTypes_handlerArgs<eventArgs,loaderReturn>>;

export type HandlerTypes_loaderHandler<eventArgs,loaderReturn,eventFilter> = Internal_genericHandlerWithLoader<HandlerTypes_loader<eventArgs,loaderReturn>,HandlerTypes_handler<eventArgs,loaderReturn>,SingleOrMultiple_t<eventFilter>>;

export type HandlerTypes_eventConfig<eventFilter> = {
  readonly wildcard?: boolean; 
  readonly eventFilters?: SingleOrMultiple_t<eventFilter>; 
  readonly preRegisterDynamicContracts?: boolean
};

export type fnWithEventConfig<fn,eventConfig> = $$fnWithEventConfig<fn,eventConfig>;

export type handlerWithOptions<eventArgs,loaderReturn,eventFilter> = fnWithEventConfig<HandlerTypes_handler<eventArgs,loaderReturn>,HandlerTypes_eventConfig<eventFilter>>;

export type contractRegisterWithOptions<eventArgs,eventFilter> = fnWithEventConfig<HandlerTypes_contractRegister<eventArgs>,HandlerTypes_eventConfig<eventFilter>>;

export type ClaggMain_AdapterAdded_eventArgs = { readonly adapter: Address_t };

export type ClaggMain_AdapterAdded_block = Block_t;

export type ClaggMain_AdapterAdded_transaction = Transaction_t;

export type ClaggMain_AdapterAdded_event = Internal_genericEvent<ClaggMain_AdapterAdded_eventArgs,ClaggMain_AdapterAdded_block,ClaggMain_AdapterAdded_transaction>;

export type ClaggMain_AdapterAdded_loader<loaderReturn> = Internal_genericLoader<Internal_genericLoaderArgs<ClaggMain_AdapterAdded_event,loaderContext>,loaderReturn>;

export type ClaggMain_AdapterAdded_handler<loaderReturn> = Internal_genericHandler<Internal_genericHandlerArgs<ClaggMain_AdapterAdded_event,handlerContext,loaderReturn>>;

export type ClaggMain_AdapterAdded_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ClaggMain_AdapterAdded_event,contractRegistrations>>;

export type ClaggMain_AdapterAdded_eventFilter = { readonly adapter?: SingleOrMultiple_t<Address_t> };

export type ClaggMain_Deposit_eventArgs = {
  readonly user: Address_t; 
  readonly pool: Address_t; 
  readonly amount: bigint; 
  readonly shares: bigint
};

export type ClaggMain_Deposit_block = Block_t;

export type ClaggMain_Deposit_transaction = Transaction_t;

export type ClaggMain_Deposit_event = Internal_genericEvent<ClaggMain_Deposit_eventArgs,ClaggMain_Deposit_block,ClaggMain_Deposit_transaction>;

export type ClaggMain_Deposit_loader<loaderReturn> = Internal_genericLoader<Internal_genericLoaderArgs<ClaggMain_Deposit_event,loaderContext>,loaderReturn>;

export type ClaggMain_Deposit_handler<loaderReturn> = Internal_genericHandler<Internal_genericHandlerArgs<ClaggMain_Deposit_event,handlerContext,loaderReturn>>;

export type ClaggMain_Deposit_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ClaggMain_Deposit_event,contractRegistrations>>;

export type ClaggMain_Deposit_eventFilter = { readonly user?: SingleOrMultiple_t<Address_t>; readonly pool?: SingleOrMultiple_t<Address_t> };

export type ClaggMain_Withdraw_eventArgs = {
  readonly user: Address_t; 
  readonly pool: Address_t; 
  readonly amount: bigint; 
  readonly shares: bigint
};

export type ClaggMain_Withdraw_block = Block_t;

export type ClaggMain_Withdraw_transaction = Transaction_t;

export type ClaggMain_Withdraw_event = Internal_genericEvent<ClaggMain_Withdraw_eventArgs,ClaggMain_Withdraw_block,ClaggMain_Withdraw_transaction>;

export type ClaggMain_Withdraw_loader<loaderReturn> = Internal_genericLoader<Internal_genericLoaderArgs<ClaggMain_Withdraw_event,loaderContext>,loaderReturn>;

export type ClaggMain_Withdraw_handler<loaderReturn> = Internal_genericHandler<Internal_genericHandlerArgs<ClaggMain_Withdraw_event,handlerContext,loaderReturn>>;

export type ClaggMain_Withdraw_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ClaggMain_Withdraw_event,contractRegistrations>>;

export type ClaggMain_Withdraw_eventFilter = { readonly user?: SingleOrMultiple_t<Address_t>; readonly pool?: SingleOrMultiple_t<Address_t> };

export type ERC20_Transfer_eventArgs = {
  readonly from: Address_t; 
  readonly to: Address_t; 
  readonly value: bigint
};

export type ERC20_Transfer_block = Block_t;

export type ERC20_Transfer_transaction = Transaction_t;

export type ERC20_Transfer_event = Internal_genericEvent<ERC20_Transfer_eventArgs,ERC20_Transfer_block,ERC20_Transfer_transaction>;

export type ERC20_Transfer_loader<loaderReturn> = Internal_genericLoader<Internal_genericLoaderArgs<ERC20_Transfer_event,loaderContext>,loaderReturn>;

export type ERC20_Transfer_handler<loaderReturn> = Internal_genericHandler<Internal_genericHandlerArgs<ERC20_Transfer_event,handlerContext,loaderReturn>>;

export type ERC20_Transfer_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<ERC20_Transfer_event,contractRegistrations>>;

export type ERC20_Transfer_eventFilter = { readonly from?: SingleOrMultiple_t<Address_t>; readonly to?: SingleOrMultiple_t<Address_t> };

export type SyncswapMaster_RegisterPool_eventArgs = {
  readonly factory: Address_t; 
  readonly pool: Address_t; 
  readonly poolType: bigint; 
  readonly data: string
};

export type SyncswapMaster_RegisterPool_block = Block_t;

export type SyncswapMaster_RegisterPool_transaction = Transaction_t;

export type SyncswapMaster_RegisterPool_event = Internal_genericEvent<SyncswapMaster_RegisterPool_eventArgs,SyncswapMaster_RegisterPool_block,SyncswapMaster_RegisterPool_transaction>;

export type SyncswapMaster_RegisterPool_loader<loaderReturn> = Internal_genericLoader<Internal_genericLoaderArgs<SyncswapMaster_RegisterPool_event,loaderContext>,loaderReturn>;

export type SyncswapMaster_RegisterPool_handler<loaderReturn> = Internal_genericHandler<Internal_genericHandlerArgs<SyncswapMaster_RegisterPool_event,handlerContext,loaderReturn>>;

export type SyncswapMaster_RegisterPool_contractRegister = Internal_genericContractRegister<Internal_genericContractRegisterArgs<SyncswapMaster_RegisterPool_event,contractRegistrations>>;

export type SyncswapMaster_RegisterPool_eventFilter = {
  readonly factory?: SingleOrMultiple_t<Address_t>; 
  readonly pool?: SingleOrMultiple_t<Address_t>; 
  readonly poolType?: SingleOrMultiple_t<bigint>
};

export type chainId = number;
