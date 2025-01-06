/* TypeScript file generated from Handlers.res by genType. */

/* eslint-disable */
/* tslint:disable */

const HandlersJS = require('./Handlers.bs.js');

import type {ClaggMain_AdapterAdded_contractRegister as Types_ClaggMain_AdapterAdded_contractRegister} from './Types.gen';

import type {ClaggMain_AdapterAdded_eventFilter as Types_ClaggMain_AdapterAdded_eventFilter} from './Types.gen';

import type {ClaggMain_AdapterAdded_handler as Types_ClaggMain_AdapterAdded_handler} from './Types.gen';

import type {ClaggMain_AdapterAdded_loader as Types_ClaggMain_AdapterAdded_loader} from './Types.gen';

import type {ClaggMain_Deposit_contractRegister as Types_ClaggMain_Deposit_contractRegister} from './Types.gen';

import type {ClaggMain_Deposit_eventFilter as Types_ClaggMain_Deposit_eventFilter} from './Types.gen';

import type {ClaggMain_Deposit_handler as Types_ClaggMain_Deposit_handler} from './Types.gen';

import type {ClaggMain_Deposit_loader as Types_ClaggMain_Deposit_loader} from './Types.gen';

import type {ClaggMain_Withdraw_contractRegister as Types_ClaggMain_Withdraw_contractRegister} from './Types.gen';

import type {ClaggMain_Withdraw_eventFilter as Types_ClaggMain_Withdraw_eventFilter} from './Types.gen';

import type {ClaggMain_Withdraw_handler as Types_ClaggMain_Withdraw_handler} from './Types.gen';

import type {ClaggMain_Withdraw_loader as Types_ClaggMain_Withdraw_loader} from './Types.gen';

import type {ERC20_Transfer_contractRegister as Types_ERC20_Transfer_contractRegister} from './Types.gen';

import type {ERC20_Transfer_eventFilter as Types_ERC20_Transfer_eventFilter} from './Types.gen';

import type {ERC20_Transfer_handler as Types_ERC20_Transfer_handler} from './Types.gen';

import type {ERC20_Transfer_loader as Types_ERC20_Transfer_loader} from './Types.gen';

import type {HandlerTypes_eventConfig as Types_HandlerTypes_eventConfig} from './Types.gen';

import type {SingleOrMultiple_t as Types_SingleOrMultiple_t} from './Types.gen';

import type {SyncswapMaster_RegisterPool_contractRegister as Types_SyncswapMaster_RegisterPool_contractRegister} from './Types.gen';

import type {SyncswapMaster_RegisterPool_eventFilter as Types_SyncswapMaster_RegisterPool_eventFilter} from './Types.gen';

import type {SyncswapMaster_RegisterPool_handler as Types_SyncswapMaster_RegisterPool_handler} from './Types.gen';

import type {SyncswapMaster_RegisterPool_loader as Types_SyncswapMaster_RegisterPool_loader} from './Types.gen';

import type {fnWithEventConfig as Types_fnWithEventConfig} from './Types.gen';

import type {genericHandlerWithLoader as Internal_genericHandlerWithLoader} from 'envio/src/Internal.gen';

export const ClaggMain_AdapterAdded_handler: Types_fnWithEventConfig<Types_ClaggMain_AdapterAdded_handler<void>,Types_HandlerTypes_eventConfig<Types_ClaggMain_AdapterAdded_eventFilter>> = HandlersJS.ClaggMain.AdapterAdded.handler as any;

export const ClaggMain_AdapterAdded_contractRegister: Types_fnWithEventConfig<Types_ClaggMain_AdapterAdded_contractRegister,Types_HandlerTypes_eventConfig<Types_ClaggMain_AdapterAdded_eventFilter>> = HandlersJS.ClaggMain.AdapterAdded.contractRegister as any;

export const ClaggMain_AdapterAdded_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ClaggMain_AdapterAdded_loader<loaderReturn>,Types_ClaggMain_AdapterAdded_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ClaggMain_AdapterAdded_eventFilter>>) => void = HandlersJS.ClaggMain.AdapterAdded.handlerWithLoader as any;

export const ClaggMain_Deposit_handler: Types_fnWithEventConfig<Types_ClaggMain_Deposit_handler<void>,Types_HandlerTypes_eventConfig<Types_ClaggMain_Deposit_eventFilter>> = HandlersJS.ClaggMain.Deposit.handler as any;

export const ClaggMain_Deposit_contractRegister: Types_fnWithEventConfig<Types_ClaggMain_Deposit_contractRegister,Types_HandlerTypes_eventConfig<Types_ClaggMain_Deposit_eventFilter>> = HandlersJS.ClaggMain.Deposit.contractRegister as any;

export const ClaggMain_Deposit_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ClaggMain_Deposit_loader<loaderReturn>,Types_ClaggMain_Deposit_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ClaggMain_Deposit_eventFilter>>) => void = HandlersJS.ClaggMain.Deposit.handlerWithLoader as any;

export const ClaggMain_Withdraw_handler: Types_fnWithEventConfig<Types_ClaggMain_Withdraw_handler<void>,Types_HandlerTypes_eventConfig<Types_ClaggMain_Withdraw_eventFilter>> = HandlersJS.ClaggMain.Withdraw.handler as any;

export const ClaggMain_Withdraw_contractRegister: Types_fnWithEventConfig<Types_ClaggMain_Withdraw_contractRegister,Types_HandlerTypes_eventConfig<Types_ClaggMain_Withdraw_eventFilter>> = HandlersJS.ClaggMain.Withdraw.contractRegister as any;

