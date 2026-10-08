// src/screens/admin/UserManagementScreen.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import { fetchUsers } from '../../features/admin/usersSlice';
import { 
  fetchPositions, 
  fetchSkillLevels, 
  fetchEmploymentTypes,
  fetchLeaveTypes 
} from '../../features/admin/dropdownsSlice';
import { fetchProjects } from '../../features/projects/projectSlice';
import UserCard from '../../components/admin/UserCard';

const UserManagementScreen = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilters, setSelectedFilters] = useState(['all']);

  const { list: users, loading } = useSelector((state) => state.admin.users);
  const positions = useSelector((state) => state.admin.dropdowns?.positions || []);

  useEffect(() => {
    dispatch(fetchUsers());
    dispatch(fetchPositions());
    dispatch(fetchSkillLevels());
    dispatch(fetchEmploymentTypes());
    dispatch(fetchLeaveTypes());
    dispatch(fetchProjects());
  }, [dispatch]);

  const stats = useMemo(() => {
    const counts = {
      total: users.length,
      admins: users.filter(u => u.is_superuser).length,
      withPosition: users.filter(u => u.employee_details?.position).length,
      withoutPosition: users.filter(u => !u.employee_details?.position && !u.is_superuser).length,
      positions: {}
    };

    positions.forEach(pos => {
      counts.positions[pos.id] = users.filter(u => {
        const userPosId = u.employee_details?.position?.id || u.employee_details?.position;
        return userPosId === pos.id;
      }).length;
    });

    return counts;
  }, [users, positions]);

  const toggleFilter = (filterKey) => {
    if (filterKey === 'all') {
      setSelectedFilters(['all']);
      return;
    }

    let newFilters = selectedFilters.filter(f => f !== 'all');

    if (newFilters.includes(filterKey)) {
      newFilters = newFilters.filter(f => f !== filterKey);
    } else {
      newFilters.push(filterKey);
    }

    if (newFilters.length === 0) {
      newFilters = ['all'];
    }

    setSelectedFilters(newFilters);
  };

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        user.username?.toLowerCase().includes(searchLower) ||
        user.first_name?.toLowerCase().includes(searchLower) ||
        user.last_name?.toLowerCase().includes(searchLower) ||
        user.email?.toLowerCase().includes(searchLower) ||
        user.employee_details?.code_meli?.includes(searchTerm);

      let matchesPosition = false;
      
      if (selectedFilters.includes('all')) {
        matchesPosition = true;
      } else {
        if (selectedFilters.includes('admin') && user.is_superuser) matchesPosition = true;
        if (selectedFilters.includes('no_position') && !user.employee_details?.position && !user.is_superuser) matchesPosition = true;
        if (selectedFilters.includes('with_position') && user.employee_details?.position) matchesPosition = true;
        
        const userPosId = user.employee_details?.position?.id || user.employee_details?.position;
        if (userPosId && selectedFilters.includes(userPosId)) {
          matchesPosition = true;
        }
      }

      return matchesSearch && matchesPosition;
    });
  }, [users, searchTerm, selectedFilters]);

  const handleUserClick = (userId) => navigate(`/admin/users/${userId}`);
  const handleNewUserClick = () => navigate('/admin/users/new');

  const handleRefresh = () => {
    dispatch(fetchUsers());
    dispatch(fetchProjects());
    dispatch(fetchPositions());
    dispatch(fetchSkillLevels());
    dispatch(fetchEmploymentTypes());
    dispatch(fetchLeaveTypes());
  };

  if (loading.list && users.length === 0) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>در حال بارگذاری کاربران...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`container mx-auto p-4 md:p-8 rounded-2xl border-2 transition-all duration-300 ${
        isDark ? 'border-blue-700 bg-gray-800/50 shadow-2xl' : 'border-blue-600 bg-white shadow-lg'
      }`}>
        
        {/* هدر */}
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-8 pb-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="text-center sm:text-right mb-4 sm:mb-0">
            <h1 className={`text-2xl md:text-3xl font-black flex items-center gap-3 justify-center sm:justify-start ${isDark ? 'text-white' : 'text-gray-800'}`}>
              <span className="text-blue-500 text-3xl">👥</span> مدیریت کاربران
            </h1>
            <p className={`mt-2 font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              مدیریت جامع کارمندان و اطلاعات پرسنلی
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading.list}
            className={`px-5 py-2.5 rounded-xl font-bold transition-all shadow-md flex items-center gap-2 ${
              isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-300'
            } disabled:opacity-50`}
          >
            {loading.list ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"></div> : '🔄'} 
            بروزرسانی
          </button>
        </div>

        {/* کارت‌های آماری */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div 
            className={`rounded-xl p-4 border transition-all cursor-pointer ${
              selectedFilters.includes('all') 
                ? isDark ? 'bg-blue-900/40 border-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'bg-blue-50 border-blue-500 shadow-md ring-2 ring-blue-200' 
                : isDark ? 'bg-gray-800/80 border-gray-700 hover:border-blue-500/50' : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
            }`} 
            onClick={() => toggleFilter('all')}
          >
            <div className={`text-xs sm:text-sm font-bold mb-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>👥 کل کاربران</div>
            <div className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.total}</div>
          </div>
          <div 
            className={`rounded-xl p-4 border transition-all cursor-pointer ${
              selectedFilters.includes('admin') 
                ? isDark ? 'bg-purple-900/40 border-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'bg-purple-50 border-purple-500 shadow-md ring-2 ring-purple-200'
                : isDark ? 'bg-gray-800/80 border-gray-700 hover:border-purple-500/50' : 'bg-white border-gray-200 hover:border-purple-300 hover:shadow-sm'
            }`} 
            onClick={() => toggleFilter('admin')}
          >
            <div className={`text-xs sm:text-sm font-bold mb-1 ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>👑 ادمین‌ها</div>
            <div className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.admins}</div>
          </div>
          <div 
            className={`rounded-xl p-4 border transition-all cursor-pointer ${
              selectedFilters.includes('with_position') 
                ? isDark ? 'bg-green-900/40 border-green-400 shadow-[0_0_15px_rgba(74,222,128,0.3)]' : 'bg-green-50 border-green-500 shadow-md ring-2 ring-green-200'
                : isDark ? 'bg-gray-800/80 border-gray-700 hover:border-green-500/50' : 'bg-white border-gray-200 hover:border-green-300 hover:shadow-sm'
            }`} 
            onClick={() => toggleFilter('with_position')}
          >
            <div className={`text-xs sm:text-sm font-bold mb-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>👔 دارای سمت</div>
            <div className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.withPosition}</div>
          </div>
          <div 
            className={`rounded-xl p-4 border transition-all cursor-pointer ${
              selectedFilters.includes('no_position') 
                ? isDark ? 'bg-orange-900/40 border-orange-400 shadow-[0_0_15px_rgba(249,115,22,0.3)]' : 'bg-orange-50 border-orange-500 shadow-md ring-2 ring-orange-200'
                : isDark ? 'bg-gray-800/80 border-gray-700 hover:border-orange-500/50' : 'bg-white border-gray-200 hover:border-orange-300 hover:shadow-sm'
            }`} 
            onClick={() => toggleFilter('no_position')}
          >
            <div className={`text-xs sm:text-sm font-bold mb-1 ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>⚠️ بدون سمت</div>
            <div className={`text-2xl sm:text-3xl font-black ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.withoutPosition}</div>
          </div>
        </div>

        {/* نوار جستجو و دکمه جدید */}
        <div className={`rounded-xl p-4 sm:p-5 mb-6 border shadow-sm flex flex-col md:flex-row gap-4 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex-grow relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50">🔍</span>
            <input
              type="text"
              placeholder="جستجو (نام، نام‌کاربری، کدملی، ایمیل)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-12 pr-4 py-3.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
              }`}
            />
          </div>
         
        </div>

        {/* تگ‌های فیلتر سمت‌ها */}
        <div className="mb-8 flex flex-wrap gap-2">
          <button
            onClick={() => toggleFilter('all')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
              selectedFilters.includes('all') 
                ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
                : isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            همه <span className="opacity-75 font-normal mr-1">({stats.total})</span>
          </button>
          
          <button
            onClick={() => toggleFilter('admin')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
              selectedFilters.includes('admin') 
                ? 'bg-purple-600 text-white border-purple-600 shadow-md' 
                : isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            👑 ادمین‌ها <span className="opacity-75 font-normal mr-1">({stats.admins})</span>
          </button>

          <button
            onClick={() => toggleFilter('no_position')}
            className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
              selectedFilters.includes('no_position') 
                ? 'bg-orange-600 text-white border-orange-600 shadow-md' 
                : isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            بدون سمت <span className="opacity-75 font-normal mr-1">({stats.withoutPosition})</span>
          </button>

          {positions.map((pos) => {
            const isSelected = selectedFilters.includes(pos.id);
            const count = stats.positions[pos.id] || 0;
            return (
              <button
                key={pos.id}
                onClick={() => toggleFilter(pos.id)}
                className={`px-4 py-2 rounded-full text-xs sm:text-sm font-bold border transition-all ${
                  isSelected 
                    ? 'text-white shadow-md' 
                    : isDark ? 'bg-gray-800 text-gray-400 border-gray-700 hover:bg-gray-700 hover:text-white' : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-100 hover:text-gray-900'
                }`}
                style={isSelected ? { backgroundColor: pos.color_hex || '#10b981', borderColor: pos.color_hex || '#10b981' } : {}}
              >
                {pos.title} <span className="opacity-75 font-normal mr-1">({count})</span>
              </button>
            );
          })}
        </div>

        {/* رندر کاربران */}
        {filteredUsers.length === 0 ? (
          <div className={`rounded-2xl p-12 text-center border-2 border-dashed ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-gray-50 border-gray-300'}`}>
            <div className="text-6xl mb-4 opacity-50">🔍</div>
            <p className={`text-xl font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>کاربری یافت نشد</p>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              {searchTerm ? 'جستجوی دیگری امتحان کنید' : 'هیچ کاربری با این مشخصات و سمت‌ها ثبت نشده است'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} onClick={() => handleUserClick(user.id)} isDark={isDark} />
            ))}
          </div>
        )}
        
        {filteredUsers.length > 0 && (
          <div className={`mt-8 pt-4 border-t text-center text-sm font-bold ${isDark ? 'border-gray-700 text-gray-500' : 'border-gray-200 text-gray-500'}`}>
            نمایش {filteredUsers.length} از {users.length} کاربر
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagementScreen;