// src/components/admin/tabs/PersonalInfoTab.jsx

import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateUser } from '../../../features/admin/adminSlice';

const PersonalInfoTab = ({ user }) => {
  const dispatch = useDispatch();
  const { loading } = useSelector((state) => state.admin.updateStatus);

  const [formData, setFormData] = useState({
    username: user?.username || '',
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    email: user?.email || '',
    phone_number: user?.profile?.phone_number || '',
    is_active: user?.is_active ?? true,
    is_staff: user?.is_staff || false,
    is_admin: user?.is_admin || false,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(updateUser({ userId: user.id, userData: formData }));
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
        <p className="text-gray-500 text-sm mt-1">
          فرمت: 09xxxxxxxxx
        </p>
      </div>

      {/* سطح دسترسی */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-white font-bold mb-4">🔐 سطح دسترسی</h3>
        <div className="space-y-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_active"
              checked={formData.is_active}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-gray-300">
              ✅ کاربر فعال (می‌تواند وارد سیستم شود)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_staff"
              checked={formData.is_staff}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 text-green-600 focus:ring-2 focus:ring-green-500"
            />
            <span className="text-gray-300">
              👔 کارمند (دسترسی به پنل کارمندی)
            </span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              name="is_admin"
              checked={formData.is_admin}
              onChange={handleChange}
              className="w-5 h-5 rounded border-gray-600 text-purple-600 focus:ring-2 focus:ring-purple-500"
            />
            <span className="text-gray-300">
              🔧 ادمین (دسترسی کامل به سیستم)
            </span>
          </label>
        </div>
      </div>

      {/* دکمه ذخیره */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-6 py-3 rounded-lg font-bold transition"
        >
          {loading ? '⏳ در حال ذخیره...' : '💾 ذخیره اطلاعات شخصی'}
        </button>
      </div>
    </form>
  );
};

export default PersonalInfoTab;
