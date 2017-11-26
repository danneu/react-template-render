require('babel-register')({
    presets: [['react']],
    extensions: ['.jsx'],
})

const Koa = require('koa')
const logger = require('koa-logger')
const renderMiddleware = require('./renderware')

const viewsDir = require('path').join(__dirname, 'views')

const app = new Koa()

app.use(logger())
app.use(
    renderMiddleware(viewsDir, {
        parent: 'master',
    })
)
app.use(require('./router').routes())

app.listen(3000, () => {
    console.log('listening on http://localhost:3000')
})
