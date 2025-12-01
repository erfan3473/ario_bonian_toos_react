// src/components/admin/UserDetailModal.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchUserDetail,
  clearSelectedUser,
  resetUpdateStatus,
} from '../../features/admin/adminSlice';
import PersonalInfoTab from './tabs/PersonalInfoTab';
import OrganizationalTab from './tabs/OrganizationalTab';
import ContractsTab from './tabs/ContractsTab';
import FinancialTab from './tabs/FinancialTab';
import LeaveTab from './tabs/LeaveTab';

const UserDetailModal = ({ userId, onClose }) => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState('personal');
  
  const { data: user, loading } = useSelector((state) => state.admin.selectedUser);
  const { success } = useSelector((state) => state.admin.updateStatus);

  const isNewUser = !userId;

  useEffect(() => {
    if (userId) {
      dispatch(fetchUserDetail(userId));
    }

    return () => {
      dispatch(clearSelectedUser());
      dispatch(resetUpdateStatus());
    };
  }, [dispatch, userId]);

  useEffect(() => {
    if (success) {
      // بعد از آپدیت موفق، رفرش کن
      if (userId) {
        dispatch(fetchUserDetail(userId));
      }
      dispatch(resetUpdateStatus());
    }
  }, [success, userId, dispatch]);

  const tabs = [
    { id: 'personal', icon: '👤', label: 'شخصی' },
    { id: 'organizational', icon: '🏢', label: 'سازمانی' },
    { id: 'contracts', icon: '📝', label: 'قراردادها' },
    { id: 'financial', icon: '💰', label: 'مالی' },
    { id: 'leave', icon: '🏖️', label: 'مرخصی' },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col border border-gray-700 shadow-2xl">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-purple-900 p-6 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              {isNewUser
                ? '➕ افزودن کاربر جدید'
                : `✏️ ویرایش ${user?.first_name || user?.username || '...'}`}
            </h2>
            <p className="text-gray-300 text-sm mt-1">
              مدیریت کامل اطلاعات کارمند
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-white hover:bg-white/10 w-10 h-10 rounded-full transition flex items-center justify-center"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-700 bg-gray-900 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 flex items-center gap-2 transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-gray-800 text-white border-b-2 border-blue-500'
                  : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
              }`}
            >
              <span className="text-xl">{tab.icon}</span>
              <span className="font-bold">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 bg-gray-900">
          {loading ? (
            <div className="text-center text-blue-400 py-20">
              <div className="animate-spin text-6xl mb-4">⏳</div>
              در حال بارگذاری...
            </div>
          ) : (
            <>
              {activeTab === 'personal' && <PersonalInfoTab user={user} />}
              {activeTab === 'organizational' && <OrganizationalTab user={user} />}
              {activeTab === 'contracts' && <ContractsTab user={user} />}
              {activeTab === 'financial' && <FinancialTab user={user} />}
              {activeTab === 'leave' && <LeaveTab user={user} />}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-900 p-4 flex justify-end gap-3 border-t border-gray-700">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
          >
            انصراف
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition"
          >
            💾 ذخیره تغییرات
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
