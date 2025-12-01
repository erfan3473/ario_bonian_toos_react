// src/screens/admin/UserManagementScreen.jsx

import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchAllUsers,
  fetchPositions,
  fetchSkillLevels,
  fetchEmploymentTypes,
  setSearchTerm,
  setRoleFilter,
  setViewMode,
} from '../../features/admin/adminSlice';
import UserCard from '../../components/admin/UserCard';
import UserTableRow from '../../components/admin/UserTableRow';
import UserDetailModal from '../../components/admin/UserDetailModal';

const UserManagementScreen = () => {
  const dispatch = useDispatch();
  
  const { list: users, loading } = useSelector((state) => state.admin.users);
  const { searchTerm, role, viewMode } = useSelector((state) => state.admin.filters);
  
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    dispatch(fetchAllUsers());
    dispatch(fetchPositions());
    dispatch(fetchSkillLevels());
    dispatch(fetchEmploymentTypes());
  }, [dispatch]);

  // فیلتر کاربران
  const filteredUsers = users.filter((user) => {
    // جستجو
    const matchSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_details?.code_meli?.includes(searchTerm) ||
      user.profile?.phone_number?.includes(searchTerm);

    // نقش
    const matchRole =
      role === 'all' ||
      (role === 'workers' && user.employee_details) ||
      (role === 'staff' && user.is_staff) ||
      (role === 'admin' && user.is_admin);

    return matchSearch && matchRole;
  });

  // آمار
  const stats = {
    total: users.length,
    workers: users.filter((u) => u.employee_details).length,
    staff: users.filter((u) => u.is_staff).length,
    admin: users.filter((u) => u.is_admin).length,
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              👥 مدیریت کاربران
            </h1>
            <p className="text-gray-400">
              مشاهده و ویرایش اطلاعات {filteredUsers.length} کاربر
            </p>
          </div>

          <button
            onClick={() => {
              setSelectedUserId(null);
              setShowModal(true);
            }}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold transition shadow-lg"
          >
            ➕ افزودن کاربر جدید
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: 'همه', count: stats.total, icon: '👥', color: 'blue' },
            { label: 'کارگران', count: stats.workers, icon: '👷', color: 'orange' },
            { label: 'کارمندان', count: stats.staff, icon: '👔', color: 'green' },
            { label: 'ادمین‌ها', count: stats.admin, icon: '🔧', color: 'purple' },
          ].map((stat) => (
            <div
              key={stat.label}
              className={`bg-gradient-to-br from-${stat.color}-900/30 to-${stat.color}-800/30 border border-${stat.color}-700 rounded-xl p-4`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-400 text-sm">{stat.label}</p>
                  <p className="text-white text-2xl font-bold">{stat.count}</p>
                </div>
                <span className="text-4xl">{stat.icon}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* جستجو */}
          <input
            type="text"
            placeholder="🔍 جستجو (نام، کدملی، موبایل، نام کاربری)"
            value={searchTerm}
            onChange={(e) => dispatch(setSearchTerm(e.target.value))}
            className="flex-grow bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />

          {/* فیلتر نقش */}
          <select
            value={role}
            onChange={(e) => dispatch(setRoleFilter(e.target.value))}
            className="bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">همه ({stats.total})</option>
            <option value="workers">کارگران ({stats.workers})</option>
            <option value="staff">کارمندان ({stats.staff})</option>
            <option value="admin">ادمین‌ها ({stats.admin})</option>
          </select>

          {/* تغییر نمایش */}
          <div className="flex bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => dispatch(setViewMode('cards'))}
              className={`px-4 py-2 rounded transition ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🎴 کارت
            </button>
            <button
              onClick={() => dispatch(setViewMode('table'))}
              className={`px-4 py-2 rounded transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📋 جدول
            </button>
          </div>
        </div>
      </div>

      {/* محتوا */}
      {loading ? (
        <div className="text-center text-blue-400 py-20">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          در حال بارگذاری...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="text-center text-gray-500 py-20">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-xl">هیچ کاربری یافت نشد</p>
        </div>
      ) : viewMode === 'cards' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredUsers.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onClick={() => {
                setSelectedUserId(user.id);
                setShowModal(true);
              }}
            />
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl overflow-hidden border border-gray-700">
          <table className="w-full">
            <thead className="bg-gray-900 text-gray-400">
              <tr>
                <th className="px-4 py-3 text-right">نام</th>
                <th className="px-4 py-3 text-right">سمت</th>
                <th className="px-4 py-3 text-center">کدملی</th>
                <th className="px-4 py-3 text-center">موبایل</th>
                <th className="px-4 py-3 text-center">نوع استخدام</th>
                <th className="px-4 py-3 text-center">دستمزد</th>
                <th className="px-4 py-3 text-center">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {filteredUsers.map((user) => (
                <UserTableRow
                  key={user.id}
                  user={user}
                  onClick={() => {
                    setSelectedUserId(user.id);
                    setShowModal(true);
                  }}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={() => {
            setShowModal(false);
            setSelectedUserId(null);
          }}
        />
      )}
    </div>
  );
};

export default UserManagementScreen;
