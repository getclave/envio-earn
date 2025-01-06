/* TypeScript file generated from Logs.res by genType. */

/* eslint-disable */
/* tslint:disable */

const LogsJS = require('./Logs.bs.js');

import type {Exn_t as Js_Exn_t} from '../src/Js.shim';

export type userLogger = {
  readonly debug: (_1:string) => void; 
  readonly info: (_1:string) => void; 
  readonly warn: (_1:string) => void; 
  readonly error: (_1:string) => void; 
  readonly errorWithExn: (_1:(undefined | Js_Exn_t), _2:string) => void
};

export const debug: <T1>(_1:userLogger, _2:T1) => void = LogsJS.debug as any;

export const info: <T1>(_1:userLogger, _2:T1) => void = LogsJS.info as any;

export const warn: <T1>(_1:userLogger, _2:T1) => void = LogsJS.warn as any;

export const error: <T1>(_1:userLogger, _2:T1) => void = LogsJS.error as any;

export const errorWithExn: <T1>(_1:userLogger, _2:(undefined | Js_Exn_t), _3:T1) => void = LogsJS.errorWithExn as any;
