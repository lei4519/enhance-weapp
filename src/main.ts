export { Ecomponent } from './Ecomponent'
export { Epage } from './Epage'

export {
  onLoad,
  onShow,
  onReady,
  onHide,
  onUnload,
  onPullDownRefresh,
  onReachBottom,
  onShareAppMessage,
  onTabItemTap,
  onResize,
  onAddToFavorites,
  onCreated,
  onAttached,
  onComponentReady,
  onMoved,
  onDetached,
  onError
} from './lifecycle'
export { globalMixins } from './mixins'

export * from '../fork/@vue-reactivity'
// TODO 不同的reactivity，可能会有问题
// export { watch, watchEffect } from '@vue/runtime-core'
