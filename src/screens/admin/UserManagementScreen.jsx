// src/screens/admin/UserManagementScreen.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import {
  fetchUsers,
  fetchPositions,
  fetchSkillLevels,
  fetchEmploymentTypes,
  fetchLeaveTypes,
} from '../../features/admin/adminSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import UserCard from '../../components/admin/UserCard';
import UserTableRow from '../../components/admin/UserTableRow';
import LeaveRequestsTab from '../../components/admin/tabs/LeaveRequestsTab'; // ✅ جدید

const UserManagementScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [viewMode, setViewMode] = useState('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [activeTab, setActiveTab] = useState('users'); // ✅ جدید

  const { users, loading } = useSelector((state) => state.admin);
  const projects = useSelector((state) => state.projects.list);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchPositions());
    dispatch(fetchSkillLevels());
    dispatch(fetchEmploymentTypes());
    dispatch(fetchLeaveTypes());
    dispatch(fetchProjects());
  }, [dispatch]);

  // ✅ تشخیص تب از URL
  useEffect(() => {
    if (location.pathname.includes('/leaves')) {
      setActiveTab('leaves');
    } else if (location.pathname.includes('/contracts')) {
      setActiveTab('contracts');
    } else {
      setActiveTab('users');
    }
  }, [location.pathname]);

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.employee_details?.code_meli?.includes(searchTerm);

    let matchesRole = true;
    if (filterRole === 'admin') {
      matchesRole = user.is_superuser;
    } else if (filterRole === 'employee') {
      matchesRole = user.employee_details !== null;
    } else if (filterRole === 'worker') {
      matchesRole = user.employee_details?.is_worker === true;
    }

    return matchesSearch && matchesRole;
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.is_superuser).length,
    employees: users.filter((u) => u.employee_details !== null).length,
    workers: users.filter((u) => u.employee_details?.is_worker === true).length,
  };

  const handleUserClick = (userId) => {
    navigate(`/admin/users/${userId}`);
  };

  const handleNewUserClick = () => {
    navigate('/admin/users/new');
  };

  const handleRefresh = () => {
    dispatch(fetchUsers());
    dispatch(fetchProjects());
    dispatch(fetchPositions());
    dispatch(fetchSkillLevels());
    dispatch(fetchEmploymentTypes());
    dispatch(fetchLeaveTypes());
  };

  // ✅ تعویض تب
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'leaves') {
      navigate('/admin/users/leaves');
    } else if (tab === 'contracts') {
      navigate('/admin/users/contracts');
    } else {
      navigate('/admin/users');
    }
  };

  if (loading.users && users.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-6xl mb-4">⏳</div>
          <p className="text-white text-xl">در حال بارگذاری کاربران...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                👥 مدیریت کاربران
              </h1>
              <p className="text-gray-400">
                مدیریت جامع کارمندان، قراردادها و اطلاعات پرسنلی
              </p>
            </div>

            <button
              onClick={handleRefresh}
              disabled={loading.users}
              className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition disabled:opacity-50"
            >
              {loading.users ? '⏳' : '🔄'} بروزرسانی
            </button>
          </div>
        </div>

        {/* ✅ Tabs Navigation */}
        <div className="bg-gray-800 rounded-xl p-2 mb-6 border border-gray-700 flex gap-2">
          <button
            onClick={() => handleTabChange('users')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            👥 کاربران
          </button>
          <button
            onClick={() => handleTabChange('contracts')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              activeTab === 'contracts'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            📝 قراردادها
          </button>
          <button
            onClick={() => handleTabChange('leaves')}
            className={`flex-1 py-3 rounded-lg font-bold transition ${
              activeTab === 'leaves'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
            }`}
          >
            🏖️ درخواست‌های مرخصی
          </button>
        </div>

        {/* ✅ Tab Content */}
        {activeTab === 'leaves' ? (
          <LeaveRequestsTab />
        ) : activeTab === 'contracts' ? (
          <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-gray-400 text-xl">تب قراردادها به زودی...</p>
          </div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div
                className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-4 border border-blue-700 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => setFilterRole('all')}
              >
                <div className="text-blue-300 text-sm mb-1">👥 کل کاربران</div>
                <div className="text-white text-3xl font-bold">{stats.total}</div>
              </div>

              <div
                className="bg-gradient-to-br from-purple-900 to-purple-800 rounded-xl p-4 border border-purple-700 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => setFilterRole('admin')}
              >
                <div className="text-purple-300 text-sm mb-1">👑 ادمین‌ها</div>
                <div className="text-white text-3xl font-bold">{stats.admins}</div>
              </div>

              <div
                className="bg-gradient-to-br from-green-900 to-green-800 rounded-xl p-4 border border-green-700 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => setFilterRole('employee')}
              >
                <div className="text-green-300 text-sm mb-1">👔 کارمندان</div>
                <div className="text-white text-3xl font-bold">{stats.employees}</div>
              </div>

              <div
                className="bg-gradient-to-br from-orange-900 to-orange-800 rounded-xl p-4 border border-orange-700 hover:scale-105 transition-transform cursor-pointer"
                onClick={() => setFilterRole('worker')}
              >
                <div className="text-orange-300 text-sm mb-1">👷 کارگران</div>
                <div className="text-white text-3xl font-bold">{stats.workers}</div>
              </div>
            </div>

            {/* Filters */}
            <div className="bg-gray-800 rounded-xl p-4 mb-6 border border-gray-700 shadow-lg">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-grow">
                  <input
                    type="text"
                    placeholder="🔍 جستجو (نام، نام‌کاربری، کدملی، ایمیل)"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
                  />
                </div>

                <div className="w-full lg:w-auto">
                  <select
                    value={filterRole}
                    onChange={(e) => setFilterRole(e.target.value)}
                    className="w-full lg:w-auto bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer transition"
                  >
                    <option value="all">همه ({stats.total})</option>
                    <option value="admin">👑 ادمین‌ها ({stats.admins})</option>
                    <option value="employee">👔 کارمندان ({stats.employees})</option>
                    <option value="worker">👷 کارگران ({stats.workers})</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-bold transition ${
                      viewMode === 'grid'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    title="نمایش کارتی"
                  >
                    🔲 کارت
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`flex-1 lg:flex-none px-4 py-2 rounded-lg font-bold transition ${
                      viewMode === 'table'
                        ? 'bg-blue-600 text-white shadow-lg'
                        : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                    }`}
                    title="نمایش جدولی"
                  >
                    📋 جدول
                  </button>
                </div>

                <button
                  onClick={handleNewUserClick}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-bold transition shadow-lg whitespace-nowrap"
                >
                  ➕ کاربر جدید
                </button>
              </div>
            </div>

            {/* User List */}
            {filteredUsers.length === 0 ? (
              <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700 shadow-lg">
                <div className="text-6xl mb-4">🔍</div>
                <p className="text-gray-400 text-xl mb-2">کاربری یافت نشد</p>
                <p className="text-gray-500">
                  {searchTerm ? 'جستجوی دیگری امتحان کنید' : 'هیچ کاربری ثبت نشده است'}
                </p>
              </div>
            ) : (
              <>
                {viewMode === 'grid' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredUsers.map((user) => (
                      <UserCard
                        key={user.id}
                        user={user}
                        onClick={() => handleUserClick(user.id)}
                      />
                    ))}
                  </div>
                )}

                {viewMode === 'table' && (
                  <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="bg-gray-900 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-right text-gray-300 font-bold">کاربر</th>
                            <th className="px-4 py-3 text-right text-gray-300 font-bold">سمت</th>
                            <th className="px-4 py-3 text-center text-gray-300 font-bold">کدملی</th>
                            <th className="px-4 py-3 text-center text-gray-300 font-bold">موبایل</th>
                            <th className="px-4 py-3 text-center text-gray-300 font-bold">پروژه‌ها</th>
                            <th className="px-4 py-3 text-center text-gray-300 font-bold">دستمزد</th>
                            <th className="px-4 py-3 text-center text-gray-300 font-bold">عملیات</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-700">
                          {filteredUsers.map((user) => (
                            <UserTableRow
                              key={user.id}
                              user={user}
                              onClick={() => handleUserClick(user.id)}
                            />
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}

            {filteredUsers.length > 0 && (
              <div className="mt-4 text-center text-gray-500 text-sm">
                نمایش {filteredUsers.length} از {users.length} کاربر
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default UserManagementScreen;
