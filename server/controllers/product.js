// 实现商品相关的业务逻辑代码

// 表示我们将这个代码中的功能，导入作为BD
// 进入到我们这段代码中，所以我们在之后的代码中可以通过bd.的形式，调用 bd.js 代码的功能
const DB = require('../utils/db.js');

// 这里表示我们将这个内容打包导出，供外界函数调用
// 这里那是一个对象，他的名字，是函数的名称，对应的值是，函数的功能。
// 我们来写我们列出所有商品数据的功能，它的名字是list
module.exports = {
  // 下面一行的 ctx 是小程序的中间件
  // 这里的作业是，我们将获取的数据暂存到这个data变量当中，以便服务器稍后返回给用户
  list: async ctx => {
    // 看到这里实际上执行了，DB.query语句，也就是数据库的查询语句
    // 它 从商品表中，选出了所有商品所有数据
    // 接着，把这个数据打包储存在ctx.state.data中
    // 接着，这我看到有 saync 以及 await 这两个关键字
    // 这里声明了一个异步函数
    ctx.state.data = await DB.query("SELECT * FROM product;");
  },

  // 添加一个API的名字detail，来表明，这是一个下载商品详情数据的API
  // 接着我们像之前一样输入异步函数
  detail: async ctx => {
    // 这行代码来获取API链接中的商品编号
    // 下面的id本来是一个字符型的变量，而通过这样 + 的操作能样这个字符型变量，强制转化为一个整数型的变量
    // 数据库中的商品编号也是一个整数，这样，我们在数据库的查询中就可以使用这个获得的编号，来获取对应的商品数据
    let productId = + ctx.params.id
    let product

    if (!isNaN(productId)) {
      // 下面这行代码，真正的从数据库中读取数据
      // 注意到，这里的SQL语句，它的含义是查询商品product表中ID的值
      // 接下来去到routes文件夹下的index.js实现路由的功能
      product = (await DB.query('select * from product where product.id = ?', [productId]))[0];
    } else {
      product = {}
    }

    product.commentCount = (await DB.query('SELECT COUNT(id) AS comment_count FROM comment WHERE comment.product_id = ?', [productId]))[0].comment_count || 0
    product.firstComment = (await DB.query('SELECT * FROM comment WHERE comment.product_id = ? LIMIT 1 OFFSET 0', [productId]))[0] || null
    
    ctx.state.data = product
  }
}