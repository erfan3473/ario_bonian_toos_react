// src/screens/ProfileScreen.jsx
import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosInstance';
import Loader from '../components/Loader';
import Message from '../components/Message';

const ProfileScreen = () => {
  const navigate = useNavigate();
  const { userInfo } = useSelector((state) => state.userLogin);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [imageFile, setImageFile] = useState(null);

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: '' }

  // اگر لاگین نیست، بفرستش به صفحه auth
  useEffect(() => {
    if (!userInfo) {
      navigate('/auth');
      return;
    }

    // مقداردهی اولیه از userInfo
    setFirstName(userInfo.first_name || '');
    setLastName(userInfo.last_name || '');
    setUsername(userInfo.username || '');
    setPhoneNumber(userInfo.profile?.phone_number || '');
  }, [userInfo, navigate]);

  const submitHandler = async (e) => {
    e.preventDefault();
    if (!userInfo) return;

    setLoading(true);
    setMessage(null);

    
    try {
      const formData = new FormData();
      formData.append('first_name', firstName);
      formData.append('last_name', lastName);
      formData.append('username', username);
      if (phoneNumber) formData.append('phone_number', phoneNumber);
      if (password) formData.append('password', password);
      if (imageFile) formData.append('image', imageFile);

      const { data } = await axiosInstance.put('/users/profile/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      // قبلی رو از localStorage بخونیم
      const prev = JSON.parse(localStorage.getItem('userInfo') || '{}');

      // توکن‌های قبلی رو نگه می‌داریم، دیتاهای جدید یوزر رو می‌ریزیم روش
      const merged = {
        ...prev,   // access, refresh, هرچی قبلاً بوده
        ...data,   // first_name, last_name, username, profile, ...
      };

      // و اینو ذخیره می‌کنیم
      localStorage.setItem('userInfo', JSON.stringify(merged));

      setMessage({ type: 'success', text: 'پروفایل با موفقیت به‌روزرسانی شد.' });

      // اگه دوست داری همچنان رفرش کنی:
      setTimeout(() => {
        window.location.reload();
      }, 800);
    } catch (error) {
      const errMsg =
        error.response?.data?.detail ||
        error.response?.data?.username ||
        error.response?.data?.phone_number ||
        error.message;
      setMessage({ type: 'error', text: String(errMsg) });
    } finally {
      setLoading(false);
    }
  };

  if (!userInfo) return null;

  return (
    <div className="max-w-xl mx-auto bg-gray-800 p-6 rounded-lg shadow">
      <h1 className="text-xl font-bold mb-4 text-gray-100">پروفایل من</h1>

      {loading && <Loader />}
      {message && (
        <Message variant={message.type === 'success' ? 'success' : 'danger'}>
          {message.text}
        </Message>
      )}

      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-300 mb-1">نام</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="نام"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">نام خانوادگی</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="نام خانوادگی"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">نام کاربری</label>
          <input
            type="text"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="نام کاربری"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">شماره موبایل</label>
          <input
            type="tel"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="09xxxxxxxxx"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">رمز عبور جدید (اختیاری)</label>
          <input
            type="password"
            className="w-full px-3 py-2 rounded bg-gray-900 border border-gray-700 text-sm text-white"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="اگر نمی‌خوای عوض کنی، خالی بذار"
          />
        </div>

        <div>
          <label className="block text-sm text-gray-300 mb-1">تصویر پروفایل</label>
          <input
            type="file"
            accept="image/*"
            className="w-full text-sm text-gray-300"
            onChange={(e) => setImageFile(e.target.files[0] || null)}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2 rounded bg-blue-600 hover:bg-blue-700 text-sm font-semibold text-white mt-2 disabled:opacity-50"
        >
          ذخیره تغییرات
        </button>
      </form>
    </div>
  );
};

export default ProfileScreen;
