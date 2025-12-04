// src/components/admin/UserTableRow.jsx

import React from 'react';

const UserTableRow = ({ user, onClick }) => {
  const employee = user?.employee_details;
  const contracts = employee?.contracts || [];
  const activeContracts = contracts.filter(c => c.is_active);
  
  // سمت و رنگ
  const position = employee?.position;
  const positionTitle = position?.title || 'نامشخص';
  const positionColor = position?.color_hex || '#6B7280';
  
  // سطح مهارت
  const skillLevel = employee?.skill_level;
  const skillLevelDisplay = skillLevel 
    ? `سطح ${skillLevel.level_number}` 
    : null;
  
  const avatarText = user.first_name?.[0] || user.username?.[0] || '?';

  return (
    <tr 
      className="hover:bg-gray-700/30 transition-colors border-l-4"
      style={{ borderLeftColor: positionColor }}
    >
      {/* نام و آواتار */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-3">
          <div 
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-md relative"
            style={{ 
              backgroundColor: positionColor,
              border: `2px solid ${positionColor}`,
            }}
          >
            {avatarText}
            
            {/* نقطه سبز برای کاربران فعال */}
            {user.is_active && (
              <span 
                className="absolute -top-1 -right-1 w-3 h-3 rounded-full animate-pulse"
                style={{ backgroundColor: '#10B981' }}
              />
            )}
          </div>
          <div>
            <div className="text-white font-bold flex items-center gap-2">
              {user.first_name || user.last_name
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.username}
              
              {/* Badge ادمین */}
              {user.is_superuser && (
                <span className="text-purple-400 text-xs">👑</span>
              )}
            </div>
            <div className="text-gray-400 text-xs">@{user.username}</div>
          </div>
        </div>
      </td>

      {/* سمت با رنگ */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* نقطه رنگی */}
          <div 
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: positionColor }}
          />
          <span 
            className="font-bold"
            style={{ color: positionColor }}
          >
            {positionTitle}
          </span>
        </div>
        
        {/* سطح مهارت */}
        {skillLevelDisplay && (
          <div className="text-yellow-400 text-xs mt-1">
            ⭐ {skillLevelDisplay}
          </div>
        )}
        
        {/* Badge کارگر */}
        {employee?.is_worker && (
          <span className="inline-block mt-1 bg-orange-900/40 text-orange-300 px-2 py-0.5 rounded-full text-xs border border-orange-700">
            👷 کارگر
          </span>
        )}
      </td>

      {/* کدملی */}
      <td className="px-4 py-3 text-center text-gray-300 font-mono text-sm">
        {employee?.code_meli || '---'}
      </td>

      {/* موبایل */}
      <td className="px-4 py-3 text-center text-gray-300 font-mono text-sm">
        {user.profile?.phone_number || '---'}
      </td>

      {/* پروژه‌ها و نوع استخدام */}
      <td className="px-4 py-3 text-center">
        {activeContracts.length > 0 ? (
          <div className="space-y-2">
            {activeContracts.slice(0, 2).map((contract) => (
              <div key={contract.id} className="text-xs">
                {/* نام پروژه */}
                <div 
                  className="inline-block px-2 py-1 rounded text-white mb-1"
                  style={{ backgroundColor: `${positionColor}80` }}
                >
                  📍 {contract.project_name}
                </div>
                
                {/* نوع استخدام */}
                {contract.employment_type_description && (
                  <div 
                    className="inline-block px-2 py-1 rounded-full text-xs font-bold border"
                    style={{
                      backgroundColor: `${positionColor}20`,
                      borderColor: `${positionColor}60`,
                      color: positionColor,
                    }}
                  >
                    {contract.employment_type_description}
                  </div>
                )}
              </div>
            ))}
            {activeContracts.length > 2 && (
              <div className="text-gray-500 text-xs">
                +{activeContracts.length - 2} دیگر
              </div>
            )}
          </div>
        ) : (
          <span className="text-gray-500 text-sm">بدون قرارداد</span>
        )}
      </td>

      {/* عملیات */}
      <td className="px-4 py-3 text-center">
        <button
          onClick={onClick}
          className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:scale-105"
          style={{
            backgroundColor: `${positionColor}40`,
            color: positionColor,
            border: `1px solid ${positionColor}`,
          }}
        >
          ✏️ ویرایش
        </button>
      </td>
    </tr>
  );
};

export default UserTableRow;
