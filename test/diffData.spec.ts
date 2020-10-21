import { diffData } from '@/diffData'

describe('diff新旧数据', () => {
  test('复合类型新旧无变化', () => {
    const oldData = {
      a: 1,
      b: true,
      c: [{}],
      d: {
        e: [{ k: 1 }, { l: 1 }, { m: 1 }],
        f: {
          g: 1,
          h: [
            {
              i: 1
            },
            2,
            [3, { j: 1 }]
          ]
        }
      }
    }
    const newData = JSON.parse(JSON.stringify(oldData))
    expect(diffData(oldData, newData)).toEqual(null)
  })
  test('根对象新增值', () => {
    const oldData = {
      a: 1
    }
    const newData = {
      a: 1,
      b: 2
    }
    expect(diffData(oldData, newData)).toEqual({ b: 2 })
  })
  test('根对象删除值，会静默失败', () => {
    const oldData = {
      a: 1,
      c: 2
    }
    const newData = {
      a: 1
    }
    expect(diffData(oldData, newData)).toEqual(null)
  })
  test('类型不相等', () => {
    const oldData = {
      a: 1
    }
    const newData = {
      a: true
    }
    expect(diffData(oldData, newData)).toEqual({ a: true })
  })
  test('基本值修改', () => {
    const oldData = {
      a: 1
    }
    const newData = {
      a: 2
    }
    expect(diffData(oldData, newData)).toEqual({ a: 2 })
  })
  test('数组修改：长度不等', () => {
    const oldData = {
      a: [1, 2, 3]
    }
    const newData = {
      a: [1, 2]
    }
    expect(diffData(oldData, newData)).toEqual({ a: [1, 2] })
  })
  test('数组修改：长度相等', () => {
    const oldData = {
      a: [1, 2, 3]
    }
    const newData = {
      a: [1, 2, 4]
    }
    expect(diffData(oldData, newData)).toEqual({ 'a[2]': 4 })
  })
  test('对象新增', () => {
    const oldData = {
      a: { a: 1, b: 1 }
    }
    const newData = {
      a: { a: 1, b: 2, d: 4 }
    }
    expect(diffData(oldData, newData)).toEqual({
      'a.b': 2,
      'a.d': 4
    })
  })
  test('对象修改：旧长新短删除并修改', () => {
    const oldData = {
      a: { a: 1, b: 1, c: 1 }
    }
    const newData = {
      a: { a: 1, b: 2 }
    }
    expect(diffData(oldData, newData)).toEqual({ a: { a: 1, b: 2 } })
  })
  test('对象修改：新旧长度一样删除并修改', () => {
    const oldData = {
      a: { a: 1, b: 1, c: 1 }
    }
    const newData = {
      a: { a: 1, b: 2, d: 2 }
    }
    expect(diffData(oldData, newData)).toEqual({ a: { a: 1, b: 2, d: 2 } })
  })
  test('对象修改：子属性对比', () => {
    const oldData = {
      a: { a: { d: [1, 2, 3] }, b: 1, c: 1 }
    }
    const newData = {
      a: { a: { d: [4, 5, 6] }, b: 2, c: 3 }
    }
    expect(diffData(oldData, newData)).toEqual({
      'a.a.d[0]': 4,
      'a.a.d[1]': 5,
      'a.a.d[2]': 6,
      'a.b': 2,
      'a.c': 3
    })
  })
})
