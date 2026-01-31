// src/components/admin/PeriodStatusManager.jsx
import React from 'react';

const PeriodStatusManager = ({ 
  currentPeriod, 
  isManager, 
  payrollLoading, 
  onStatusChange, 
  showSnackbar 
}) => {
  const PERIOD_STAGES = [
    { key: 'DRAFT', label: 'پیش‌نویس', icon: '📝', color: 'bg-gray-200 text-gray-700' },
    { key: 'SUPERVISOR_DONE', label: 'تایید سرپرست', icon: '👤', color: 'bg-yellow-200 text-yellow-800' },
    { key: 'FINANCE_CHECK', label: 'بررسی مالی', icon: '💰', color: 'bg-blue-200 text-blue-800' },
    { key: 'FINAL', label: 'آماده پرداخت', icon: '✅', color: 'bg-green-200 text-green-800' }
  ];

  const currentIndex = PERIOD_STAGES.findIndex(stage => stage.key === currentPeriod?.status);
  const isLocked = currentPeriod?.is_final;

  const handlePrev = () => {
    if (currentIndex > 0 && isManager && !isLocked) {
      onStatusChange(PERIOD_STAGES[currentIndex - 1].key);
    }
  };

  const handleNext = () => {
    if (currentIndex < PERIOD_STAGES.length - 1 && isManager && !isLocked) {
      onStatusChange(PERIOD_STAGES[currentIndex + 1].key);
    }
  };

  if (!currentPeriod) return null;

  return (
    <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-2xl p-6 mb-8 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
            <span className="text-2xl">📋</span>
          </div>
          <div>
            <h3 className="font-black text-xl text-gray-800">وضعیت پرونده حقوقی</h3>
            <p className="text-sm text-gray-600 mt-1">مراحل گردش کار کل دوره</p>
          </div>
        </div>
        
        {/* وضعیت فعلی برای همه */}
        <div className={`px-4 py-2 rounded-full text-sm font-bold border-2 shadow-md flex items-center gap-2 ${
          currentPeriod.status === 'FINAL'
            ? 'bg-green-100 text-green-800 border-green-400'
            : currentPeriod.status === 'FINANCE_CHECK'
            ? 'bg-blue-100 text-blue-800 border-blue-400'
            : currentPeriod.status === 'SUPERVISOR_DONE'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-400'
            : 'bg-gray-100 text-gray-700 border-gray-400'
        }`}>
          {currentPeriod.status_display || 'نامشخص'}
          {isLocked && <span className="text-lg">🔒</span>}
        </div>
      </div>

      {/* Progress Steps */}
      <div className="relative">
        {/* خطوط اتصال */}
        <div className="flex items-center mb-6">
          {PERIOD_STAGES.map((_, index) => (
            <React.Fragment key={index}>
              <div className={`flex-1 h-1 mx-2 rounded-full transition-all duration-300 ${
                index <= currentIndex 
                  ? 'bg-gradient-to-r from-indigo-400 to-purple-500' 
                  : 'bg-gray-200'
              }`} />
            </React.Fragment>
          ))}
        </div>

        {/* مراحل */}
        <div className="flex items-center justify-between -mt-6 px-4">
          {PERIOD_STAGES.map((stage, index) => {
            const isCurrent = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isLockedStage = isLocked && index >= currentIndex;

            return (
              <div 
                key={stage.key} 
                className={`flex flex-col items-center p-3 rounded-xl transition-all duration-300 cursor-pointer group flex-1 ${
                  isCurrent 
                    ? 'scale-110 shadow-2xl z-10' 
                    : isCompleted 
                    ? 'scale-105 shadow-lg' 
                    : 'scale-100 shadow-md hover:scale-105'
                } ${isLockedStage ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isLockedStage && isManager && onStatusChange(stage.key)}
              >
                {/* آیکون */}
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg border-4 transition-all duration-300 group-hover:shadow-xl ${
                  isCurrent ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white border-transparent shadow-purple-500/50' :
                  isCompleted ? 'bg-green-100 text-green-800 border-green-300' :
                  isLockedStage ? 'bg-gray-100 text-gray-400 border-gray-300' :
                  stage.color + ' border-white shadow-md'
                }`}>
                  {isCurrent ? (
                    <div className="flex flex-col items-center gap-1">
                      <span>{stage.icon}</span>
                      <span className="text-xs font-black">فعلی</span>
                    </div>
                  ) : stage.icon}
                </div>

                {/* متن */}
                <span className={`mt-2 text-xs font-bold px-2 py-1 rounded-full transition-all duration-300 text-center leading-tight ${
                  isCurrent ? 'bg-indigo-100 text-indigo-800 text-sm px-3 py-1 shadow-md' :
                  isCompleted ? 'bg-green-100 text-green-800' :
                  'text-gray-600'
                }`}>
                  {stage.label}
                </span>

                {/* Progress Number */}
                <span className={`text-[10px] font-black mt-1 ${
                  isCurrent ? 'text-indigo-600' : 'text-gray-400'
                }`}>
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* دکمه‌های کنترل (فقط مدیر) */}
      {isManager && (
        <div className="flex gap-3 justify-center mt-8 pt-6 border-t border-indigo-100">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || isLocked || payrollLoading}
            className="px-6 py-3 bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-1 max-w-xs"
          >
            <span>⬅️</span>
            <span>قدم قبلی</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === PERIOD_STAGES.length - 1 || isLocked || payrollLoading}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 flex-1 max-w-xs"
          >
            <span>قدم بعدی</span>
            <span>➡️</span>
          </button>

          {isLocked && (
            <button
              onClick={() => {
                if (window.confirm('⚠️ قفل دوره باز شود؟ (خطرناک!)')) {
                  onStatusChange(currentPeriod.status, true);
                }
              }}
              disabled={payrollLoading}
              className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg transition-all duration-300 disabled:opacity-50 flex items-center gap-2 flex-1 max-w-xs"
            >
              <span>🔓</span>
              <span>باز کردن قفل</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default PeriodStatusManager;
