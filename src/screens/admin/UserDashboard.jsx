// src/screens/admin/UserDashboard.jsx
import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchUserDetail } from "../../features/admin/usersSlice";

const UserDashboard = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  
  const { selectedUser, loading = {} } = useSelector((state) => state.admin.users || {});
  const userLoading = typeof loading === 'object' ? loading?.userDetail : loading;

  useEffect(() => {
    dispatch(fetchUserDetail(userId));
  }, [userId, dispatch]);

  if (userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-4xl text-blue-500 animate-pulse">⏳ در حال بارگذاری...</div>
      </div>
    );
  }

  const buttons = [
    { path: `/admin/users/${userId}/personal`, label: 'اطلاعات سیستمی', icon: '👤', color: 'from-blue-600 to-blue-800' },
    { path: `/admin/users/${userId}/organizational`, label: 'صفحه سازمانی', icon: '👔', color: 'from-emerald-600 to-emerald-800' },
    { path: `/admin/users/${userId}/contracts`, label: 'قراردادها', icon: '📋', color: 'from-purple-600 to-purple-800' },
    { path: `/admin/users/${userId}/financial`, label: 'اطلاعات مالی', icon: '💰', color: 'from-amber-600 to-amber-800' },
    { path: `/admin/users/${userId}/leave`, label: 'مدیریت مرخصی', icon: '🏖️', color: 'from-rose-600 to-rose-800' },
    { path: `/admin/users/${userId}/location-history`, label: 'تاریخچه موقعیت', icon: '📍', color: 'from-cyan-600 to-cyan-800' },
  ];

  return (
    <div className="max-w-5xl mx-auto w-full mt-8">
      {/* هدر */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-gray-900 p-6 rounded-2xl border border-gray-700 shadow-lg mb-10">
        <h1 className="text-3xl font-bold text-white mb-4 md:mb-0">
          پروفایل: {selectedUser?.first_name} {selectedUser?.last_name}
        </h1>
        <button
          onClick={() => navigate('/admin/users')}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-xl transition-all"
        >
          ← بازگشت به لیست کاربران
        </button>
      </div>

      {/* ۵ دکمه بزرگ برای ورود به صفحات مستقل */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {buttons.map((btn, index) => (
          <button
            key={index}
            onClick={() => navigate(btn.path)}
            className={`flex flex-col items-center justify-center gap-4 p-8 bg-gradient-to-br ${btn.color} hover:scale-105 transition-all rounded-3xl shadow-xl border border-white/10`}
          >
            <span className="text-6xl">{btn.icon}</span>
            <span className="text-2xl font-bold text-white">{btn.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default UserDashboard;
