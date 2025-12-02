// src/components/admin/UserCard.jsx

import React from 'react';

const UserCard = ({ user, onClick }) => {
  const employee = user?.employee_details;
  
  // ✅ قراردادهای فعال از contracts (نه active_contract)
  const contracts = employee?.contracts || [];
  const activeContracts = contracts.filter(c => c.is_active);
  
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
        {employee && (
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
            {user.position || 'نامشخص'}
          </span>
        </div>
        
        <div className="flex justify-between">
          <span className="text-gray-400">کدملی:</span>
          <span className="text-white font-mono">
            {employee?.code_meli || '---'}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">موبایل:</span>
          <span className="text-white">{user.profile?.phone_number || '---'}</span>
        </div>
      </div>

      {/* ✅ قراردادهای فعال */}
      {activeContracts.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
          <div className="text-gray-400 text-xs font-bold mb-2">
            📋 قراردادهای فعال ({activeContracts.length})
          </div>
          {activeContracts.map((contract) => (
            <div 
              key={contract.id}
              className="bg-gray-900/50 p-3 rounded-lg border border-gray-600"
            >
              {/* نام پروژه */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-bold text-sm">
                  📍 {contract.project_name || 'نامشخص'}
                </span>
              </div>
              
              {/* نوع استخدام */}
              <div className="text-gray-400 text-xs mb-2">
                {contract.employment_type_description || 'نامشخص'}
              </div>

              {/* پرداخت */}
              <div className="flex items-center justify-between">
                {contract.daily_wage > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-green-400 font-bold text-sm">
                      {Number(contract.daily_wage).toLocaleString('fa-IR')}
                    </span>
                    <span className="text-gray-400 text-xs">تومان/روز</span>
                  </div>
                )}
                {contract.monthly_salary > 0 && (
                  <div className="flex items-center gap-1">
                    <span className="text-blue-400 font-bold text-sm">
                      {Number(contract.monthly_salary).toLocaleString('fa-IR')}
                    </span>
                    <span className="text-gray-400 text-xs">تومان/ماه</span>
                  </div>
                )}
                {!contract.daily_wage && !contract.monthly_salary && (
                  <span className="text-gray-500 text-xs">بدون دستمزد</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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
