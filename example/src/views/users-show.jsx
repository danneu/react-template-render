const React = require('react')
const PropTypes = require('prop-types')

const UserShow = ({ user }) => (
    <div>
        <h1>{user.uname}</h1>
    </div>
)

module.exports = UserShow

UserShow.propTypes = {
    user: PropTypes.object.isRequired,
    title: PropTypes.string.isRequired,
}
