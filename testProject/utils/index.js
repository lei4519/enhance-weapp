export function setTimeoutResolve(resolveData, timeout = 0) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(resolveData)
    }, timeout)
  })
}

export const genFn = (names, timeout = 0) => {
  if (!Array.isArray(names)) names = [names]
  const app = getApp()
  return names.reduce(
    (res, name) => (
      (res[name] = function () {
        if (name === 'onHide') {
          app.globalData['orderAsync'] = app.globalData['orderAsync'].slice(
            0,
            2
          )
        }
        ;(app || this).globalData['orderAsync'].push(name)
        if (timeout) {
          return setTimeoutResolve(void 0, timeout)
        }
      }),
      res
    ),
    {}
  )
}
