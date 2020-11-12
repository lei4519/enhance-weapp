import { ComputedRef } from '@vue/reactivity';
export declare function createStore<T extends object = object>(initState?: T): readonly [<R>(getter: (s: T) => R) => ComputedRef<R>, <R_1>(setter: (s: T) => R_1) => R_1];
