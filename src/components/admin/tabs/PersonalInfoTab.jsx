// src/components/admin/tabs/PersonalInfoTab.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../../features/admin/adminSlice';

const PersonalInfoTab = ({ user }) => {
  const dispatch = useDispatch();
  const { loading, success, error } = useSelector((state) => state.admin.updateStatus);

  const [formData, setFormData] = useState({
    username: '',
    first_name: '',
    last_name: '',
    email: '',
    phone_number: '',
    is_admin: false,
  });

  // ✅ مقداردهی اولیه با user (وقتی user لود شد)
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        phone_number: user.profile?.phone_number || '',
        is_admin: user.is_superuser || false, // ✅ توجه: از API معمولاً is_superuser میاد
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // ✅ ارسال با فرمت صحیح
    const payload = {
      username: formData.username,
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      phone_number: formData.phone_number,
      is_admin: formData.is_admin, // Backend باید is_superuser و is_staff رو ست کنه
    };

    dispatch(updateUser({ userId: user.id, data: payload }));
  };

  if (!user) {
    return (
      <div className="text-center text-gray-500 py-10">
        لطفاً یک کاربر انتخاب کنید
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Success/Error Messages */}
      {success && (
        <div className="bg-green-900/20 border border-green-700 rounded-xl p-4">
          <p className="text-green-400">✅ اطلاعات با موفقیت ذخیره شد</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-700 rounded-xl p-4">
          <p className="text-red-400">❌ {error}</p>
        </div>
      )}

      {/* نام کاربری و ایمیل */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-bold">
            نام کاربری <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-bold">ایمیل</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* نام و نام‌خانوادگی */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-gray-300 mb-2 font-bold">نام</label>
          <input
            type="text"
            name="first_name"
            value={formData.first_name}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-gray-300 mb-2 font-bold">
            نام‌خانوادگی
          </label>
          <input
            type="text"
            name="last_name"
            value={formData.last_name}
            onChange={handleChange}
            className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
        </div>
      </div>

      {/* شماره موبایل */}
      <div>
        <label className="block text-gray-300 mb-2 font-bold">
          شماره موبایل <span className="text-red-500">*</span>
        </label>
        <input
          type="tel"
          name="phone_number"
          value={formData.phone_number}
          onChange={handleChange}
          required
          maxLength={11}
          pattern="09[0-9]{9}"
          placeholder="09123456789"
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
        />
        <p className="text-gray-500 text-sm mt-1">فرمت: 09xxxxxxxxx</p>
      </div>

      {/* سطح دسترسی - فقط ادمین */}
      <div className="bg-gradient-to-br from-purple-900/20 to-purple-800/10 rounded-xl p-6 border border-purple-700/50">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-3xl">👑</span>
          <div>
            <h3 className="text-white font-bold text-lg">سطح دسترسی مدیریتی</h3>
            <p className="text-gray-400 text-sm">
              دسترسی به پنل مدیریت کاربران و تنظیمات سیستم
            </p>
          </div>
        </div>

        <label className="flex items-center gap-4 cursor-pointer bg-gray-800/50 rounded-lg p-4 hover:bg-gray-800 transition-colors">
          <input
            type="checkbox"
            name="is_admin"
            checked={formData.is_admin}
            onChange={handleChange}
            className="w-6 h-6 rounded border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500 cursor-pointer"
          />
          <div>
            <span className="text-white font-bold text-lg">🔧 دسترسی مدیر سیستم</span>
            <p className="text-gray-400 text-sm mt-1">
              امکان مدیریت کاربران، تنظیمات سیستم، و دسترسی کامل به همه بخش‌ها
            </p>
          </div>
        </label>

        {formData.is_admin && (
          <div className="mt-4 bg-yellow-900/20 border border-yellow-700 rounded-lg p-3">
            <p className="text-yellow-400 text-sm flex items-center gap-2">
              <span>⚠️</span>
              <span>
                این کاربر به تمام بخش‌های مدیریتی شامل مدیریت کاربران و تنظیمات سیستم دسترسی خواهد داشت
              </span>
            </p>
          </div>
        )}
      </div>

      {/* نکته مهم */}
      <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
        <p className="text-blue-400 text-sm flex items-start gap-2">
          <span className="text-lg">💡</span>
          <span>
            <strong>نکته:</strong> همه افراد در سیستم به عنوان کارمند ثبت می‌شوند. 
            برای دسترسی مدیریتی، تیک "دسترسی مدیر سیستم" را فعال کنید.
          </span>
        </p>
      </div>

      {/* دکمه ذخیره */}
      <div className="flex justify-end gap-3 pt-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-8 py-3 rounded-lg font-bold transition shadow-lg flex items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin">⏳</span>
              <span>در حال ذخیره...</span>
            </>
          ) : (
            <>
              <span>💾</span>
              <span>ذخیره اطلاعات</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default PersonalInfoTab;
