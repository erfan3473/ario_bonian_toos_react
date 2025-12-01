// src/components/admin/tabs/LeaveTab.jsx

import React from 'react';

const LeaveTab = ({ user }) => {
  if (!user) return null;

  return (
    <div className="space-y-6">
      <h3 className="text-white font-bold text-xl">🏖️ مدیریت مرخصی</h3>

      <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="bg-blue-900/20 border border-blue-700 rounded-lg p-4">
            <div className="text-blue-400 text-3xl font-bold mb-2">14</div>
            <div className="text-gray-400 text-sm">مرخصی استحقاقی</div>
          </div>

          <div className="bg-green-900/20 border border-green-700 rounded-lg p-4">
            <div className="text-green-400 text-3xl font-bold mb-2">5</div>
            <div className="text-gray-400 text-sm">مرخصی استعلاجی</div>
          </div>

          <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
            <div className="text-red-400 text-3xl font-bold mb-2">2</div>
            <div className="text-gray-400 text-sm">غیبت بدون مجوز</div>
          </div>
        </div>
      </div>

      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-4 text-center">
        <p className="text-yellow-400">🚧 بخش درخواست‌های مرخصی در آینده اضافه می‌شود</p>
      </div>
    </div>
  );
};

export default LeaveTab;
