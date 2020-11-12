import { computed, stop, ComputedRef } from '@vue/reactivity'
import { reactive } from '@vue/runtime-core'
import { getCurrentCtx } from './createPushHooks'
import { isFunction } from './util'

export function createStore<T extends object = object>(
  initState: T = {} as T
) {

  const _state = reactive<T>(initState) as T

  const getStore = <R>(getter: (s: T) => R): ComputedRef<R> => {
    const ctx = getCurrentCtx()!
    if (!ctx)
      console.warn(
        '未找到当前运行中的实例，请不要在setup执行堆栈外使用 useStore'
      )
    if (!isFunction(getter)) console.warn('getStore 参数必须是函数')
    const val = computed(() => getter(_state))
    ctx.$once('onUnload:finally', () => {
      stop(val.effect)
    })
    ctx.$once('detached:finally', () => {
      stop(val.effect)
    })
    return val
  }

  const setStore = <R>(setter: (s: T) => R): R => {
    return setter(_state)
  }

  return [getStore, setStore] as const
}