export const ClaggMain_Withdraw_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ClaggMain_Withdraw_loader<loaderReturn>,Types_ClaggMain_Withdraw_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ClaggMain_Withdraw_eventFilter>>) => void = HandlersJS.ClaggMain.Withdraw.handlerWithLoader as any;

export const ERC20_Transfer_handler: Types_fnWithEventConfig<Types_ERC20_Transfer_handler<void>,Types_HandlerTypes_eventConfig<Types_ERC20_Transfer_eventFilter>> = HandlersJS.ERC20.Transfer.handler as any;

export const ERC20_Transfer_contractRegister: Types_fnWithEventConfig<Types_ERC20_Transfer_contractRegister,Types_HandlerTypes_eventConfig<Types_ERC20_Transfer_eventFilter>> = HandlersJS.ERC20.Transfer.contractRegister as any;

export const ERC20_Transfer_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ERC20_Transfer_loader<loaderReturn>,Types_ERC20_Transfer_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ERC20_Transfer_eventFilter>>) => void = HandlersJS.ERC20.Transfer.handlerWithLoader as any;

export const SyncswapMaster_RegisterPool_handler: Types_fnWithEventConfig<Types_SyncswapMaster_RegisterPool_handler<void>,Types_HandlerTypes_eventConfig<Types_SyncswapMaster_RegisterPool_eventFilter>> = HandlersJS.SyncswapMaster.RegisterPool.handler as any;

export const SyncswapMaster_RegisterPool_contractRegister: Types_fnWithEventConfig<Types_SyncswapMaster_RegisterPool_contractRegister,Types_HandlerTypes_eventConfig<Types_SyncswapMaster_RegisterPool_eventFilter>> = HandlersJS.SyncswapMaster.RegisterPool.contractRegister as any;

export const SyncswapMaster_RegisterPool_handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_SyncswapMaster_RegisterPool_loader<loaderReturn>,Types_SyncswapMaster_RegisterPool_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_SyncswapMaster_RegisterPool_eventFilter>>) => void = HandlersJS.SyncswapMaster.RegisterPool.handlerWithLoader as any;

export const ClaggMain: {
  AdapterAdded: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ClaggMain_AdapterAdded_loader<loaderReturn>,Types_ClaggMain_AdapterAdded_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ClaggMain_AdapterAdded_eventFilter>>) => void; 
    handler: Types_fnWithEventConfig<Types_ClaggMain_AdapterAdded_handler<void>,Types_HandlerTypes_eventConfig<Types_ClaggMain_AdapterAdded_eventFilter>>; 
    contractRegister: Types_fnWithEventConfig<Types_ClaggMain_AdapterAdded_contractRegister,Types_HandlerTypes_eventConfig<Types_ClaggMain_AdapterAdded_eventFilter>>
  }; 
  Deposit: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ClaggMain_Deposit_loader<loaderReturn>,Types_ClaggMain_Deposit_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ClaggMain_Deposit_eventFilter>>) => void; 
    handler: Types_fnWithEventConfig<Types_ClaggMain_Deposit_handler<void>,Types_HandlerTypes_eventConfig<Types_ClaggMain_Deposit_eventFilter>>; 
    contractRegister: Types_fnWithEventConfig<Types_ClaggMain_Deposit_contractRegister,Types_HandlerTypes_eventConfig<Types_ClaggMain_Deposit_eventFilter>>
  }; 
  Withdraw: {
    handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ClaggMain_Withdraw_loader<loaderReturn>,Types_ClaggMain_Withdraw_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ClaggMain_Withdraw_eventFilter>>) => void; 
    handler: Types_fnWithEventConfig<Types_ClaggMain_Withdraw_handler<void>,Types_HandlerTypes_eventConfig<Types_ClaggMain_Withdraw_eventFilter>>; 
    contractRegister: Types_fnWithEventConfig<Types_ClaggMain_Withdraw_contractRegister,Types_HandlerTypes_eventConfig<Types_ClaggMain_Withdraw_eventFilter>>
  }
} = HandlersJS.ClaggMain as any;

export const SyncswapMaster: { RegisterPool: {
  handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_SyncswapMaster_RegisterPool_loader<loaderReturn>,Types_SyncswapMaster_RegisterPool_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_SyncswapMaster_RegisterPool_eventFilter>>) => void; 
  handler: Types_fnWithEventConfig<Types_SyncswapMaster_RegisterPool_handler<void>,Types_HandlerTypes_eventConfig<Types_SyncswapMaster_RegisterPool_eventFilter>>; 
  contractRegister: Types_fnWithEventConfig<Types_SyncswapMaster_RegisterPool_contractRegister,Types_HandlerTypes_eventConfig<Types_SyncswapMaster_RegisterPool_eventFilter>>
} } = HandlersJS.SyncswapMaster as any;

export const ERC20: { Transfer: {
  handlerWithLoader: <loaderReturn>(_1:Internal_genericHandlerWithLoader<Types_ERC20_Transfer_loader<loaderReturn>,Types_ERC20_Transfer_handler<loaderReturn>,Types_SingleOrMultiple_t<Types_ERC20_Transfer_eventFilter>>) => void; 
  handler: Types_fnWithEventConfig<Types_ERC20_Transfer_handler<void>,Types_HandlerTypes_eventConfig<Types_ERC20_Transfer_eventFilter>>; 
  contractRegister: Types_fnWithEventConfig<Types_ERC20_Transfer_contractRegister,Types_HandlerTypes_eventConfig<Types_ERC20_Transfer_eventFilter>>
} } = HandlersJS.ERC20 as any;
