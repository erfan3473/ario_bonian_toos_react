// src/components/admin/UserTableRow.jsx

import React from 'react';

const UserTableRow = ({ user, onClick }) => {
  const employee = user.employee_details;
  const contract = user.active_contract;
  
  const isMonthly = contract?.employment_type_key === 'permanent_monthly';
  const avatarText = user.first_name?.[0] || user.username?.[0] || '?';

  return (
    <tr className="hover:bg-gray-700/30 transition">
      {/* نام و آواتار */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {avatarText}
          </div>
          <div>
            <div className="text-white font-bold">
              {user.first_name || user.last_name
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.username}
            </div>
            <div className="text-gray-400 text-xs">@{user.username}</div>
          </div>
        </div>
      </td>

      {/* سمت */}
      <td className="px-4 py-3 text-white">
        {user.position_title || '---'}
      </td>

      {/* کدملی */}
      <td className="px-4 py-3 text-center text-gray-300 font-mono text-sm">
        {employee?.code_meli || '---'}
      </td>

      {/* موبایل */}
      <td className="px-4 py-3 text-center text-gray-300 font-mono text-sm">
        {user.profile?.phone_number || '---'}
      </td>

      {/* نوع استخدام */}
      <td className="px-4 py-3 text-center">
        {contract ? (
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${
            isMonthly
              ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
              : 'bg-orange-900/30 text-orange-400 border border-orange-700'
          }`}>
            {contract.employment_type}
          </span>
        ) : (
          <span className="text-gray-500">بدون قرارداد</span>
        )}
      </td>

      {/* دستمزد */}
      <td className="px-4 py-3 text-center text-green-400 font-mono font-bold">
        {contract ? (
          isMonthly
            ? `${Number(contract.monthly_salary).toLocaleString('fa-IR')} ت/ماه`
            : `${Number(contract.daily_wage).toLocaleString('fa-IR')} ت/روز`
        ) : (
          '---'
        )}
      </td>

      {/* عملیات */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={onClick}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1 rounded-lg text-sm transition"
        >
          ✏️ ویرایش
        </button>
      </td>
    </tr>
  );
};

export default UserTableRow;
