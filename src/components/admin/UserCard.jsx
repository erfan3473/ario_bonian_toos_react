// src/components/admin/UserCard.jsx - نسخه نهایی با ارتفاع دینامیک
import React from 'react';
import { useNavigate } from 'react-router-dom';

const UserCard = ({ user, onClick }) => {
  const navigate = useNavigate();
  const employee = user?.employee_details;
  
  const contracts = [...(employee?.contracts || [])].sort((a, b) => b.id - a.id);
  const activeContracts = contracts.filter(c => c.is_active);
  
  const position = employee?.position;
  const positionTitle = position?.title || 'نامشخص';
  const positionColor = position?.color_hex || '#6B7280';
  const skillLevel = employee?.skill_level;
  const skillLevelDisplay = skillLevel ? `سطح ${skillLevel.level_number}` : null;

  // هندلر دکمه طرح (زیر پروژه)
  const handleSchemeClick = (e, contract) => {
    e.stopPropagation();
    
    if (!contract) {
      alert("قرارداد یافت نشد!");
      return;
    }

    navigate(`/admin/scheme-contract?employee=${user.id}&contract=${contract.id}`);
  };

  const avatarText = user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';

  return (
    <div
      onClick={onClick}
      className="group rounded-2xl p-4 border border-gray-700/50 hover:border-gray-600/80 hover:shadow-2xl hover:scale-[1.01] cursor-pointer transition-all duration-300 relative overflow-hidden w-[320px] flex flex-col bg-gradient-to-b from-gray-900/80 to-gray-900/90 backdrop-blur-sm"
      style={{ 
        boxShadow: `0 10px 30px ${positionColor}20`,
        borderColor: `${positionColor}40`,
        minHeight: activeContracts.length === 0 ? '340px' : 'auto', // ✅ ارتفاع دینامیک
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-2.5 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* عکس */}
          <div 
            className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-xl border-3 relative overflow-hidden ring-2 ring-white/20"
            style={{ 
              background: `linear-gradient(135deg, ${positionColor}20, ${positionColor}10)`,
              borderColor: positionColor,
              boxShadow: `0 6px 20px ${positionColor}30`
            }}
          >
            {user.profile?.image ? (
              <img 
                src={user.profile.image} 
                alt={user.username} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl">
                <span className="text-xl font-black text-white drop-shadow-lg">{avatarText}</span>
              </div>
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-0.5">
            <div className="text-white font-bold text-base truncate">{user.first_name || '---'}</div>
            <div className="text-white/90 font-bold text-sm truncate">{user.last_name || user.username}</div>
            <div className="text-gray-400 text-xs">کد: {employee?.id || '---'}</div>
          </div>
        </div>

        {/* Badge وضعیت */}
        <div className="flex flex-col gap-1 flex-shrink-0">
          {user.is_active ? (
            <span className="bg-green-900/50 text-green-300 px-2 py-1 rounded-lg text-xs font-bold border border-green-500/50">
              ✅ فعال
            </span>
          ) : (
            <span className="bg-red-900/50 text-red-300 px-2 py-1 rounded-lg text-xs font-bold border border-red-500/50">
              ❌ غیرفعال
            </span>
          )}
        </div>
      </div>

      {/* Badges + Info */}
      <div className="flex items-center justify-between mb-3 px-1 flex-shrink-0">
        <div className="flex flex-wrap gap-1">
          {user.is_superuser && (
            <span className="bg-purple-900/80 text-purple-200 px-2 py-0.5 rounded-full text-xs font-bold border border-purple-400/50 shadow-md">👑</span>
          )}
          <span 
            className="px-2 py-0.5 rounded-full text-xs font-bold border shadow-sm truncate max-w-[100px]"
            style={{ 
              backgroundColor: `${positionColor}60`, 
              borderColor: positionColor,
              color: 'white'
            }}
            title={positionTitle}
          >
            {positionTitle.length > 12 ? `${positionTitle.slice(0,12)}...` : positionTitle}
          </span>
          {employee?.is_worker && (
            <span className="bg-orange-900/80 text-orange-200 px-2 py-0.5 rounded-full text-xs font-bold border border-orange-400/50 shadow-md">👷</span>
          )}
        </div>

        {skillLevelDisplay && (
          <span className="text-yellow-400 text-xs font-bold bg-black/50 px-2 py-0.5 rounded-full">
            ⭐{skillLevelDisplay}
          </span>
        )}
      </div>

      {/* اطلاعات کلیدی */}
      <div className="grid grid-cols-2 gap-2 mb-3 text-xs bg-black/40 rounded-xl p-3 backdrop-blur-sm border border-gray-700/50 flex-shrink-0">
        <div className="space-y-0.5">
          <span className="text-gray-500 text-[10px]">کد ملی</span>
          <span className="font-mono text-white truncate block">{employee?.code_meli || '---'}</span>
        </div>
        <div className="space-y-0.5">
          <span className="text-gray-500 text-[10px]">موبایل</span>
          <span className="text-white truncate block">{user.profile?.phone_number || '---'}</span>
        </div>
      </div>

      {/* قراردادهای فعال - ✅ بدون اسکرول */}
      <div className="space-y-2 flex-shrink-0">
        {activeContracts.length > 0 ? (
          <>
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-gray-400 text-xs">📋</span>
              <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-blue-600 to-blue-700 border border-blue-400/50 shadow-md">
                {activeContracts.length} فعال
              </span>
            </div>

            {/* ✅ حذف overflow و max-height - همه دیده میشن */}
            <div className="space-y-2">
              {activeContracts.map((contract) => (
                <div 
                  key={contract.id}
                  className="bg-gray-800/60 rounded-lg p-2.5 border border-gray-700/50 hover:border-gray-600/80 transition-all"
                >
                  {/* نام پروژه */}
                  <div className="flex items-center gap-1 mb-2">
                    <span className="text-blue-300 text-xs font-bold truncate" title={contract.project_name}>
                      📍 {contract.project_name}
                    </span>
                  </div>

                  {/* دکمه طرح */}
                  <button
                    onClick={(e) => handleSchemeClick(e, contract)}
                    className={`w-full py-1.5 px-2 rounded-md text-xs font-bold transition-all hover:scale-[1.02] shadow-sm ${
                      contract.scheme_data
                        ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-800/60'
                        : 'bg-blue-900/50 text-blue-300 border border-blue-500/50 hover:bg-blue-800/60'
                    }`}
                  >
                    {contract.scheme_data ? '✏️ ویرایش طرح' : '➕ ایجاد طرح'}
                  </button>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-32 flex items-center justify-center">
            <div className="text-center text-gray-500">
              <div className="text-2xl mb-1">📄</div>
              <div className="text-xs">بدون قرارداد فعال</div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      {contracts.length > 0 && (
        <div className="mt-3 pt-2 border-t border-gray-700/50 flex items-center justify-between flex-shrink-0 text-xs">
          <span className="text-gray-400">کل قراردادها</span>
          <span className="font-bold text-gray-200">{contracts.length}</span>
        </div>
      )}
    </div>
  );
};

export default UserCard;
