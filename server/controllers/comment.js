// 实现评论提交逻辑
const DB = require('../utils/db')

module.exports = {

  /**
   * 添加评论
   */
  // 添加评论的 API 
  // 整体逻辑与添加商品到购物车非常的类似，都是获取数据
  add: async ctx => {
    // 这三行获取了用户数据，我们看到用户的数据
    // 被保存在中间件的 userinfo 这个值当中
    let user = ctx.state.$wxInfo.userinfo.openId
    let username = ctx.state.$wxInfo.userinfo.nickName
    let avatar = ctx.state.$wxInfo.userinfo.avatarUrl

    // 这里两行，是读取了请求体中的数据
    // 注意到 +ctx.request.body.product_id 这里的类型转换，
    // 以及 NaN 值的判断，是不是和我们在获取商品详细时的判断非常相似
    //  add 只是一个 put 请求,所以使用 .body 的方法来获取数据
    let productId = +ctx.request.body.product_id
    let content = ctx.request.body.content || null

    // 我们上传的数据中，新增了图像的数据，所以我们服务端的API也要修改。
    /**
     * 我们不建议在数据库中直接存储一个列表，
     * 所以我们使用 双逗号，将图像列表中的链接连接起来，构成一个较长的srting，存储在数据库当中。
     * 我们的数据表中本来就包含图像的字段，因此我们就不需要额外的对数据表进行更改了。
     */
    let images = ctx.request.body.images || []
    images = images.join(';;')


    // 执行数据库插入语句，然后返回
    if (!isNaN(productId)) {
      // 接着执行这条 SQL 语句，将我们获取到的数据，插入到 comment 评论表当中
      await DB.query('INSERT INTO comment(user, username, avatar, content,  product_id) VALUES (?, ?, ?, ?, ?, ?)', [user, username, avatar, content, images, productId])
    }

    // 最后我们返回了空值
    ctx.state.data = {}
  },

  /**
   * 获取评论列表
   */
  list: async ctx => {
    // 在服务器端，用 query.product_id 来获取这个数据
    // 因为在请求的类别不同,所以我们获取请求中包含的数据的方法也是不同的，
    // 这里是 get 请求,所以使用 .query 的方式来获取数据,
    // 而我们上面的 add 只是一个 put 请求,所以使用 .body 的方法来获取数据
    let productId = +ctx.request.query.product_id

    if (!isNaN(productId)) {
      ctx.state.data = await DB.query('select * from comment where comment.product_id = ?', [productId])
    } else {
      ctx.state.data = []
    }
  },
}