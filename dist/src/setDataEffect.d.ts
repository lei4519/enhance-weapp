import { EnhanceRuntime, LooseFunction } from '../types';
export declare function setDataQueueJob(ctx: EnhanceRuntime): void;
export declare function setDataNextTick(this: EnhanceRuntime, cb?: LooseFunction): Promise<unknown>;
