import { decoratorLifeCycle } from './lifecycle'

export function Eapp<T = any>(
  options: AppOptions
): WechatMiniprogram.App.Instance<T> {
  decoratorLifeCycle(options, 'app')
  return (App(options) as unknown) as WechatMiniprogram.App.Instance<T>
}
