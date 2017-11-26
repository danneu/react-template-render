const React = require('react')
const PropTypes = require('prop-types')

const Master = ({ children, title }) => (
    <html>
        <head>
            <title>{title ? `${title} - Example.com` : 'Example.com'}</title>
        </head>
        <body>
            <nav>
                <li>
                    <a href="/">Home</a>
                </li>
                <li>
                    <a href="/users">Users</a>
                </li>
            </nav>
            <hr />
            <div>{children}</div>
        </body>
    </html>
)

module.exports = Master

Master.propTypes = {
    children: PropTypes.node.isRequired,
    title: PropTypes.string,
}
