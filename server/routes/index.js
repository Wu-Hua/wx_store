/**
 * ajax 服务路由集合
 * 路由相关的代码都保存在 routes 文件夹中
 */
const router = require('koa-router')({
    prefix: '/weapp'
})
const controllers = require('../controllers')

// 从 sdk 中取出中间件
// 这里展示如何使用 Koa 中间件完成登录态的颁发与验证
const { auth: { authorizationMiddleware, validationMiddleware } } = require('../qcloud')

// --- 登录与授权 Demo --- //
/** 
 * 下面两行路由多了一个参数，分别为 authorizationMiddleware 和 validationMiddleware，
 * 之前我们已经提到，HTTP请求都是无状态的请求，所以我们需要额外的信息，来帮助服务器确认用户的身份，验证登陆的情况等，那么这两个变量就是帮助我们实现这一功能的。
 * 实际上，它是帮助服务器验证登陆状态的一个中间件，在以后的开发中，你讲频繁的听到这个名字。
 * 不同的中间件有着不同的功能，在这里你只需要知道，他们能够帮助我们授权以验证登陆的状态。
 * 注意到，这里还有两个不同的中间件类型 Authorization 以及 Validation ，前者是确认登录授权的中间件，后者是验证登录状态的中间件。
 * 在接下来的学习中，我们还会遇到一些需要验证登录状态的请求，那么在那个时候，我们使用 validationMiddleware 就可以了。
 * 接着我们观察这练个接口的请求类型。
 * user 是一个下载用户的API，显然他是一个下载的请求，也就是get请求。
 * 而login登录请求也是一个下载数据的请求，用户将自己的登录凭证发送给服务器，来下载关于自己登录状态的信息，本质上也是一个下载请求。
 */ 
// 下面两行分别调用了login以及user两处的业务逻辑代码
// 下面一行，代表获取用户数据的API
// 登录接口
router.get('/login', authorizationMiddleware, controllers.login)
// 下面一行，代表验证用户是否登录的API
// 用户信息接口（可以用来验证登录态）
router.get('/user', validationMiddleware, controllers.user)

// --- 图片上传 Demo --- //
// 图片上传接口，小程序端可以直接将 url 填入 wx.uploadFile 中
router.post('/upload', controllers.upload)

// --- 信道服务接口 Demo --- //
// GET  用来响应请求信道地址的
router.get('/tunnel', controllers.tunnel.get)
// POST 用来处理信道传递过来的消息
router.post('/tunnel', controllers.tunnel.post)

// --- 客服消息接口 Demo --- //
// GET  用来响应小程序后台配置时发送的验证请求
router.get('/message', controllers.message.get)
// POST 用来处理微信转发过来的客服消息
router.post('/message', controllers.message.post)

// 获取商品列表
// 这行代码表示，我们的服务器会对一种特定的请求。
// 执行我们在 controllers.product 文件中实现的list相关的功能，即获取所有商品数据的功能。
// 这个请求有两个要求，第一，他需要的是一个get请求，也就是下载数据的请求，我们在这里进行了明确的定义，同时，这个请求链接需要是这样的形式
router.get('/product', controllers.product.list)

// 获取商品详情
// 这依然是一个GET请求
// 它有相似的API名字
// 不过这里需要注意，我们要多输入一个：ID
// 它能够将API链接中，商品的ID标记提取出来，作为参数，供后面的业务逻辑使用
// 接下来我们输入对应的业务逻辑，是列出商品详情的业务逻辑
router.get('/product/:id', controllers.product.detail)


// 创建订单
// 因为在创建订单的过程中，需要往服务器写数据，因此我们需要使用 post 的方式实现，
// 并且设置 validationMiddleware 中间件进行验证
router.post('/order', validationMiddleware, controllers.order.add)

// 显示已购买订单
router.get('/order', validationMiddleware, controllers.order.list)

// 商品添加到购物车列表
router.put('/trolley', validationMiddleware, controllers.trolley.add)

// 获取购物车商品列表
router.get('/trolley', validationMiddleware, controllers.trolley.list)

// 更新购物车商品列表
router.post('/trolley', validationMiddleware, controllers.trolley.update)

// 添加评论
// 这里指明了我们这个请求是一个 PUT 请求，名字是 comment ，需要授权登录 validationMiddleware ，
// 同时它调用了 comment 中的 add 函数，也就是添加评论的功能
router.put('/comment', validationMiddleware, controllers.comment.add)

// 获取评论列表
router.get('/comment', controllers.comment.list)


module.exports = router
