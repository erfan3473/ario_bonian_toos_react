// src/components/admin/tabs/FinancialTab.jsx

import React from 'react';

const FinancialTab = ({ user }) => {
  const employee = user?.employee_details;

  if (!user) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-white font-bold text-xl">💰 اطلاعات مالی</h3>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-4">
        <div className="flex justify-between">
          <span className="text-gray-400">شماره شبا:</span>
          <span className="text-white font-mono">{employee?.shaba_number || '---'}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">شماره حساب:</span>
          <span className="text-white font-mono">{employee?.bank_account_number || '---'}</span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-400">کد بیمه:</span>
          <span className="text-white font-mono">{employee?.insurance_code || '---'}</span>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 text-center">
        <p className="text-yellow-400">🚧 بخش گزارشات حقوقی و تراکنش‌ها در آینده اضافه می‌شود</p>
      </div>
    </div>
  );
};

export default FinancialTab;
