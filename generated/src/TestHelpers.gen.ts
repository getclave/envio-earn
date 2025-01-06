/* TypeScript file generated from TestHelpers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const TestHelpersJS = require('./TestHelpers.bs.js');

import type {ClaggMain_AdapterAdded_event as Types_ClaggMain_AdapterAdded_event} from './Types.gen';

import type {ClaggMain_Deposit_event as Types_ClaggMain_Deposit_event} from './Types.gen';

import type {ClaggMain_Withdraw_event as Types_ClaggMain_Withdraw_event} from './Types.gen';

import type {ERC20_Transfer_event as Types_ERC20_Transfer_event} from './Types.gen';

import type {SyncswapMaster_RegisterPool_event as Types_SyncswapMaster_RegisterPool_event} from './Types.gen';

import type {t as Address_t} from 'envio/src/Address.gen';

import type {t as TestHelpers_MockDb_t} from './TestHelpers_MockDb.gen';

/** The arguements that get passed to a "processEvent" helper function */
export type EventFunctions_eventProcessorArgs<event> = {
  readonly event: event; 
  readonly mockDb: TestHelpers_MockDb_t; 
  readonly chainId?: number
};

export type EventFunctions_eventProcessor<event> = (_1:EventFunctions_eventProcessorArgs<event>) => Promise<TestHelpers_MockDb_t>;

export type EventFunctions_MockBlock_t = {
  readonly number?: number; 
  readonly timestamp?: number; 
  readonly hash?: string
};

export type EventFunctions_MockTransaction_t = {};

export type EventFunctions_mockEventData = {
  readonly chainId?: number; 
  readonly srcAddress?: Address_t; 
  readonly logIndex?: number; 
  readonly block?: EventFunctions_MockBlock_t; 
  readonly transaction?: EventFunctions_MockTransaction_t
};

export type ClaggMain_AdapterAdded_createMockArgs = { readonly adapter?: Address_t; readonly mockEventData?: EventFunctions_mockEventData };

export type ClaggMain_Deposit_createMockArgs = {
  readonly user?: Address_t; 
  readonly pool?: Address_t; 
  readonly amount?: bigint; 
  readonly shares?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ClaggMain_Withdraw_createMockArgs = {
  readonly user?: Address_t; 
  readonly pool?: Address_t; 
  readonly amount?: bigint; 
  readonly shares?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type ERC20_Transfer_createMockArgs = {
  readonly from?: Address_t; 
  readonly to?: Address_t; 
  readonly value?: bigint; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export type SyncswapMaster_RegisterPool_createMockArgs = {
  readonly factory?: Address_t; 
  readonly pool?: Address_t; 
  readonly poolType?: bigint; 
  readonly data?: string; 
  readonly mockEventData?: EventFunctions_mockEventData
};

export const MockDb_createMockDb: () => TestHelpers_MockDb_t = TestHelpersJS.MockDb.createMockDb as any;

export const Addresses_mockAddresses: Address_t[] = TestHelpersJS.Addresses.mockAddresses as any;

export const Addresses_defaultAddress: Address_t = TestHelpersJS.Addresses.defaultAddress as any;

export const ClaggMain_AdapterAdded_processEvent: EventFunctions_eventProcessor<Types_ClaggMain_AdapterAdded_event> = TestHelpersJS.ClaggMain.AdapterAdded.processEvent as any;

export const ClaggMain_AdapterAdded_createMockEvent: (args:ClaggMain_AdapterAdded_createMockArgs) => Types_ClaggMain_AdapterAdded_event = TestHelpersJS.ClaggMain.AdapterAdded.createMockEvent as any;

export const ClaggMain_Deposit_processEvent: EventFunctions_eventProcessor<Types_ClaggMain_Deposit_event> = TestHelpersJS.ClaggMain.Deposit.processEvent as any;

export const ClaggMain_Deposit_createMockEvent: (args:ClaggMain_Deposit_createMockArgs) => Types_ClaggMain_Deposit_event = TestHelpersJS.ClaggMain.Deposit.createMockEvent as any;

export const ClaggMain_Withdraw_processEvent: EventFunctions_eventProcessor<Types_ClaggMain_Withdraw_event> = TestHelpersJS.ClaggMain.Withdraw.processEvent as any;

export const ClaggMain_Withdraw_createMockEvent: (args:ClaggMain_Withdraw_createMockArgs) => Types_ClaggMain_Withdraw_event = TestHelpersJS.ClaggMain.Withdraw.createMockEvent as any;

export const ERC20_Transfer_processEvent: EventFunctions_eventProcessor<Types_ERC20_Transfer_event> = TestHelpersJS.ERC20.Transfer.processEvent as any;

export const ERC20_Transfer_createMockEvent: (args:ERC20_Transfer_createMockArgs) => Types_ERC20_Transfer_event = TestHelpersJS.ERC20.Transfer.createMockEvent as any;

export const SyncswapMaster_RegisterPool_processEvent: EventFunctions_eventProcessor<Types_SyncswapMaster_RegisterPool_event> = TestHelpersJS.SyncswapMaster.RegisterPool.processEvent as any;

export const SyncswapMaster_RegisterPool_createMockEvent: (args:SyncswapMaster_RegisterPool_createMockArgs) => Types_SyncswapMaster_RegisterPool_event = TestHelpersJS.SyncswapMaster.RegisterPool.createMockEvent as any;

export const Addresses: { mockAddresses: Address_t[]; defaultAddress: Address_t } = TestHelpersJS.Addresses as any;

export const ClaggMain: {
  AdapterAdded: {
    processEvent: EventFunctions_eventProcessor<Types_ClaggMain_AdapterAdded_event>; 
    createMockEvent: (args:ClaggMain_AdapterAdded_createMockArgs) => Types_ClaggMain_AdapterAdded_event
  }; 
  Deposit: {
    processEvent: EventFunctions_eventProcessor<Types_ClaggMain_Deposit_event>; 
    createMockEvent: (args:ClaggMain_Deposit_createMockArgs) => Types_ClaggMain_Deposit_event
  }; 
  Withdraw: {
    processEvent: EventFunctions_eventProcessor<Types_ClaggMain_Withdraw_event>; 
    createMockEvent: (args:ClaggMain_Withdraw_createMockArgs) => Types_ClaggMain_Withdraw_event
  }
} = TestHelpersJS.ClaggMain as any;

export const SyncswapMaster: { RegisterPool: { processEvent: EventFunctions_eventProcessor<Types_SyncswapMaster_RegisterPool_event>; createMockEvent: (args:SyncswapMaster_RegisterPool_createMockArgs) => Types_SyncswapMaster_RegisterPool_event } } = TestHelpersJS.SyncswapMaster as any;

export const ERC20: { Transfer: { processEvent: EventFunctions_eventProcessor<Types_ERC20_Transfer_event>; createMockEvent: (args:ERC20_Transfer_createMockArgs) => Types_ERC20_Transfer_event } } = TestHelpersJS.ERC20 as any;

export const MockDb: { createMockDb: () => TestHelpers_MockDb_t } = TestHelpersJS.MockDb as any;
