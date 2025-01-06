/* TypeScript file generated from TestHelpers_MockDb.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpers_MockDbJS = require('./TestHelpers_MockDb.bs.js');

import type {AccountClaggPosition_t as Entities_AccountClaggPosition_t} from '../src/db/Entities.gen';

import type {AccountIdleBalance_t as Entities_AccountIdleBalance_t} from '../src/db/Entities.gen';

import type {AccountSyncswapPosition_t as Entities_AccountSyncswapPosition_t} from '../src/db/Entities.gen';

import type {AccountVenusPosition_t as Entities_AccountVenusPosition_t} from '../src/db/Entities.gen';

import type {ClaggAdapter_t as Entities_ClaggAdapter_t} from '../src/db/Entities.gen';

import type {ClaggPool_t as Entities_ClaggPool_t} from '../src/db/Entities.gen';

import type {DynamicContractRegistry_t as TablesStatic_DynamicContractRegistry_t} from '../src/db/TablesStatic.gen';

import type {EventSyncState_t as TablesStatic_EventSyncState_t} from '../src/db/TablesStatic.gen';

import type {HistoricalAccountIdleBalance_t as Entities_HistoricalAccountIdleBalance_t} from '../src/db/Entities.gen';

import type {RawEvents_t as TablesStatic_RawEvents_t} from '../src/db/TablesStatic.gen';

import type {SyncswapPool_t as Entities_SyncswapPool_t} from '../src/db/Entities.gen';

import type {Token_t as Entities_Token_t} from '../src/db/Entities.gen';

import type {VenusPool_t as Entities_VenusPool_t} from '../src/db/Entities.gen';

import type {chainId as Types_chainId} from './Types.gen';

import type {rawEventsKey as InMemoryStore_rawEventsKey} from './InMemoryStore.gen';

/** The mockDb type is simply an InMemoryStore internally. __dbInternal__ holds a reference
to an inMemoryStore and all the the accessor methods point to the reference of that inMemory
store */
export abstract class inMemoryStore { protected opaque!: any }; /* simulate opaque types */

export type t = {
  readonly __dbInternal__: inMemoryStore; 
  readonly entities: entities; 
  readonly rawEvents: storeOperations<InMemoryStore_rawEventsKey,TablesStatic_RawEvents_t>; 
  readonly eventSyncState: storeOperations<Types_chainId,TablesStatic_EventSyncState_t>; 
  readonly dynamicContractRegistry: entityStoreOperations<TablesStatic_DynamicContractRegistry_t>
};

export type entities = {
  readonly AccountClaggPosition: entityStoreOperations<Entities_AccountClaggPosition_t>; 
  readonly AccountIdleBalance: entityStoreOperations<Entities_AccountIdleBalance_t>; 
  readonly AccountSyncswapPosition: entityStoreOperations<Entities_AccountSyncswapPosition_t>; 
  readonly AccountVenusPosition: entityStoreOperations<Entities_AccountVenusPosition_t>; 
  readonly ClaggAdapter: entityStoreOperations<Entities_ClaggAdapter_t>; 
  readonly ClaggPool: entityStoreOperations<Entities_ClaggPool_t>; 
  readonly HistoricalAccountIdleBalance: entityStoreOperations<Entities_HistoricalAccountIdleBalance_t>; 
  readonly SyncswapPool: entityStoreOperations<Entities_SyncswapPool_t>; 
  readonly Token: entityStoreOperations<Entities_Token_t>; 
  readonly VenusPool: entityStoreOperations<Entities_VenusPool_t>
};

export type entityStoreOperations<entity> = storeOperations<string,entity>;

export type storeOperations<entityKey,entity> = {
  readonly getAll: () => entity[]; 
  readonly get: (_1:entityKey) => (undefined | entity); 
  readonly set: (_1:entity) => t; 
  readonly delete: (_1:entityKey) => t
};

/** The constructor function for a mockDb. Call it and then set up the inital state by calling
any of the set functions it provides access to. A mockDb will be passed into a processEvent 
helper. Note, process event helpers will not mutate the mockDb but return a new mockDb with
new state so you can compare states before and after. */
export const createMockDb: () => t = TestHelpers_MockDbJS.createMockDb as any;
