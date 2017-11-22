const { PassThrough } = require('stream')
const { extname, join } = require('path')
const React = require('react')
const { renderToStaticNodeStream, renderToStaticMarkup } = require('react-dom/server')
const debug = require('debug')('react-template-render')

const defaultOptions = () => ({
    locals: {},
    ext: '.jsx',
    parent: null,
})

// The render object has two methods { string(), stream() }
// It can be reused.
module.exports = function makeRender(root, opts) {
    opts = { ...defaultOptions(), ...opts }

    const getElement = (template, locals = {}, overrides = {}) => {
        opts = { ...opts, ...overrides }

        const Parent = (() => {
            if (!opts.parent) return null
            const parentpath = join(root, extname(opts.parent) ? opts.parent : opts.parent + opts.ext)
            debug('parentpath:', parentpath)
            return require(parentpath)
        })()

        const Template = (() => {
            const templatepath = join(root, extname(template) ? template : template + opts.ext)
            debug('templatepath:', templatepath)
            return require(templatepath)
        })()

        return Parent
            ? React.createElement(Parent, locals, React.createElement(Template, locals))
            : React.createElement(Template, locals)
    }

    return {
        stream(template, locals, overrides) {
            const element = getElement(template, locals, overrides)
            const output = new PassThrough()
            output.write('<!doctype html>')
            renderToStaticNodeStream(element).pipe(output)
            return output
        },
        string(template, locals, overrides) {
            const element = getElement(template, locals, overrides)
            return '<!doctype html>' + renderToStaticMarkup(element)
        },
    }
}
