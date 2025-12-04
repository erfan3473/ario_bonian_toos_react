// src/components/admin/UserCard.jsx

import React from 'react';

const UserCard = ({ user, onClick }) => {
  const employee = user?.employee_details;
  
  const contracts = employee?.contracts || [];
  const activeContracts = contracts.filter(c => c.is_active);
  
  const position = employee?.position;
  const positionTitle = position?.title || 'نامشخص';
  const positionColor = position?.color_hex || '#6B7280';
  
  const skillLevel = employee?.skill_level;
  const skillLevelDisplay = skillLevel ? `سطح ${skillLevel.level_number} - ${skillLevel.title}` : null;

  return (
    <div
      onClick={onClick}
      className="rounded-xl p-6 border-2 hover:shadow-2xl hover:scale-105 cursor-pointer transition-all duration-300 relative overflow-hidden"
      style={{ 
        borderColor: positionColor,
        backgroundImage: `linear-gradient(135deg, ${positionColor}15, ${positionColor}05)`,
      }}
    >
      {/* خط رنگی بالا */}
      <div 
        className="absolute top-0 left-0 right-0 h-1.5 z-10"
        style={{ backgroundColor: positionColor }}
      />
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div 
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-lg border-2 relative"
          style={{ 
            backgroundColor: positionColor,
            borderColor: positionColor,
          }}
        >
          {user.first_name?.[0] || user.username?.[0] || '👤'}
          
          {user.is_active && (
            <span 
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full animate-pulse"
              style={{ backgroundColor: '#10B981' }}
            />
          )}
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
        {user.is_superuser && (
          <span className="bg-purple-900/40 text-purple-300 px-3 py-1 rounded-full text-xs font-bold border-2 border-purple-500">
            👑 ادمین
          </span>
        )}
        
        {/* Badge سمت */}
        <span 
          className="px-3 py-1 rounded-full text-xs font-bold border-2 shadow-sm"
          style={{ 
            backgroundColor: `${positionColor}40`,
            borderColor: positionColor,
            color: positionColor,
            boxShadow: `0 0 10px ${positionColor}30`,
          }}
        >
          {positionTitle}
        </span>
        
        {employee?.is_worker && (
          <span className="bg-orange-900/40 text-orange-300 px-3 py-1 rounded-full text-xs font-bold border-2 border-orange-500">
            👷 کارگر
          </span>
        )}
      </div>

      {/* Info */}
      <div className="space-y-2 text-sm bg-gray-900/70 rounded-lg p-4 backdrop-blur-sm border border-gray-700/50">
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
        
        {skillLevelDisplay && (
          <div className="flex justify-between">
            <span className="text-gray-400">سطح مهارت:</span>
            <span className="text-yellow-400 font-bold">
              ⭐ {skillLevelDisplay}
            </span>
          </div>
        )}
      </div>

      {/* قراردادهای فعال */}
      {activeContracts.length > 0 && (
        <div className="mt-4 pt-4 border-t space-y-3" style={{ borderColor: `${positionColor}30` }}>
          <div className="text-gray-400 text-xs font-bold mb-2 flex items-center gap-2">
            <span>📋 قراردادهای فعال</span>
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: `${positionColor}50`,
                color: positionColor,
                border: `1px solid ${positionColor}`,
              }}
            >
              {activeContracts.length}
            </span>
          </div>
          {activeContracts.map((contract) => (
            <div 
              key={contract.id}
              className="bg-gray-900/50 p-3 rounded-lg border transition-all hover:scale-[1.02]"
              style={{ 
                borderColor: `${positionColor}50`,
                boxShadow: `0 0 15px ${positionColor}20`,
              }}
            >
              {/* پروژه */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-blue-400 font-bold text-sm">
                  📍 {contract.project_name || 'نامشخص'}
                </span>
              </div>
              
              {/* نوع استخدام */}
              {contract.employment_type_description && (
                <div 
                  className="inline-block px-3 py-1 rounded-full text-xs font-bold border"
                  style={{
                    backgroundColor: `${positionColor}30`,
                    borderColor: positionColor,
                    color: positionColor,
                  }}
                >
                  {contract.employment_type_description}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* قراردادها خالی */}
      {activeContracts.length === 0 && employee && (
        <div className="mt-4 pt-4 border-t border-gray-700/50">
          <div className="text-gray-500 text-xs text-center py-2">
            📄 بدون قرارداد فعال
          </div>
        </div>
      )}

      {/* Footer */}
      <div 
        className="mt-4 pt-4 border-t flex items-center justify-between rounded-lg p-2"
        style={{ 
          borderColor: `${positionColor}40`,
          backgroundColor: `${positionColor}15`,
        }}
      >
        <span
          className={`text-xs font-bold flex items-center gap-1 ${
            user.is_active ? 'text-green-400' : 'text-red-400'
          }`}
        >
          <span className="text-base">{user.is_active ? '✅' : '❌'}</span>
          {user.is_active ? 'فعال' : 'غیرفعال'}
        </span>
        
        {contracts.length > 0 && (
          <span className="text-gray-400 text-xs flex items-center gap-1">
            <span>📋</span>
            <span>{contracts.length} قرارداد</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default UserCard;
