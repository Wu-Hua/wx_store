// 登录授权接口
module.exports = async (ctx, next) => {
    // 通过 Koa 中间件进行登录之后
    // 登录信息会被存储到 ctx.state.$wxInfo
    // 具体查看：

    /**
     * 这一行的代码表示，在授权登陆的情况下，我们将用户的数据、当前时间存储在返回数据中，返回给用户。
     * 如果没有登陆，则返回数据为空，即用户登陆验证失败。
     */
    if (ctx.state.$wxInfo.loginState) {
        ctx.state.data = ctx.state.$wxInfo.userinfo
        ctx.state.data['time'] = Math.floor(Date.now() / 1000)
    }
}
