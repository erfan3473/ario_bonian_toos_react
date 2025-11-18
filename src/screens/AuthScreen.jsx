// src/screens/AuthScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useLocation } from 'react-router-dom';
import { loginWithPhone } from '../features/users/userSlice';

const AuthScreen = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const { loading, error, userInfo } = useSelector((state) => state.userLogin);

  // اگر لاگین شدیم، بفرستیمش مثلاً به /dashboard یا چیزی که دوست داری
  useEffect(() => {
    if (userInfo) {
      const redirect = new URLSearchParams(location.search).get('redirect') || '/dashboard';
      navigate(redirect);
    }
  }, [userInfo, navigate, location.search]);

  const submitHandler = (e) => {
    e.preventDefault();
    dispatch(loginWithPhone({ phone_number: phoneNumber, password }));
  };

  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 shadow-xl">
        <h1 className="text-2xl font-bold text-white mb-4 text-center">
          ورود به سامانه
        </h1>

        {error && (
          <div className="mb-3 text-sm text-red-400 bg-red-900/20 border border-red-700 rounded-md px-3 py-2">
            {error}
          </div>
        )}

        <form onSubmit={submitHandler} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-300 mb-1">
              شماره موبایل
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="مثلاً 0912xxxxxxx"
              className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-300 mb-1">
              رمز عبور
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="رمز عبور"
              className="w-full px-3 py-2 rounded-md bg-gray-800 border border-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold transition-colors"
          >
            {loading ? 'در حال ورود...' : 'ورود'}
          </button>
        </form>

        <p className="mt-4 text-xs text-gray-500 text-center">
          ورود فعلاً فقط با شماره موبایل و رمز عبور فعال است.
        </p>
      </div>
    </div>
  );
};

export default AuthScreen;
