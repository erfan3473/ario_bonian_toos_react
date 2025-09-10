// مسیر: src/screens/AuthScreen.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { login, register } from '../actions/userActions'
import { useNavigate } from 'react-router-dom'

export default function AuthScreen() {
  const [isRegister, setIsRegister] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const userLogin = useSelector(state => state.userLogin)
  const { loading: loadingLogin, error: errorLogin, userInfo } = userLogin

  const userRegister = useSelector(state => state.userRegister)
  const { loading: loadingRegister, error: errorRegister } = userRegister

  useEffect(() => {
    if (userInfo) {
      // اگر ادمین است به صفحه‌ی لیست یوزرها ببر
      if (userInfo.isAdmin) navigate('/admin/users')
      else navigate('/auth') // یا هر صفحه عمومی
    }
  }, [userInfo, navigate])

  const submitHandler = (e) => {
    e.preventDefault()
    if (isRegister) {
      dispatch(register(username, password, firstName, lastName))
    } else {
      dispatch(login(username, password))
    }
  }

  return (
    <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-8 items-center">
      {/* left: visual */}
      <div className="rounded-2xl p-8 bg-gradient-to-br from-black/40 via-purple-900/30 to-black/20 border border-gray-800 shadow-2xl">
        <div className="space-y-6">
          <h2 className="text-3xl font-extrabold">ورود / ثبت‌نام</h2>
          <p className="text-sm text-gray-400">یک تجربهٔ تیره و سینمایی — حساب بساز یا وارد شو.</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-gradient-to-br from-purple-800/30 to-black/30 border border-purple-700/20">
              <h3 className="text-sm font-semibold">امنیت</h3>
              <p className="text-xs text-gray-400 mt-1">توکن JWT در localStorage ذخیره می‌شود.</p>
            </div>
            <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-800/20 to-black/20 border border-indigo-700/10">
              <h3 className="text-sm font-semibold">طراحی</h3>
              <p className="text-xs text-gray-400 mt-1">UI تیره، انیمیشن‌های کوچک، فونت مدرن.</p>
            </div>
          </div>

          <div className="mt-4">
            <img src="data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='600' height='300'><rect rx='18' width='100%' height='100%' fill='%230b0b0f'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%23b6a7ff' font-size='34'>Dark UI • Awakened</text></svg>" alt="decor" className="rounded-lg w-full shadow-inner" />
          </div>
        </div>
      </div>

      {/* right: form */}
      <div className="rounded-2xl p-8 bg-gradient-to-br from-black/50 to-gray-900/30 border border-gray-800 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">{isRegister ? 'ثبت‌نام' : 'ورود'}</h3>
          <button
            onClick={() => setIsRegister(prev => !prev)}
            className="text-sm px-3 py-1 rounded-md bg-transparent border border-gray-700 hover:bg-gray-800"
          >
            {isRegister ? 'رفتن به ورود' : 'رفتن به ثبت‌نام'}
          </button>
        </div>

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="text-sm text-gray-200">نام کاربری</label>
            <input
              className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="مثال: arman666"
              required
            />
          </div>

          <div>
            <label className="text-sm text-gray-200">رمز عبور</label>
            <input
              type="password"
              className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800 focus:outline-none"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {isRegister && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-200">نام</label>
                  <input
                    className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="نام"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-200">نام خانوادگی</label>
                  <input
                    className="w-full mt-2 p-3 rounded-lg bg-gray-900 border border-gray-800"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="خانوادگی"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-gradient-to-r from-pink-600 to-indigo-600 font-semibold shadow-md hover:scale-[1.01] transition"
            >
              {isRegister ? (loadingRegister ? 'در حال ثبت...' : 'ثبت‌نام') : (loadingLogin ? 'در حال ورود...' : 'ورود')}
            </button>
          </div>

          {(errorLogin || errorRegister) && (
            <div className="text-sm text-red-400 bg-red-900/20 p-3 rounded-md">
              {errorRegister || errorLogin}
            </div>
          )}

          <div className="text-xs text-gray-400">
            با ورود یا ثبت‌نام، قوانین را می‌پذیرید. (بدون ایمیل — فقط username/password)
          </div>
        </form>

        <div className="mt-6">
          <div className="text-sm text-gray-300">تست سریع</div>
          <div className="flex gap-3 mt-3">
            <button
              onClick={() => { setUsername('admin'); setPassword('adminpass'); }}
              className="px-3 py-2 rounded-md bg-gray-800/60"
            >پر کردن برای ادمین</button>
            <button
              onClick={() => { setUsername('user1'); setPassword('userpass'); }}
              className="px-3 py-2 rounded-md bg-gray-800/60"
            >پر کردن برای کاربر</button>
          </div>
        </div>
      </div>
    </div>
  )
}
