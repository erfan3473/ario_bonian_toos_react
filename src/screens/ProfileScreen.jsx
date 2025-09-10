// مسیر: src/screens/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetails, updateUserProfile } from '../actions/userActions';
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants';

export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  // const [email, setEmail] = useState(''); // ❌ ایمیل حذف شد
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const userDetails = useSelector((state) => state.userDetails);
  const { loading, error, user } = userDetails;

  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;

  const userUpdateProfile = useSelector((state) => state.userUpdateProfile);
  const { success } = userUpdateProfile;

  useEffect(() => {
    if (!userInfo) {
      navigate('/auth');
    } else {
      if (!user || !user.username || success) {
        dispatch({ type: USER_UPDATE_PROFILE_RESET });
        dispatch(getUserDetails('profile'));
      } else {
        setUsername(user.username);
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        // setEmail(user.email || ''); // ❌ ایمیل حذف شد
      }
    }
  }, [dispatch, navigate, userInfo, user, success]);

  const submitHandler = (e) => {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage('رمز عبور با تکرارش یکسان نیست');
    } else {
      dispatch(updateUserProfile({
        id: user.id,
        username,
        first_name: firstName,
        last_name: lastName,
        // email, // ❌ ایمیل حذف شد
        password
      }));
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 rounded-2xl bg-gradient-to-br from-black/30 to-gray-900/10 border border-gray-800 shadow-xl">
      <h2 className="text-2xl font-extrabold mb-6">پروفایل کاربری</h2>

      {message && <div className="text-sm text-yellow-300 bg-yellow-900/30 p-3 rounded-md text-center mb-4">{message}</div>}
      {error && <div className="text-sm text-red-400 bg-red-900/30 p-3 rounded-md text-center mb-4">{error}</div>}
      {success && <div className="text-sm text-green-400 bg-green-900/30 p-3 rounded-md text-center mb-4">پروفایل با موفقیت بروزرسانی شد ✅</div>}
      {loading && <div className="text-center text-gray-400">در حال بارگذاری...</div>}

      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block mb-1 text-sm text-gray-300">نام کاربری</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block mb-1 text-sm text-gray-300">نام</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block mb-1 text-sm text-gray-300">نام خانوادگی</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        
        {/* ❌ بخش ورودی ایمیل به طور کامل حذف شد */}

        <div className="border-t border-gray-700/50 pt-4">
          <p className="text-sm text-gray-400 mb-2">برای تغییر رمز عبور، فیلدهای زیر را پر کنید:</p>
          <div>
            <label className="block mb-1 text-sm text-gray-300">رمز عبور جدید</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div>
          <label className="block mb-1 text-sm text-gray-300">تکرار رمز عبور جدید</label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800/40 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <button
          type="submit"
          className="w-full py-3 mt-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow-md hover:scale-[1.01] transition-transform"
        >
          بروزرسانی پروفایل
        </button>
      </form>
    </div>
  );
}