const { PassThrough } = require('stream')
const { join } = require('path')
const React = require('react')
const { renderToStaticNodeStream, renderToStaticMarkup } = require('react-dom/server')
const debug = require('debug')('react-template-render')

const defaultOptions = {
    prefix: '<!doctype html>',
    parent: null,
    // If false, silence React's https://fb.me/react-warning-keys warning.
    keyPropWarnings: false,
}

// The render object has two methods { string(), stream() }
// It can be reused.
module.exports = function makeRender(root, opts) {
    opts = Object.assign({}, defaultOptions, opts)

    if (process.env.NODE_ENV !== 'production' && !opts.keyPropWarnings) {
        console.error = (() => {
            const _error = console.error
            const re = /^Warning: Each child in an array or iterator should have a unique "key" prop|^Warning: Each child in a list should have a unique "key" prop/
            return (...args) => {
                const line = args[0]
                if (re.test(line)) {
                    // Ignore key warnings
                } else {
                    _error(...args)
                }
            }
        })()
    }

    const getElement = (template, locals = {}, overrides = {}) => {
        opts = Object.assign({}, opts, overrides)

        const Parent = (() => {
            if (!opts.parent) return null
            const parentpath = join(root, opts.parent)
            debug('parentpath:', parentpath)
            return require(parentpath)
        })()

        const Template = (() => {
            const templatepath = join(root, template)
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
            if (opts.prefix) {
                output.write(opts.prefix)
            }
            renderToStaticNodeStream(element).pipe(output)
            return output
        },
        string(template, locals, overrides) {
            const element = getElement(template, locals, overrides)
            return (opts.prefix || '') + renderToStaticMarkup(element)
        },
    }
}
