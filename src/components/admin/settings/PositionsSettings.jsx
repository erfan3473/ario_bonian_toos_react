// src/components/admin/settings/PositionsSettings.jsx

import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';

const PositionsSettings = () => {
  const dispatch = useDispatch();
  const { positions, loading } = useSelector((state) => state.admin);
  const [searchTerm, setSearchTerm] = useState('');

  // فیلتر سمت‌ها
  const filteredPositions = positions.filter((pos) =>
    pos.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pos.code?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // گروه‌بندی بر اساس سطح سلسله‌مراتب
  const groupedPositions = filteredPositions.reduce((acc, pos) => {
    const level = pos.hierarchy_level || 0;
    if (!acc[level]) acc[level] = [];
    acc[level].push(pos);
    return acc;
  }, {});

  const levelNames = {
    0: '👑 مدیریت ارشد',
    1: '🎯 سرپرستی',
    2: '👔 مسئولین میانی',
    3: '👷 کارگران',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-white font-bold text-xl">🎯 سمت‌های سازمانی</h3>
        <div className="text-gray-400 text-sm">
          مجموع: {positions.length} سمت
        </div>
      </div>

      {/* Search */}
      <div>
        <input
          type="text"
          placeholder="🔍 جستجو در سمت‌ها..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
      </div>

      {/* Hierarchy Tree */}
      <div className="space-y-6">
        {Object.keys(groupedPositions)
          .sort((a, b) => Number(a) - Number(b))
          .map((level) => (
            <div key={level} className="bg-gray-900 rounded-xl p-6 border border-gray-700">
              {/* Level Header */}
              <div className="mb-4 pb-3 border-b border-gray-700">
                <h4 className="text-white font-bold text-lg">
                  {levelNames[level] || `سطح ${level}`}
                </h4>
                <p className="text-gray-400 text-sm">
                  {groupedPositions[level].length} سمت
                </p>
              </div>

              {/* Positions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {groupedPositions[level].map((position) => (
                  <div
                    key={position.id}
                    className="bg-gray-800 rounded-lg p-4 border border-gray-700 hover:border-blue-600 transition"
                  >
                    {/* Title & Code */}
                    <div className="mb-3">
                      <h5 className="text-white font-bold text-lg">
                        {position.title}
                      </h5>
                      <p className="text-gray-400 text-sm font-mono">
                        {position.code}
                      </p>
                    </div>

                    {/* Report Type */}
                    <div className="mb-3">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${
                          position.report_type === 'PROJECT_MANAGER'
                            ? 'bg-purple-900/30 text-purple-400 border border-purple-700'
                            : position.report_type === 'WORKSHOP_SUPERVISOR'
                            ? 'bg-blue-900/30 text-blue-400 border border-blue-700'
                            : position.report_type === 'FOREMAN'
                            ? 'bg-green-900/30 text-green-400 border border-green-700'
                            : position.report_type === 'WORKER'
                            ? 'bg-orange-900/30 text-orange-400 border border-orange-700'
                            : 'bg-gray-700 text-gray-300'
                        }`}
                      >
                        {position.report_type === 'PROJECT_MANAGER' && '👑 مدیر پروژه'}
                        {position.report_type === 'WORKSHOP_SUPERVISOR' && '🎯 سرپرست'}
                        {position.report_type === 'FOREMAN' && '👔 سرکارگر'}
                        {position.report_type === 'WORKER' && '👷 کارگر'}
                        {position.report_type === 'FACILITIES_STAFF' && '🔧 تاسیسات'}
                        {position.report_type === 'SECURITY_GUARD' && '🛡️ نگهبان'}
                      </span>
                    </div>

                    {/* Parent Position */}
                    {position.parent_position && (
                      <div className="text-gray-400 text-sm mb-2">
                        <span className="text-gray-500">گزارش به:</span>{' '}
                        <span className="text-blue-400">
                          {position.parent_position_title}
                        </span>
                      </div>
                    )}

                    {/* BOQ Access */}
                    {position.can_enter_boq_items && (
                      <div className="mt-3 pt-3 border-t border-gray-700">
                        <span className="text-green-400 text-xs font-bold">
                          ✅ دسترسی ثبت فهرست‌بها
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Empty State */}
      {filteredPositions.length === 0 && (
        <div className="bg-gray-900 rounded-xl p-12 text-center border border-gray-700">
          <div className="text-6xl mb-4">🔍</div>
          <p className="text-gray-400 text-xl">سمتی یافت نشد</p>
        </div>
      )}
    </div>
  );
};

export default PositionsSettings;
