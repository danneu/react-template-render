const React = require('react')
const PropTypes = require('prop-types')

const UsersList = ({ users }) => (
    <div>
        <h1>All Users</h1>
        {users.map((user) => (
            <UserItem user={user} />
        ))}
    </div>
)

module.exports = UsersList

UsersList.propTypes = {
    users: PropTypes.array.isRequired,
    title: PropTypes.string.isRequired,
}

const UserItem = ({ user }) => (
    <li>
        <a href={`/users/${user.id}`}>{user.uname}</a>
    </li>
)
