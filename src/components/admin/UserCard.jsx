// src/components/admin/UserCard.jsx

import React from 'react';

const UserCard = ({ user, onClick }) => {
  // ✅ استخراج قراردادهای فعال
  const activeContracts = user.employee_details?.contracts?.filter(c => c.is_active) || [];
  const activeProjects = activeContracts.map(c => c.project?.name).filter(Boolean);

  return (
    <div
      onClick={onClick}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700 hover:border-blue-500 cursor-pointer transition-all hover:shadow-xl"
    >
      {/* Header */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl">
          {user.first_name?.[0] || user.username?.[0] || '👤'}
        </div>
        <div className="flex-grow">
          <h3 className="text-white font-bold text-lg">
            {user.first_name && user.last_name
              ? `${user.first_name} ${user.last_name}`
              : user.username}
          </h3>
          <p className="text-gray-400 text-sm">{user.email || 'بدون ایمیل'}</p>
        </div>
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2 mb-4">
        {user.is_admin && (
          <span className="bg-purple-900/30 text-purple-400 px-3 py-1 rounded-full text-xs font-bold border border-purple-700">
            👑 ادمین
          </span>
        )}
        {user.is_staff && (
          <span className="bg-green-900/30 text-green-400 px-3 py-1 rounded-full text-xs font-bold border border-green-700">
            👔 کارمند
          </span>
        )}
        {user.employee_details && (
          <span className="bg-orange-900/30 text-orange-400 px-3 py-1 rounded-full text-xs font-bold border border-orange-700">
            👷 کارگر
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">سمت:</span>
          <span className="text-white font-bold">
            {user.position_title || 'نامشخص'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">کدملی:</span>
          <span className="text-white font-mono">
            {user.employee_details?.code_meli || '---'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">موبایل:</span>
          <span className="text-white">{user.profile?.phone_number || '---'}</span>
        </div>

        {/* ✅ نمایش پروژه‌های فعال */}
        {activeProjects.length > 0 && (
          <div className="pt-2 mt-2 border-t border-gray-700">
            <span className="text-gray-400 text-xs block mb-1">پروژه‌های فعال:</span>
            <div className="flex flex-wrap gap-1">
              {activeProjects.map((projectName, idx) => (
                <span
                  key={idx}
                  className="bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded text-xs border border-blue-700"
                >
                  📍 {projectName}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status */}
      <div className="mt-4 pt-4 border-t border-gray-700">
        <span
          className={`text-xs font-bold ${
            user.is_active ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {user.is_active ? '✅ فعال' : '❌ غیرفعال'}
        </span>
      </div>
    </div>
  );
};

export default UserCard;
