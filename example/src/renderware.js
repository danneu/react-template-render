const makeRenderer = require('../../src')

// Adds the ctx.render() method to our koa context available in each route.
module.exports = (root, opts) => {
    return async (ctx, next) => {
        ctx.renderer = makeRenderer(root, opts)

        ctx.render = (template, locals, overrides) => {
            ctx.type = 'html'
            ctx.body = ctx.renderer.stream(template, locals, overrides)
        }

        return next()
    }
}
