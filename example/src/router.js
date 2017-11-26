const Router = require('koa-router')

const router = (module.exports = new Router())

const allUsers = {
    1: {
        id: 1,
        uname: 'foo',
    },
    2: {
        id: 2,
        uname: 'bar',
    },
    3: {
        id: 3,
        uname: 'qux',
    },
}

// In a real app you'd probably have `const db = require('./db')`
const db = {
    async getUser(id) {
        return allUsers[id]
    },
}

router.get('/', async ctx => {
    await ctx.render('homepage')
})

// Example: Here we cache the html of our static /about page
// since it never changes.

let aboutHtml

router.get('/about', async ctx => {
    ctx.type = 'html'

    if (aboutHtml) {
        ctx.body = aboutHtml
        return
    }
    console.log('caching aboutHtml...')

    aboutHtml = ctx.renderer.string('about')
    ctx.body = aboutHtml
})

router.get('/users', async ctx => {
    const users = Object.values(allUsers)
    await ctx.render('users-list', {
        users,
        title: 'All Users',
    })
})

router.get('/users/:id', async ctx => {
    let { id } = ctx.params
    id = Number.parseInt(id, 10)
    ctx.assert(id, 404)

    const user = await db.getUser(id)
    ctx.assert(user, 404)

    await ctx.render('users-show', {
        user,
        title: user.uname,
    })
})
