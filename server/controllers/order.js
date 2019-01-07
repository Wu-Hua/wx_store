// 实现订单购买逻辑

// 导入数据库操作代码 bd.js
const DB = require('../utils/db.js')

// 对外输出业务逻辑的接口
module.exports = {
  /**
   * 创建订单
   * 
   */

  // 创建 add 接口实现商品购买
  // 在购买过程中需要同时操作订单用户表和订单商品表
  add: async ctx => {
    // 对于订单用户表，我们需要用户的唯一标识 openId 来识别不同的用户
    // 并将用户的该条购买信息存入 order_user 表中
    // 在创建数据表的过程中，已经设置了订单时间的自动更新，和订单id的自动增加，因此我们在插入订单用户表的时候只需要提供 user 字段
    let user = ctx.state.$wxInfo.userinfo.openId

    // 然后我们来操作订单商品表。
    // 在后续写客户端逻辑的时候我们会把要购买的商品列表存放在 list 变量中进行传输，因此这里我们读取了 body 下的 list。
    /**
     * 另外 || 代表或运算符，
     * 它是一种便捷的写法，若 list 存在且为真，则将 list 赋值给 productList；
     * 否则将空的列表 [] 赋值给它。这种写法类似于使用 if/else 对 list 进行判断。
     */
    let productList = ctx.request.body.list || []

    let isInstantBuy = !!ctx.request.body.isInstantBuy


    // 插入订单至 order_user 表
    let order = await DB.query('insert into order_user(user) values (?)', [user])

    // 插入订单至 order_product 表
    // 我们从插入订单用户表返回的数据中获得 orderId，
    let orderId = order.insertId

    // 然后构建插入订单商品表的 SQL 代码。
    let sql = 'INSERT INTO order_product (order_id, product_id, count) VALUES '

    // 插入时所需要的数据和参数
    let query = []
    let param = []

    // 从购物车删除时所需要的数据和参数
    let needToDelQuery = []
    let needToDelIds = []


    // 不过目前 productList 只能包含一个商品，若它包含多个商品，我们还需要使用循环遍历来添加所有的商品。
    productList.forEach(product => {
      query.push('(?, ?, ?)')

      param.push(orderId)
      param.push(product.id)
      param.push(product.count || 1)

      needToDelQuery.push('?')
      needToDelIds.push(product.id)

    })

    await DB.query(sql + query.join(', '), param)

    if (!isInstantBuy) {
      // 非立即购买，购物车旧数据全部删除，此处本应使用事务实现，此处简化了
      await DB.query('DELETE FROM trolley_user WHERE trolley_user.id IN (' + needToDelQuery.join(', ') + ') AND trolley_user.user = ?', [...needToDelIds, user])
    }

    ctx.state.data = {}

  },

  /**
   * 获取已购买订单列表
   * 
   */
  // 下载订单数据的API
  // 这里是一个 get 请求，并且要综合数据库中两个订单表的信息，
  // API 取名为 list 与之前一样输入异步函数 async 
  list: async ctx => {
    // 接着，我们首先输入这行代码，获取用户的个人 openId
    let user = ctx.state.$wxInfo.userinfo.openId

    // 接着，我们执行这行代码，来获取我们想要的数据
    /** 
     * 具体来说，这一行 SQL 代码执行了这样的功能，
     * 首先，在 order_user 表当中，基于用户的 openId 来获取用户有那些订单，
     * 它会查询这个表中 user 的值等于 openId 的行，并将对应的编号取出来
     * 接着，再凭获得的订单编号，前往 order_product 表当中，来查询每一个订单的商品情况，
     * 对于每一个订单的编号，它会返回这个订单，都有那些商品和他们的编号对应，以及商品数量是多少，
     * 最后，它再根据获得的商品编号，前往 product 表当中，获得商品对应的图像以及价格等。
     * 这里返回的图像价格等信息，都是需要在用户界面展示的信息，因此这些代码无论多复杂，他们本质上都是服务于我们小程序的功能的 
     */
    let list = await DB.query('SELECT order_user.id AS `id`, order_user.user AS `user`, order_user.create_time AS `create_time`, order_product.product_id AS `product_id`, order_product.count AS `count`, product.name AS `name`, product.image AS `image`, product.price AS `price` FROM order_user LEFT JOIN order_product ON order_user.id = order_product.order_id LEFT JOIN product ON order_product.product_id = product.id WHERE order_user.user = ? ORDER BY order_product.order_id', [user])

    // 最后我将返回的数据，分装起来返还给用户
    // 将数据库返回的数据组装成页面呈现所需的格式
    // 这里的工作，实际上和构建一个字典有些类似，我们以订单的编号为键值，接着将具有相同订单编号的订单，存放到一个数组当中，
    // ret 是最后的返回变量
    // cacheMap 是判断一个订单编号是否被遍历过的标志，
    // block 是一个中间变量，用来存放订单信息
    let ret = []
    let cacheMap = {}
    let block = []
    let id = 0
    // 这里的代码是对 list 每个项进行遍历
    // 我们记它的一个项为 order ，如果 order 中的订单编号没有出现过，则我们向返回的 ret 这个数组当中，增加一个项，并且记录下这个新的订单对应的信息
    // 如果订单编号没出现过
    list.forEach(order => {
      if (!cacheMap[order.id]) {
        block = []
        ret.push({
          id: ++id,
          list: block
        })

        // 同时将将这个订单编号设置为出现过
        cacheMap[order.id] = true
      }
      // 则我们向 block 中传入这个订单对应的商品信息
      block.push(order)
    })

    ctx.state.data = ret
  },

}