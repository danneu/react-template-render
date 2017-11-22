# react-template-render

    npm install react-template-render

Use React as your server-side HTML templating library the same way you'd use Pug, Nunjucks, Handlebars, etc.

Not intended to be used for anything more clever that 100% server-side rendering.

```javascript
const makeRender = require('react-template-render')

const render = makeRender('./views', { parent: 'parent' })

// As string
render.string('template', { foo: 42 })

// As stream
render.stream('template', { foo: 42 })
```

## Usage

The library exports a single function that takes some options and returns a renderer. The first argument is required as
it specifies the directory that holds your .jsx templates.

These are the default options.

```javascript
const makeRender = require('react-template-render')
const render = makeRender('./views', {
    parent: null,
})
```

* `parent` is a template path (thus relative to the root) of a parent template that will receive your rendered template
  as a child (`<parent>child</parent>`).

These options can be overridden ad-hoc via the third argument to `.string()`/`.stream()`:

```javascript
const html = render('profile', { name: 'katie' }, { parent: 'katies-layout' })
```

## JSX compilation in Node

Simplest way I know how is with [babel-register](https://babeljs.io/docs/usage/babel-register/).

Put this at the top of your server's entry-point:

```javascript
require('babel-register')({
    presets: ['react'],
    plugins: ['transform-object-rest-spread'],
})
```

    npm i babel-register babel-preset-react babel-plugin-transform-object-rest-spread

For info on precompiling, check out: https://github.com/babel/example-node-server#getting-ready-for-production-use

Note that if you precompile, babel will change ".jsx" extensions to ".js" which will break your `require()`s. My
solution is to just leave off the extension entirely.

This way, your code will work in development since Babel resolves ".jsx" files, yet it will still work after
compilation.

## Extras

This library provides some extra features:

* Implements template inheritance. Set the `{ parent: 'parent-template' }` option (or override it per-template) to
  choose a parent component. Your template component will be passed to it as its child: `<Parent><Child /></Parent>`.
  The parent just has to render its `children` prop: `Parent = ({children}) => <div>{children}</div>`.
* Prepends its html output with the `<!doctype html>` directive since you're unable to create that node yourself in jsx.

Example parent.jsx:

```javascript
const React = require('react')

module.exports = ({ children, title }) => (
    <html>
        <head>
            <title>{title ? title + ' - Example.com' : 'The Best Example - Example.com'}</title>
        </head>
        <body>{children}</body>
    </html>
)
```

Example child.jsx:

```javascript
const React = require('react')

module.exports = ({ greeting }) => <div>{greeting}, world!</div>
```

All togther:

```javascript
const html = render('child', { greeting: 'hello', title: "child's title" }, { parent: 'parent' })
```

```html
<!doctype html>
<html>
    <head>
        <title>child's title - Example.com</title>
    </head>
    <body>hello, world!</body>
</html>
```

## Benefits of jsx on the server

* JSX tooling is pretty good. Likely better than the templating library you're already using.
* You can just `require()` code you need directly from your templates.
* It's trivial to break apart a template into bite-sized components.
* It's streamable.

## Drawbacks

* Needs to be compiled.
* I miss some of Pug's ergonomics like being able to pleasantly write an inline `script.` / filter when it's the
  simplest solution.
* Not as fast as Pug.
* Have to deal with React's "children must have keys" warnings even though you don't need them.

## Koa example

Here's how you could write koa middleware that implements the familiar `ctx.render('template', { foo: 'bar' })` method
which streams directly to the response.

```javascript
const makeRenderer = require('react-template-render')

const middleware = (root, opts) => {
    return async (ctx, next) => {
        // For when you want to call stream() or string() yourself
        //
        // e.g. Maybe you want to cache some html output to disk:
        //
        //     const html = ctx.renderer.string('template')
        //     await writeFile(html, { encoding: 'utf8' })
        //
        ctx.renderer = makeRenderer(root, opts)

        // Convenience function for streaming to the response
        ctx.render = (template, locals, overrides) => {
            ctx.type = 'html'
            ctx.body = ctx.renderer.stream(template, locals, overrides)
        }

        return next()
    }
}

const app = new Koa()

app.use(middleware(require('path').join(__dirname, 'views')))

app.get('/users/:id', async ctx => {
    const { id } = ctx.params
    const user = await db.getUser(id)
    ctx.assert(user, 404)
    ctx.render(
        'show-user',
        {
            title: `Profile of ${user.uname}`,
            user,
        },
        { parent: 'dashboard' }
    )
})
```
