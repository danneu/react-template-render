# react-template-render

    npm install react-template-render

Use React as your server-side HTML templating library the same way you'd use Pug, Nunjucks, Handlebars, etc.

Not intended to be used for anything more clever that 100% server-side rendering.

```javascript
const makeRender = require('react-template-render')

const render = makeRender('./views', { parent: 'parent.jsx' })

render.string('template.jsx', { foo: 42 }) // Buffer to memory
render.stream('template.jsx', { foo: 42 }) // Stream response
```

## Usage

The library exports a single function that takes some options and returns a renderer. The first argument is required as
it specifies the directory that holds your templates.

These are the default options.

```javascript
const makeRender = require('react-template-render')
const render = makeRender('./views', {
    locals: {},
    ext: '.jsx',
    parent: null,
})
```

* `locals` gets passed into every template. Template-level locals override them. Since you can just `require()` librarys
  from your jsx files, this isn't as useful as it is in other templating libs.
* `ext` is appended to the end of your template if you leave off an extension. For example, it lets you write
  `render('show-user')` instead of `render('show-user.jsx')`.
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

## Extras

This library provides some extra features:

* Implements template inheritance. Set the `{ parent: 'parent-template.jsx' }` option (or override it per-template) to
  choose a parent component. Your template component will be passed to it as its child: `<Parent><Child /><Parent>`. The
  parent just has to render its `children` prop: `Parent = ({children}) => <div>{children}</div>`.
* Prepends its html output with the `<!doctype html>` directive since you're unable to create that node yourself in jsx.

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

Here's how you could write koa middleware that implements the familiar `ctx.render('template.jsx', { foo: 'bar' })`
method which streams directly to the response.

```javascript
const makeRenderer = require('react-template-render')

const middleware = (root, opts) => {
    return async (ctx, next) => {
        // For when you want to call stream() or string() yourself
        //
        // e.g. Maybe you want to cache some html output to disk:
        //
        //     const html = ctx.renderer.string('template.jsx')
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
        'show-user.jsx',
        {
            title: `Profile of ${user.uname}`,
            user,
        },
        { parent: 'dashboard.jsx' }
    )
})
```
