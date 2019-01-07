// 购物车的业务逻辑
// 导入数据库操作代码并输出接口
const DB = require('../utils/db');

module.exports = {
  /**
   * 添加到购物车列表
   * 
   */
  // 创建 add 接口
  add: async ctx => {
    // 获取用户和商品信息
    let user = ctx.state.$wxInfo.userinfo.openId
    let product = ctx.request.body

    // 我们基于用户和商品的配对来查找，该商品是否已经添加到了该用户的购物车当中
    let list = await DB.query('SELECT * FROM trolley_user WHERE trolley_user.id = ? AND trolley_user.user = ?', [product.id, user])

    // 若得到返回结果为0，则代表商品还未添加，直接设置数量为1，
    // 并把商品，用户，和数量的信息插入到购物车的数据库中。
    // 若得到的返回结果大于0，则代表商品已经在购物车中，获取现有商品数量并加1。
    // 把商品，用户，和更新后的数量更新至购物车的数据库中，在购物车的数据库中，每一对用户和商品的配对只会出现一次，
    // 否则如果用户想在购物车中添加多个某一商品的话，数据库会产生大量的重复记录，并且统计的时候也非常麻烦，
    // 因此当购物车中已有商品时，我们用的是更新数量的方法而不是重新插入
    if (!list.length) {
      // 商品还未添加到购物车
      await DB.query('INSERT INTO trolley_user(id, count, user) VALUES (?, ?, ?)', [product.id, 1, user])
    } else {
      // 商品之前已经添加到购物车
      let count = list[0].count + 1
      await DB.query('UPDATE trolley_user SET count = ? WHERE trolley_user.id = ? AND trolley_user.user = ?', [count, product.id, user])
    }

    ctx.state.data = {}

  },

  /**
   * 拉取购物车商品列表
   * 
   */
  // 搭建显示购物车商品的 API 接口 
  list: async ctx => {
    // 通过用户的 openId 我们获取用户的购物车列表信息
    let user = ctx.state.$wxInfo.userinfo.openId

    ctx.state.data = await DB.query('SELECT * FROM trolley_user LEFT JOIN product ON trolley_user.id = product.id WHERE trolley_user.user = ?', [user])
  },

  /**
   * 更新购物车商品列表
   * 
   */
  // 搭建同步更新的 API 接口
  update: async ctx => {
    // 获取用户和商品列表
    let user = ctx.state.$wxInfo.userinfo.openId
    let productList = ctx.request.body.list || []

    // 购物车旧数据全部删除
    // 删除该用户下的所有购物车商品信息
    await DB.query('DELETE FROM trolley_user WHERE trolley_user.user = ?', [user])

    let sql = 'INSERT INTO trolley_user(id, count, user) VALUES '
    let query = []
    let param = []

    // 然后通过循环的方式重新插入最新的内容
    productList.forEach(product => {
      query.push('(?, ?, ?)')

      param.push(product.id)
      param.push(product.count || 1)
      param.push(user)
    })

    await DB.query(sql + query.join(', '), param)

    ctx.state.data = {}
  },
}