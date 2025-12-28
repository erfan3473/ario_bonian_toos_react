// src/components/admin/UserTableRow.jsx
// ⚠️ فایل کامل و نهایی - جایگزین فایل قبلی شود

import React from 'react';

const UserTableRow = ({ user, onClick }) => {
  const employee = user?.employee_details;
  const contracts = employee?.contracts || [];
  const activeContracts = contracts.filter(c => c.is_active);
  
  // سمت و رنگ
  const position = employee?.position;
  const positionTitle = position?.title || 'نامشخص';
  // اگر رنگ سمت مشخص نبود، خاکستری پیش‌فرض
  const positionColor = position?.color_hex || '#6B7280'; 
  
  // سطح مهارت
  const skillLevel = employee?.skill_level;
  const skillLevelDisplay = skillLevel 
    ? `سطح ${skillLevel.level_number}` 
    : null;
  
  // حرف اول برای آواتار متنی
  const avatarText = user.first_name?.[0] || user.username?.[0] || '?';

  return (
    <tr 
      onClick={onClick}
      className="hover:bg-gray-800/50 transition-colors border-l-4 cursor-pointer group border-b border-gray-800"
      style={{ borderLeftColor: positionColor }}
    >
      {/* 1. نام و آواتار (30%) */}
      <td className="px-4 py-4 w-[30%] align-middle">
        <div className="flex items-center gap-3">
          <div 
            className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md relative overflow-hidden"
            style={{ 
              backgroundColor: user.profile?.image ? 'transparent' : positionColor,
              border: `2px solid ${positionColor}`,
            }}
          >
            {/* ✅ لاجیک نمایش عکس یا متن */}
            {user.profile?.image ? (
              <img 
                src={user.profile.image} 
                alt={user.username} 
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-lg drop-shadow-md">{avatarText}</span>
            )}
            
            {/* نقطه سبز برای کاربران فعال */}
            {user.is_active && (
              <span 
                className="absolute top-0 right-0 w-3 h-3 rounded-full animate-pulse border border-gray-900"
                style={{ backgroundColor: '#10B981' }}
              />
            )}
          </div>
          
          <div className="overflow-hidden">
            <div className="text-white font-bold flex items-center gap-2 truncate">
              {user.first_name || user.last_name
                ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                : user.username}
              
              {/* Badge ادمین */}
              {user.is_superuser && (
                <span className="text-purple-400 text-xs" title="ادمین">👑</span>
              )}
            </div>
            <div className="text-gray-400 text-xs truncate">@{user.username}</div>
          </div>
        </div>
      </td>

      {/* 2. سمت (15%) */}
      <td className="px-4 py-4 w-[15%] align-middle">
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: positionColor }}
            />
            <span 
              className="font-bold text-sm truncate"
              style={{ color: positionColor }}
            >
              {positionTitle}
            </span>
          </div>
          
          {skillLevelDisplay && (
            <span className="text-yellow-500/80 text-[10px] mt-1 pr-4">
              ⭐ {skillLevelDisplay}
            </span>
          )}
        </div>
      </td>

      {/* 3. کدملی (15%) */}
      <td className="px-4 py-4 text-center text-gray-300 font-mono text-sm w-[15%] align-middle">
        {employee?.code_meli || '---'}
      </td>

      {/* 4. موبایل (15%) */}
      <td className="px-4 py-4 text-center text-gray-300 font-mono text-sm w-[15%] align-middle">
        {user.profile?.phone_number || '---'}
      </td>

      {/* 5. پروژه‌ها (10%) */}
      <td className="px-4 py-4 text-center w-[10%] align-middle">
        {activeContracts.length > 0 ? (
          <div className="flex flex-col gap-1 items-center">
            <span 
              className="px-2 py-1 rounded text-[10px] font-bold text-white truncate max-w-full"
              style={{ backgroundColor: `${positionColor}80` }}
            >
              📍 {activeContracts[0].project_name}
            </span>
            {activeContracts.length > 1 && (
              <span className="text-xs text-gray-500">+{activeContracts.length - 1} دیگر</span>
            )}
          </div>
        ) : (
          <span className="text-gray-600 text-xs">---</span>
        )}
      </td>

      {/* 6. دستمزد (10%) */}
      <td className="px-4 py-4 text-center w-[10%] align-middle">
        {activeContracts.length > 0 ? (
           <div className="text-xs font-mono">
             {activeContracts[0].daily_wage > 0 && <span className="text-green-400 block">{Number(activeContracts[0].daily_wage).toLocaleString()}</span>}
             {activeContracts[0].monthly_salary > 0 && <span className="text-blue-400 block">{Number(activeContracts[0].monthly_salary).toLocaleString()}</span>}
             {activeContracts[0].contract_value > 0 && <span className="text-purple-400 block">{Number(activeContracts[0].contract_value).toLocaleString()}</span>}
           </div>
        ) : (
          <span className="text-gray-600 text-xs">---</span>
        )}
      </td>

      {/* 7. عملیات (5%) */}
      <td className="px-4 py-4 text-center w-[5%] align-middle">
        <button
          onClick={(e) => {
            e.stopPropagation(); // جلوگیری از کلیک روی سطر
            onClick();
          }}
          className="p-2 rounded-lg transition-all hover:scale-110 hover:bg-gray-700"
          title="ویرایش"
        >
          ✏️
        </button>
      </td>
    </tr>
  );
};

export default UserTableRow;