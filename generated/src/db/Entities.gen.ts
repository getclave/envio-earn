/* TypeScript file generated from Entities.res by genType. */

/* eslint-disable */
/* tslint:disable */

import type {Float_t as GqlDbCustomTypes_Float_t} from '../../src/GqlDbCustomTypes.gen';

export type id = string;

export type whereOperations<entity,fieldType> = { readonly eq: (_1:fieldType) => Promise<entity[]> };

export type AccountClaggPosition_t = {
  readonly claggPool_id: id; 
  readonly id: id; 
  readonly shareBalance: bigint; 
  readonly userAddress: string
};

export type AccountClaggPosition_indexedFieldOperations = { readonly claggPool_id: whereOperations<AccountClaggPosition_t,id>; readonly userAddress: whereOperations<AccountClaggPosition_t,string> };

export type AccountIdleBalance_t = {
  readonly address: string; 
  readonly balance: bigint; 
  readonly id: id; 
  readonly token_id: id
};

export type AccountIdleBalance_indexedFieldOperations = { readonly address: whereOperations<AccountIdleBalance_t,string>; readonly token_id: whereOperations<AccountIdleBalance_t,id> };

export type AccountSyncswapPosition_t = {
  readonly id: id; 
  readonly shareBalance: bigint; 
  readonly syncswapPool_id: id; 
  readonly userAddress: string
};

export type AccountSyncswapPosition_indexedFieldOperations = { readonly syncswapPool_id: whereOperations<AccountSyncswapPosition_t,id>; readonly userAddress: whereOperations<AccountSyncswapPosition_t,string> };

export type AccountVenusPosition_t = {
  readonly id: id; 
  readonly shareBalance: bigint; 
  readonly userAddress: string; 
  readonly venusPool_id: id
};

export type AccountVenusPosition_indexedFieldOperations = { readonly userAddress: whereOperations<AccountVenusPosition_t,string>; readonly venusPool_id: whereOperations<AccountVenusPosition_t,id> };

export type ClaggAdapter_t = { readonly address: string; readonly id: id };

export type ClaggAdapter_indexedFieldOperations = { readonly address: whereOperations<ClaggAdapter_t,string> };

export type ClaggPool_t = {
  readonly adapter_id: (undefined | id); 
  readonly address: string; 
  readonly id: id; 
  readonly totalLiquidity: (undefined | bigint); 
  readonly totalSupply: (undefined | bigint); 
  readonly underlyingToken_id: (undefined | id)
};

export type ClaggPool_indexedFieldOperations = { readonly address: whereOperations<ClaggPool_t,string>; readonly underlyingToken_id: whereOperations<ClaggPool_t,(undefined | id)> };

export type HistoricalAccountIdleBalance_t = {
  readonly address: string; 
  readonly balance: bigint; 
  readonly id: id; 
  readonly timestamp: bigint; 
  readonly token_id: id
};

export type HistoricalAccountIdleBalance_indexedFieldOperations = {
  readonly address: whereOperations<HistoricalAccountIdleBalance_t,string>; 
  readonly timestamp: whereOperations<HistoricalAccountIdleBalance_t,bigint>; 
  readonly token_id: whereOperations<HistoricalAccountIdleBalance_t,id>
};

export type SyncswapPool_t = {
  readonly address: string; 
  readonly id: id; 
  readonly name: (undefined | string); 
  readonly poolType: (undefined | bigint); 
  readonly symbol: (undefined | string); 
  readonly tokenPerShare: bigint; 
  readonly tokenPerShare2: bigint; 
  readonly underlyingToken_id: (undefined | id); 
  readonly underlyingToken2_id: (undefined | id)
};

export type SyncswapPool_indexedFieldOperations = {
  readonly address: whereOperations<SyncswapPool_t,string>; 
  readonly underlyingToken_id: whereOperations<SyncswapPool_t,(undefined | id)>; 
  readonly underlyingToken2_id: whereOperations<SyncswapPool_t,(undefined | id)>
};

export type Token_t = {
  readonly decimals: (undefined | number); 
  readonly id: id; 
  readonly name: (undefined | string); 
  readonly price: (undefined | GqlDbCustomTypes_Float_t); 
  readonly symbol: (undefined | string)
};

export type Token_indexedFieldOperations = {};

export type VenusPool_t = {
  readonly address: string; 
  readonly id: id; 
  readonly name: (undefined | string); 
  readonly symbol: (undefined | string); 
  readonly tokenPerShare: bigint; 
  readonly underlyingToken_id: (undefined | id)
};

export type VenusPool_indexedFieldOperations = { readonly address: whereOperations<VenusPool_t,string>; readonly underlyingToken_id: whereOperations<VenusPool_t,(undefined | id)> };
