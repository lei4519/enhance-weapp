import { getType } from "./util"
/**
 * @description diff新旧数据，返回差异路径对象
 *
 * 对值的操作分三种
 *
 *      新增：{ 值路径：新值 }
 *
 *      修改：{ 值路径：新值 }
 *
 *      删除：{ 父值路径：父新值 }
 *
 * @warning 不要删除根节点this.data上面的值，因为在小程序中无法通过this.setData来删除this.data上面的值
 * @param {Object} oldData 旧值
 * @param {Object} newData 新值
 * @return {Object}  传给this.setData的值
 */
export function diffData(oldRootData: LooseObject, newRootData: LooseObject) {
  // 更新对象，最终传给this.setData的值
  const updateObject: LooseObject = {}
  // 需要对比数据的数组
  type DiffQueue = [LooseObject, LooseObject, string][]
  const diffQueue: DiffQueue = []

  /* 处理根对象 */
  // 根对象所有的旧键
  const oldRootKeys = Object.keys(oldRootData)
  // 根对象所有的新键
  const newRootKeys = Object.keys(newRootData)
  oldRootKeys.forEach(key => {
    // 检查新键中有没有此key
    const keyIndex = newRootKeys.findIndex(k => k === key)
    // 如果有，就从newRootKeys中去除当前key，这样在遍历结束后，newRootKeys中还存在的key，就是新增的key了
    keyIndex > -1 && newRootKeys.splice(keyIndex, 1)
    // ⚠️ 根对象不会处理删除操作，因为在小程序中无法使用setData来删除this.data上面的值
    if (newRootData[key] !== void 0) {
      // 将子属性，放入diff队列中
      diffQueue.push([oldRootData[key], newRootData[key], key])
    }
  })
  // 有新增的值
  if (newRootKeys.length) {
    newRootKeys.forEach(key => {
      // 将新增值加入更新对象
      updateObject[key] = newRootData[key]
    })
  }
  /* 根对象处理完毕，开始 diff 子属性 */

  // 使用循环而非递归，避免数据量过大时爆栈
  diffQueueLoop:
  while (diffQueue.length) {
    const [oldData, newData, keyPath] = diffQueue.shift()!

    // 旧值类型
    const oldType = getType(oldData)
    // 新值类型
    const newType = getType(newData)

    // 类型不等，直接重设
    if (oldType !== newType) {
      updateObject[keyPath] = newData
      continue
    }

    // 基本类型（JSON中没有函数正则等数据类型）
    if (newType !== 'Object' && newType !== 'Array') {
      if (oldData !== newData) {
        updateObject[keyPath] = newData
      }
      continue
    }

    // 数组
    if (newType === 'Array') {
      // 长度不等，直接重设
      // 数组和对象不同，无法根据key值来判断哪些值是新增的，哪些值是删除的
      if (oldData.length !== newData.length) {
        updateObject[keyPath] = newData
        continue
      }
      // 长度相等，将数组的每一项推入diff队列中
      for (let i = 0, l = oldData.length; i < l; i++) {
        diffQueue.push([
          oldData[i],
          newData[i],
          `${keyPath}.${i}`
        ])
      }
      continue
    }

    // 对象
    if (newType === 'Object') {
      // 所有的旧键
      const oldKeys = Object.keys(oldData)
      // 所有的新键
      const newKeys = Object.keys(newData)
      // 旧长新短：删除操作，直接重设
      if (oldKeys.length > newKeys.length) {
        updateObject[keyPath] = newData
        continue
      }
      /**
       * 存放需要对比子属性的数组
       * 之所以用一个数组记录，而不是直接推入diff队列
       * 是因为如果出现了删除操作就不需要再对比子属性，直接重写当前属性即可
       * 所以要延迟推入diff队列的时机
       */
      const diffChild: DiffQueue = []
      for (let i = 0, l = oldKeys.length; i < l; i++) {
        // 旧键
        const key = oldKeys[i]
        // 检查新键中有没有此key
        const keyIndex = newKeys.findIndex(k => k === key)
        /**
         * 旧有新无：删除操作，直接重设
         * oldData: {a: 1, b: 1, c: 1}
         * newData: {a: 1, b: 1, d: 1}
         */
        if (keyIndex === -1) {
          updateObject[keyPath] = newData
          // 跳出本次的diffQueue循环
          continue diffQueueLoop
        }
        // 从newKeys中去除当前key，这样在遍历结束后，newKeys中还存在的key，就是新增的key
        newKeys.splice(keyIndex, 1)
        diffChild.push([
          oldData[key],
          newData[key],
          `${keyPath}.${key}`
        ])
      }
      // 有新增的值
      if (newKeys.length) {
        newKeys.forEach(key => {
          updateObject[`${keyPath}.${key}`] = newData[key]
        })
      }
      if (diffChild.length) {
        // 将需要diff的子属性放入diff队列
        diffQueue.push(...diffChild)
      }
    }
  }
  return updateObject
}


