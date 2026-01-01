// src/components/admin/UserTableRow.jsx - نسخه نهایی
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const UserTableRow = ({ user, onClick }) => {
  const navigate = useNavigate();
  const [showContracts, setShowContracts] = useState(false);
  
  const employee = user?.employee_details;
  const contracts = [...(employee?.contracts || [])].sort((a, b) => b.id - a.id);
  const activeContracts = contracts.filter(c => c.is_active);
  
  const position = employee?.position;
  const positionTitle = position?.title || 'نامشخص';
  const positionColor = position?.color_hex || '#6B7280';
  
  const skillLevel = employee?.skill_level;
  const skillLevelDisplay = skillLevel ? `سطح ${skillLevel.level_number}` : null;
  
  const avatarText = user.first_name?.[0] || user.username?.[0] || '?';

  // هندلر دکمه طرح
  const handleSchemeClick = (e, contract) => {
    e.stopPropagation();
    navigate(`/admin/scheme-contracts?employee=${user.id}&contract=${contract.id}`);
  };

  return (
    <>
      <tr 
        onClick={onClick}
        className="hover:bg-gray-800/50 transition-colors border-l-4 cursor-pointer group border-b border-gray-800"
        style={{ borderLeftColor: positionColor }}
      >
        {/* 1. نام و آواتار */}
        <td className="px-4 py-4 w-[25%] align-middle">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold shadow-md relative overflow-hidden"
              style={{ 
                backgroundColor: user.profile?.image ? 'transparent' : positionColor,
                border: `2px solid ${positionColor}`,
              }}
            >
              {user.profile?.image ? (
                <img 
                  src={user.profile.image} 
                  alt={user.username} 
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg drop-shadow-md">{avatarText}</span>
              )}
              
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
                
                {user.is_superuser && (
                  <span className="text-purple-400 text-xs" title="ادمین">👑</span>
                )}
              </div>
              <div className="text-gray-400 text-xs truncate">@{user.username}</div>
            </div>
          </div>
        </td>

        {/* 2. سمت */}
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

        {/* 3. کدملی */}
        <td className="px-4 py-4 text-center text-gray-300 font-mono text-sm w-[12%] align-middle">
          {employee?.code_meli || '---'}
        </td>

        {/* 4. موبایل */}
        <td className="px-4 py-4 text-center text-gray-300 font-mono text-sm w-[12%] align-middle">
          {user.profile?.phone_number || '---'}
        </td>

        {/* 5. پروژه‌ها (با دکمه باز/بسته) */}
        <td className="px-4 py-4 w-[18%] align-middle">
          {activeContracts.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {/* اولین پروژه + دکمه طرح */}
              <div className="flex items-center gap-2">
                <span 
                  className="px-2 py-1 rounded text-[10px] font-bold text-white truncate flex-1"
                  style={{ backgroundColor: `${positionColor}80` }}
                  title={activeContracts[0].project_name}
                >
                  📍 {activeContracts[0].project_name.slice(0, 15)}
                  {activeContracts[0].project_name.length > 15 && '...'}
                </span>
              </div>

              <button
                onClick={(e) => handleSchemeClick(e, activeContracts[0])}
                className={`text-xs font-bold py-1 px-2 rounded transition-all hover:scale-[1.02] ${
                  activeContracts[0].scheme_data
                    ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-800/60'
                    : 'bg-blue-900/50 text-blue-300 border border-blue-500/50 hover:bg-blue-800/60'
                }`}
              >
                {activeContracts[0].scheme_data ? '✏️ ویرایش طرح' : '➕ ایجاد طرح'}
              </button>

              {/* دکمه نمایش بیشتر */}
              {activeContracts.length > 1 && (
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowContracts(!showContracts);
                  }}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors text-left"
                >
                  {showContracts ? '▲ بستن' : `▼ +${activeContracts.length - 1} دیگر`}
                </button>
              )}
            </div>
          ) : (
            <span className="text-gray-600 text-xs">---</span>
          )}
        </td>

        {/* 6. دستمزد */}
        <td className="px-4 py-4 text-center w-[12%] align-middle">
          {activeContracts.length > 0 ? (
            <div className="text-xs font-mono">
              {activeContracts[0].daily_wage > 0 && (
                <span className="text-green-400 block">{Number(activeContracts[0].daily_wage).toLocaleString('fa-IR')}</span>
              )}
              {activeContracts[0].monthly_salary > 0 && (
                <span className="text-blue-400 block">{Number(activeContracts[0].monthly_salary).toLocaleString('fa-IR')}</span>
              )}
              {activeContracts[0].contract_value > 0 && (
                <span className="text-purple-400 block">{Number(activeContracts[0].contract_value).toLocaleString('fa-IR')}</span>
              )}
            </div>
          ) : (
            <span className="text-gray-600 text-xs">---</span>
          )}
        </td>

        {/* 7. عملیات */}
        <td className="px-4 py-4 text-center w-[6%] align-middle">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClick();
            }}
            className="p-2 rounded-lg transition-all hover:scale-110 hover:bg-gray-700"
            title="ویرایش کاربر"
          >
            ✏️
          </button>
        </td>
      </tr>

      {/* ردیف باز شونده برای قراردادهای بیشتر */}
      {showContracts && activeContracts.length > 1 && (
        <tr className="bg-gray-850 border-b border-gray-800">
          <td colSpan="7" className="px-4 py-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-16">
              {activeContracts.slice(1).map((contract) => (
                <div 
                  key={contract.id}
                  className="bg-gray-800/60 rounded-lg p-2 border border-gray-700/50"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span 
                      className="text-xs text-gray-300 truncate flex-1"
                      title={contract.project_name}
                    >
                      📍 {contract.project_name}
                    </span>
                    <button
                      onClick={(e) => handleSchemeClick(e, contract)}
                      className={`text-xs font-bold py-1 px-2 rounded transition-all hover:scale-[1.02] whitespace-nowrap ${
                        contract.scheme_data
                          ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50'
                          : 'bg-blue-900/50 text-blue-300 border border-blue-500/50'
                      }`}
                    >
                      {contract.scheme_data ? '✏️ ویرایش' : '➕ ایجاد'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </td>
        </tr>
      )}
    </>
  );
};

export default UserTableRow;
