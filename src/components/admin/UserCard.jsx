// src/components/admin/UserCard.jsx
import React from 'react';

const UserCard = ({ user, onClick, isDark }) => {
  const employee = user?.employee_details;
  
  const contracts = [...(employee?.contracts || [])].sort((a, b) => b.id - a.id);
  const activeContracts = contracts.filter(c => c.is_active);
  
  const position = employee?.position;
  const positionTitle = position?.title || 'نامشخص';
  const positionColor = position?.color_hex || (isDark ? '#6B7280' : '#9CA3AF');
  const skillLevel = employee?.skill_level;
  const skillLevelDisplay = skillLevel ? `سطح ${skillLevel.level_number}` : null;

  const avatarText = user.first_name?.[0]?.toUpperCase() || user.username?.[0]?.toUpperCase() || '?';

  const joinedDate = user.date_joined 
    ? new Date(user.date_joined).toLocaleDateString('fa-IR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) 
    : 'نامشخص';

  return (
    <div
      onClick={onClick}
      className={`group p-5 rounded-2xl border transition-all duration-300 relative overflow-hidden flex flex-col w-full min-w-0 cursor-pointer ${
        isDark 
          ? 'bg-gray-800 border-gray-700 hover:border-gray-500 shadow-sm' 
          : 'bg-white border-gray-200 hover:border-blue-400 shadow-md hover:shadow-xl'
      }`}
      style={{ 
        boxShadow: isDark ? `0 4px 20px ${positionColor}10` : `0 4px 15px ${positionColor}15`,
        borderTopWidth: '4px',
        borderTopColor: positionColor,
        minHeight: activeContracts.length === 0 ? '300px' : 'auto', 
      }}
    >
      <div className="flex items-start justify-between gap-3 mb-4 flex-shrink-0">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div 
            className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl flex-shrink-0 shadow-sm border-2 relative overflow-hidden flex items-center justify-center ${
              isDark ? 'ring-1 ring-white/10' : 'ring-1 ring-black/5'
            }`}
            style={{ 
              backgroundColor: isDark ? `${positionColor}20` : `${positionColor}15`,
              borderColor: positionColor,
            }}
          >
            {user.profile?.image ? (
              <img 
                src={user.profile.image} 
                alt={user.username} 
                className="w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className={`text-xl sm:text-2xl font-black ${isDark ? 'text-white' : 'text-gray-700'}`}>
                {avatarText}
              </span>
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            <div className={`font-black text-sm sm:text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {user.first_name || '---'}
            </div>
            <div className={`font-bold text-xs sm:text-sm truncate opacity-90 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              {user.last_name || user.username}
            </div>
            <div className={`text-[10px] sm:text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              کد: <span className="font-mono">{employee?.id || '---'}</span>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0">
          <span 
            className="px-2 sm:px-2.5 py-1 rounded-lg text-[10px] sm:text-xs font-bold border shadow-sm truncate max-w-[100px] sm:max-w-[120px] inline-block text-center"
            style={{ 
              backgroundColor: isDark ? `${positionColor}30` : `${positionColor}15`, 
              borderColor: positionColor,
              color: isDark ? '#FFF' : positionColor
            }}
            title={positionTitle}
          >
            {positionTitle}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4 px-1 flex-shrink-0">
        <div className="flex flex-wrap gap-1.5">
          {user.is_superuser && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border shadow-sm ${
              isDark ? 'bg-purple-900/40 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>👑 ادمین</span>
          )}
          {employee?.is_worker && (
            <span className={`px-2 py-0.5 rounded-md text-[10px] sm:text-xs font-bold border shadow-sm ${
              isDark ? 'bg-orange-900/40 text-orange-300 border-orange-500/30' : 'bg-orange-50 text-orange-700 border-orange-200'
            }`}>👷 کارگر</span>
          )}
        </div>

        {skillLevelDisplay && (
          <span className={`text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md shadow-sm border ${
            isDark ? 'text-yellow-400 bg-yellow-900/20 border-yellow-500/30' : 'text-yellow-700 bg-yellow-50 border-yellow-200'
          }`}>
            ⭐ {skillLevelDisplay}
          </span>
        )}
      </div>

      <div className={`grid grid-cols-2 gap-3 mb-4 text-[10px] sm:text-xs rounded-xl p-3 border flex-shrink-0 transition-colors ${
        isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
      }`}>
        <div className="space-y-1 overflow-hidden">
          <span className={`block font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>کد ملی</span>
          <span className={`font-mono font-black truncate block ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {employee?.code_meli || '---'}
          </span>
        </div>
        <div className="space-y-1 overflow-hidden">
          <span className={`block font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>موبایل</span>
          <span className={`font-black truncate block ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
            {user.profile?.phone_number || '---'}
          </span>
        </div>
        <div className={`col-span-2 border-t pt-2 mt-1 flex items-center justify-between ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
          <span className={`font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>تاریخ ثبت‌نام:</span>
          <span className={`font-black truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{joinedDate}</span>
        </div>
      </div>

      <div className="space-y-2 flex-shrink-0 flex-grow">
        {activeContracts.length > 0 ? (
          <>
            <div className="flex items-center gap-2 mb-3">
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>📋</span>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] sm:text-xs font-bold border shadow-sm ${
                isDark ? 'text-white bg-blue-600/80 border-blue-500' : 'text-blue-700 bg-blue-100 border-blue-300'
              }`}>
                {activeContracts.length} قرارداد فعال
              </span>
            </div>

            <div className="space-y-2">
              {activeContracts.map((contract) => (
                <div 
                  key={contract.id}
                  className={`rounded-lg p-2.5 border transition-all ${
                    isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[11px] sm:text-xs font-bold truncate ${isDark ? 'text-blue-300' : 'text-blue-600'}`} title={contract.project_name}>
                      📍 {contract.project_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="h-full min-h-[4rem] flex flex-col items-center justify-center opacity-70">
            <div className="text-xl sm:text-2xl mb-1">📄</div>
            <div className={`text-[10px] sm:text-xs font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>بدون قرارداد فعال</div>
          </div>
        )}
      </div>

      {contracts.length > 0 && (
        <div className={`mt-4 pt-3 border-t flex items-center justify-between flex-shrink-0 text-[10px] sm:text-xs font-bold ${
          isDark ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>کل قراردادهای ثبت شده</span>
          <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{contracts.length} مورد</span>
        </div>
      )}
    </div>
  );
};

export default UserCard;