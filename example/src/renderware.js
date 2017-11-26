const makeRender = require('../../src')

// Adds the ctx.render() method to our koa context available in each route.
module.exports = (root, opts) => {
    return async (ctx, next) => {
        ctx.render = (template, locals, overrides) => {
            ctx.type = 'html'
            ctx.body = makeRender(root, opts).stream(template, locals, overrides)
        }

        return next()
    }
}
