// src/screens/AuthScreen.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loginThunk, registerThunk } from '../features/users/userSlice'
import { useNavigate } from 'react-router-dom'

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('') // optional
  const [password, setPassword] = useState('')
  const [password2, setPassword2] = useState('')
  const [message, setMessage] = useState(null)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const userLogin = useSelector(state => state.userLogin)
  const { loading: loadingLogin, error: errorLogin, userInfo } = userLogin

  const userRegister = useSelector(state => state.userRegister)
  const { loading: loadingRegister, error: errorRegister } = userRegister

  useEffect(() => {
    if (userInfo) {
      if (userInfo.isAdmin) navigate('/admin/users')
      else navigate('/')
    }
  }, [userInfo, navigate])

  const submitHandler = (e) => {
    e.preventDefault()
    setMessage(null)

    if (isRegister) {
      if (password !== password2) {
        setMessage('رمزهای عبور یکسان نیستند')
        return
      }

      // ✅ dispatch as object (matches createAsyncThunk signature)
      dispatch(registerThunk({ username, email, password, password2 }))
        .unwrap()
        .catch(err => {
          // unwrap() اجازه میده خطاهای rejected رو اینجا بگیریم
          console.error('register error (unwrapped):', err)
          // اگر backend پیام خطای detail فرستاده باشه بعضاً شکلش { detail: "..." } یا { field: [...] }
          if (err?.detail) setMessage(err.detail)
          else if (typeof err === 'string') setMessage(err)
          else setMessage('ثبت‌نام با خطا مواجه شد')
        })

    } else {
      dispatch(loginThunk({ username, password }))
        .unwrap()
        .catch(err => {
          console.error('login error (unwrapped):', err)
          if (err?.detail) setMessage(err.detail)
          else if (typeof err === 'string') setMessage(err)
          else setMessage('ورود با خطا مواجه شد')
        })
    }
  }

  return (
    <div className="max-w-md mx-auto mt-10 p-4 sm:p-0">
      <div className="rounded-2xl p-8 bg-gradient-to-br from-black/50 to-gray-900/30 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{isRegister ? 'ثبت‌نام کاربر جدید' : 'ورود به حساب کاربری'}</h3>
          <button
            onClick={() => { setIsRegister(prev => !prev); setMessage(null) }}
            className="text-sm px-3 py-1 rounded-md bg-transparent border border-gray-700 hover:bg-gray-800 transition-colors"
          >
            {isRegister ? 'فرم ورود' : 'فرم ثبت‌نام'}
          </button>
        </div>

        <form onSubmit={submitHandler} className="space-y-4" noValidate>
          <div>
            <label className="text-sm text-gray-200">نام کاربری</label>
            <input
              className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: arman666"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-sm text-gray-200">ایمیل (اختیاری)</label>
              <input
                type="email"
                className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@mail.com"
              />
            </div>
          )}

          <div>
            <label className="text-sm text-gray-200">رمز عبور</label>
            <input
              type="password"
              className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <div>
              <label className="text-sm text-gray-200">تکرار رمز عبور</label>
              <input
                type="password"
                className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={password2}
                onChange={(e) => setPassword2(e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>
          )}

          <div>
            <button
              type="submit"
              className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 font-semibold shadow-md hover:scale-[1.01] transition-transform"
            >
              {isRegister ? (loadingRegister ? 'در حال ثبت...' : 'ثبت‌نام') : (loadingLogin ? 'در حال ورود...' : 'ورود')}
            </button>
          </div>

          {message && (
            <div className="text-sm text-yellow-300 bg-yellow-900/30 p-3 rounded-md text-center">
              {message}
            </div>
          )}

          {(errorLogin || errorRegister) && (
            <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md text-center">
              {errorRegister || errorLogin}
            </div>
          )}
        </form>

        <div className="mt-8 border-t border-gray-800 pt-6">
          <div className="text-sm text-gray-300 text-center mb-3">تست سریع با کاربران پیش‌فرض</div>
          <div className="flex justify-center gap-3">
            <button
              type="button"
              onClick={() => { setUsername('admin'); setPassword('adminpass'); }}
              className="px-3 py-2 text-xs rounded-md bg-gray-800/60 hover:bg-gray-700/80 transition-colors"
            >پر کردن ادمین</button>
            <button
              type="button"
              onClick={() => { setUsername('user1'); setPassword('userpass'); }}
              className="px-3 py-2 text-xs rounded-md bg-gray-800/60 hover:bg-gray-700/80 transition-colors"
            >پر کردن کاربر</button>
          </div>
        </div>
      </div>
    </div>
  )
}
