// const automator = require('miniprogram-automator')

// describe('index', () => {
//   let miniProgram
//   let page
//   // 连接微信开发者工具
//   beforeAll(async () => {
//     miniProgram = await automator.launch({
//       projectPath: 'test/project'
//     })
//     page = await miniProgram.reLaunch('/pages/lifecycle/lifecycle') // 使用miniProgram的api跳转到指定页面
//   }, 40000)

//   it('初始化洗数据后， 初始数据满足要求', async (done)=>{
//     const data = await page.data() // 使用page的方法获取当前页面的data
//     expect(data).toMatchObject({
//       items: expect.anything(),
//       facet: expect.anything()
//     })  // 通过jest的expect方法比较这个data是否符合预期
//     done()
//   })

//   afterAll(async () => {
//     await miniProgram.close()
//   })
// })