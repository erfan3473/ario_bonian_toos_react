import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { getUserDetails, updateUserProfile } from '../actions/userActions'

export default function ProfileScreen({ history }) {
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()

  const userDetails = useSelector((state) => state.userDetails)
  const { loading, error, user } = userDetails

  const userLogin = useSelector((state) => state.userLogin)
  const { userInfo } = userLogin

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile)
  const { success } = userUpdateProfile

  useEffect(() => {
    if (!userInfo) {
      history.push('/login')
    } else {
      if (!user || !user.username) {
        dispatch(getUserDetails('profile'))
      } else {
        setUsername(user.username)
        setFirstName(user.first_name)
        setLastName(user.last_name)
        setEmail(user.email)
      }
    }
  }, [dispatch, history, userInfo, user])

  const submitHandler = (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage('رمز عبور با تکرارش یکسان نیست')
    } else {
      dispatch(updateUserProfile({
        id: user.id,
        username,
        first_name: firstName,
        last_name: lastName,
        email,
        password
      }))
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 rounded-2xl bg-gradient-to-br from-black/30 to-gray-900/10 border border-gray-800 shadow-xl">
      <h2 className="text-2xl font-extrabold mb-6">پروفایل من</h2>

      {message && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4">{message}</div>}
      {error && <div className="bg-red-900/20 text-red-400 p-3 rounded mb-4">{error}</div>}
      {success && <div className="bg-green-900/20 text-green-400 p-3 rounded mb-4">پروفایل آپدیت شد ✅</div>}
      {loading && <div className="text-gray-400">Loading...</div>}

      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm">نام کاربری</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">نام</label>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">نام خانوادگی</label>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">ایمیل</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">رمز عبور جدید</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700"
          />
        </div>
        <div>
          <label className="block mb-1 text-sm">تکرار رمز عبور</label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700"
          />
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 rounded-md font-bold"
        >
          بروزرسانی پروفایل
        </button>
      </form>
    </div>
  )
}
