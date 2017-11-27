# react-template-render [![npm version](https://badge.fury.io/js/react-template-render.svg)](https://badge.fury.io/js/react-template-render) [![dependency status](https://david-dm.org/danneu/react-template-render.svg)](https://david-dm.org/danneu/react-template-render)

    npm install react-template-render

Use React as your server-side HTML templating library the same way you'd use Pug, Nunjucks, Handlebars, etc.

Not intended to be used for anything more clever that 100% server-side rendering.

```javascript
const makeRender = require('react-template-render')

const root = require('path').join(__dirname, 'views')

// `render` is an object with two functions: { string(), stream() }
const render = makeRender(root, { parent: 'parent' })

// As string
// Expects files ./views/template.jsx and ./views/parent.jsx to exist
render.string('template', { foo: 42 })

// As stream
render.stream('template', { foo: 42 })
```

Check out the `example/` folder for a minimal demo using Koa: `cd example && npm install && npm start`.

## Usage

The library exports a single function that takes some options and returns a renderer. The first argument is required as
it specifies the directory that holds your .jsx templates.

These are the default options.

```javascript
const makeRender = require('react-template-render')
const root = require('path').join(__dirname, 'views')
const render = makeRender(root, {
    parent: null,
    prefix: '<!doctype html>',
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
    extensions: ['.jsx'],
})
```

    npm i babel-register babel-preset-react

For info on precompiling, check out: https://github.com/babel/example-node-server#getting-ready-for-production-use

Note that if you precompile, babel will change ".jsx" extensions to ".js" which will break your `require()`s if you use
`require('homepage.jsx')` instead of `require('homepage')`. My solution is to just leave off the extension entirely.

This way, your code will work in development since Babel resolves ".jsx" files, yet it will still work after compilation
since `require` natively works with ".js" files.

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
const makeRender = require('react-template-render')
const root = require('path').join(__dirname, 'views')
const render = makeRender(root, { parent: 'parent' })

const html = render('child', { greeting: 'hello', title: "child's title" })
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
* You can validate the data passed into your templates with React's
  [PropTypes](https://reactjs.org/docs/typechecking-with-proptypes.html).

## Drawbacks

* Needs to be compiled.
* I miss some of Pug's ergonomics like being able to pleasantly write an inline `script.` / filter when it's the
  simplest solution.
* Have to deal with React's "children must have keys" warnings even though the warning doesn't apply to you.

## Koa example

A fully working Koa example can be found in the `example/` folder.

    cd example && npm install && npm start

But for the sake of readme skimmability, here's the gist of what the Koa middleware would look like:

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

const root = require('path').join(__dirname, 'views')
app.use(middleware(root, { parent: 'layout' }))

app.get('/users/:id', async ctx => {
    const { id } = ctx.params
    const user = await db.getUser(id)
    ctx.assert(user, 404)
    ctx.render('show-user', {
        title: `Profile of ${user.uname}`,
        user,
    })
})
```

## Tips and notes

* Remember that `React` must be in scope of your jsx templates. i.e. just put `const React = require('react')` as the
  first line of every .jsx file.
* Remember to set `NODE_ENV=production` in production which will significantly speed up React rendering.
* This library uses `require(template)` to load templates which means that templates are loaded synchronously and cached
  for the process lifetime until the server is reset. Just use `nodemon --ext jsx server.js` in development to trigger
  server reboot.
* This library uses the [debug](https://www.npmjs.com/package/debug) module to print out useful input. If you're having
  trouble getting your template paths to load, boot your server with `DEBUG=react-template-render` to see the
  parent/child paths that this library is attempting to load.
* Name your components with assignment, e.g. `const Component = () => <div></div>; module.exports = Component`. This
  way, React can tell you the name of the component in its debug/warning output. If you instead wrote this:
  `module.exports = () => <div></div>` or `const Component = module.exports = () => <div></div>`, then React will not be
  able to discern the name and the component would show up unhelpfully as "Unknown".
