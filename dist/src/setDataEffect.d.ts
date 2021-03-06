import { EnhanceRuntime, LooseFunction, LooseObject } from '../types';
export declare function setDataQueueJob(ctx: EnhanceRuntime): void;
export declare function updateData(ctx: EnhanceRuntime): void;
export declare function setData(this: EnhanceRuntime, rawSetData: LooseFunction, data: LooseObject, cb: LooseFunction, isUserInvoke?: boolean): void;
export declare function setDataNextTick(cb?: LooseFunction): void | Promise<unknown>;
