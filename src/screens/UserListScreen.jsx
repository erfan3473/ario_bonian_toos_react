// مسیر: src/screens/UserListScreen.jsx
import React, { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { listUsers, deleteUser } from '../actions/userActions'
import { Link } from 'react-router-dom'

export default function UserListScreen() {
  const dispatch = useDispatch()

  const userList = useSelector(state => state.userList)
  const { loading, error, users } = userList

  const userDelete = useSelector(state => state.userDelete)
  const { loading: loadingDelete, error: errorDelete } = userDelete

  useEffect(() => {
    dispatch(listUsers())
  }, [dispatch])

  const handleDelete = (id) => {
    if (window.confirm('آیا از حذف کاربر مطمئن هستید؟')) {
      dispatch(deleteUser(id))
    }
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-black/30 to-gray-900/10 border border-gray-800 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-extrabold">لیست کاربران</h2>
        <div className="text-sm text-gray-400">مدیریت کاربران — فقط ادمین</div>
      </div>

      {loading || loadingDelete ? (
        <div className="text-center py-10">Loading...</div>
      ) : error || errorDelete ? (
        <div className="text-red-400 p-3 rounded-md bg-red-900/10">{error || errorDelete}</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-transparent">
            <thead>
              <tr className="text-left text-gray-400 text-sm border-b border-gray-800">
                <th className="py-3 px-4">ID</th>
                <th className="py-3 px-4">نام کاربری</th>
                <th className="py-3 px-4">نام</th>
                <th className="py-3 px-4">ادمین</th>
                <th className="py-3 px-4">عملیات</th>
              </tr>
            </thead>
            <tbody>
              {users && users.map(user => (
                <tr key={user.id} className="border-b border-gray-800/40 hover:bg-gray-900/20">
                  <td className="py-3 px-4 text-sm">{user.id}</td>
                  <td className="py-3 px-4 text-sm font-medium">{user.username}</td>
                  <td className="py-3 px-4 text-sm">{user.first_name} {user.last_name}</td>
                  <td className="py-3 px-4 text-sm">{user.isAdmin ? 'بله' : 'خیر'}</td>
                  <td className="py-3 px-4 text-sm flex gap-2">
                    <Link to={`/admin/users/edit/${user.id}`} className="px-3 py-1 rounded-md bg-blue-600/60">ویرایش</Link>
                    <button onClick={() => handleDelete(user.id)} className="px-3 py-1 rounded-md bg-red-600/60">حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
