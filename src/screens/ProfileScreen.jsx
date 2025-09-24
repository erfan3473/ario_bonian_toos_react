// src/screens/ProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getUserDetailsThunk, updateUserProfileThunk } from '../features/users/userSlice';
import { USER_UPDATE_PROFILE_RESET } from '../constants/userConstants';
const API_BASE = 'http://127.0.0.1:8000';
// helper: build full url for image if needed
const buildImageUrl = (imgPath) => {
  if (!imgPath) return null;
  if (imgPath.startsWith('http')) return imgPath;
  return `${API_BASE}${imgPath.startsWith('/') ? '' : '/'}${imgPath}`;
};


export default function ProfileScreen() {
  const [username, setUsername] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState(null);

  // profile image states
  const [currentImageUrl, setCurrentImageUrl] = useState(null); // server url
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

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
        // reset update profile state (keeps compatibility with your previous constant)
        dispatch({ type: USER_UPDATE_PROFILE_RESET });
        dispatch(getUserDetailsThunk('profile'));
      } else {
        setUsername(user.username);
        setFirstName(user.first_name || '');
        setLastName(user.last_name || '');
        // read profile image from nested user.profile.image
        const img = (user.profile && user.profile.image) ? buildImageUrl(user.profile.image) : null;
        setCurrentImageUrl(img);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, navigate, userInfo, user, success]);

  useEffect(() => {
    // cleanup preview URL when component unmounts or when new file chosen
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    }
  }, [previewUrl]);

  const onFileChange = (e) => {
    const file = e.target.files && e.target.files[0];
    setSelectedImageFile(file);
    if (file) {
      const p = URL.createObjectURL(file);
      setPreviewUrl(p);
    } else {
      setPreviewUrl(null);
    }
  };

  const submitHandler = (e) => {
    e.preventDefault();
    setMessage(null);
    if (password !== confirmPassword) {
      setMessage('رمز عبور با تکرارش یکسان نیست');
      return;
    }

    // prepare payload: if image chosen, send FormData; otherwise send object
    if (selectedImageFile) {
      const fd = new FormData();
      fd.append('username', username);
      fd.append('first_name', firstName);
      fd.append('last_name', lastName);
      if (password) fd.append('password', password);
      fd.append('image', selectedImageFile);
      // dispatch wrapper
      dispatch(updateUserProfile(fd));
    } else {
      // send JSON object (updateUserProfile thunk will handle)
      dispatch(updateUserProfileThunk({
        id: user.id,
        username,
        first_name: firstName,
        last_name: lastName,
        password: password || undefined
      }));
    }
  };

  return (
    <div className="max-w-lg mx-auto mt-10 p-6 rounded-2xl bg-gradient-to-br from-black/30 to-gray-900/10 border border-gray-800 shadow-xl">
      <h2 className="text-2xl font-extrabold mb-6">پروفایل کاربری</h2>

      {/* profile image area */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-800/40 flex items-center justify-center border border-gray-700">
          {previewUrl ? (
            <img src={previewUrl} alt="preview" className="w-full h-full object-cover" />
          ) : currentImageUrl ? (
            <img src={currentImageUrl} alt="profile" className="w-full h-full object-cover" />
          ) : (
            <div className="text-gray-400 text-sm">بدون تصویر</div>
          )}
        </div>

        <div className="flex-1">
          <label className="block text-sm text-gray-300">آپلود عکس پروفایل</label>
          <input
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="mt-2 text-sm text-gray-300"
          />
          <p className="text-xs text-gray-500 mt-1">حداکثر حجم مناسب را در بک‌اند مشخص کنید (مثلاً 2MB).</p>
        </div>
      </div>

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
