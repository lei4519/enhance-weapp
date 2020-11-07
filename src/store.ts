import { reactive, toRef, watch } from "@vue/runtime-core"
import { getCurrentCtx } from "./createPushHooks"
import { updateData } from "./setDataEffect"

let state: LooseObject | null = null
export function initStore(initState: LooseObject) {
  return state = reactive(initState)
}

export function useStore(pathStr: string) {
  const ctx = getCurrentCtx()
  if (!ctx) return console.warn('未找到当前运行中的实例，请不要在setup执行堆栈外使用 useStore')
  if (!state) return console.warn('请先使用initStore 初始化')
  if (!pathStr)  return console.warn('useStore 参数不能为空')
  // const returnStr = /(=>|return)\s+(.[^\s]+)/igm
  const paths = pathStr.split('.')
  const key = paths.pop()!
  let obj = state

  try {
    while (paths.length) {
      obj = obj[paths.pop()!]
    }
  } catch(e) {
    console.error(`useStore(${pathStr})`, '传入的路径错误')
    throw e
  }

  const val = toRef(obj, key)
  const stopWatching = watch(val, updateData.bind(ctx))
  ctx.$once('onUnload:finally', stopWatching)
  ctx.$once('detached:finally', stopWatching)
  return val
}
