// src/components/admin/PeriodStatusManager.jsx
import React from 'react';
import { formatJalaliDateLong } from '../../utils/dateUtils'; // ← اضافه کن
const PeriodStatusManager = ({ 
  currentPeriod, 
  isManager, 
  payrollLoading, 
  onStatusChange, 
  showSnackbar 
}) => {
  const PERIOD_STAGES = [
    { key: 'DRAFT', label: 'پیش‌نویس', icon: '📝', color: 'bg-gray-100' },
    { key: 'SUPERVISOR_DONE', label: 'تایید سرپرست', icon: '👤', color: 'bg-yellow-100' },
    { key: 'FINANCE_CHECK', label: 'بررسی مالی', icon: '💰', color: 'bg-blue-100' },
    { key: 'FINAL', label: 'آماده پرداخت', icon: '✅', color: 'bg-green-100' }
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
    <div className="bg-white border border-gray-200 rounded-xl p-6 mb-8 shadow-sm">
      {/* Header — با تاریخ */}
      <div className="flex flex-col items-center text-center mb-6 pb-4 border-b border-gray-200">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center">
            <span className="text-lg">📋</span>
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900">وضعیت دوره حقوقی</h3>
          </div>
        </div>
        
        {/* ← تاریخ دوره - جدید */}
        <p className="text-sm text-gray-600 font-medium mb-2">
          لیست حقوق: {formatJalaliDateLong(currentPeriod.start_date)} تا{' '}
          <span className="font-semibold text-gray-900">
            {formatJalaliDateLong(currentPeriod.end_date)}
          </span>
        </p>
        
        <p className="text-sm text-gray-500">مرحله فعلی گردش کار</p>
        
        {/* وضعیت فعلی — وسط */}
        <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 mt-3 w-fit mx-auto ${
            currentPeriod.status === 'FINAL'
            ? 'bg-green-100 text-green-800 border-green-300'
            : currentPeriod.status === 'FINANCE_CHECK'
            ? 'bg-blue-100 text-blue-800 border-blue-300'
            : currentPeriod.status === 'SUPERVISOR_DONE'
            ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
            : 'bg-gray-100 text-gray-700 border-gray-300'
        }`}>
            {currentPeriod.status_display || currentPeriod.status || 'نامشخص'}
            {isLocked && <span className="text-sm font-bold">🔒</span>}
        </div>
        </div>


      {/* Progress Bar */}
      <div className="space-y-6">
        {/* خط پیشرفت */}
        <div className="flex items-center gap-4">
          {PERIOD_STAGES.map((_, index) => (
            <React.Fragment key={index}>
              <div className={`flex-1 h-1.5 rounded-full ${
                index < currentIndex 
                  ? 'bg-green-500' 
                  : index === currentIndex 
                  ? 'bg-blue-500' 
                  : 'bg-gray-200'
              }`} />
            </React.Fragment>
          ))}
        </div>

        {/* مراحل */}
        <div className="grid grid-cols-4 gap-4">
          {PERIOD_STAGES.map((stage, index) => {
            const isCurrent = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isLockedStage = isLocked && index >= currentIndex;

            return (
              <div 
                key={stage.key}
                className={`flex flex-col items-center p-3 rounded-lg border-2 transition-colors duration-200 cursor-pointer group ${
                  isCurrent 
                    ? 'border-blue-400 bg-blue-50 shadow-md ring-2 ring-blue-200' 
                    : isCompleted 
                    ? 'border-green-400 bg-green-50 shadow-sm' 
                    : isLockedStage 
                    ? 'border-gray-300 bg-gray-50 cursor-not-allowed opacity-60'
                    : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
                }`}
                onClick={() => !isLockedStage && isManager && onStatusChange(stage.key)}
              >
                {/* آیکون */}
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-semibold mb-2 border transition-colors ${
                  isCurrent 
                    ? 'bg-blue-500 text-white border-blue-600' 
                    : isCompleted 
                    ? 'bg-green-500 text-white border-green-600' 
                    : isLockedStage 
                    ? 'bg-gray-300 text-gray-500 border-gray-400' 
                    : `${stage.color} text-gray-700 border-gray-300`
                }`}>
                  {isCurrent ? (
                    <>
                      <span>{stage.icon}</span>
                      <span className="text-xs font-bold mt-1 block">فعلی</span>
                    </>
                  ) : stage.icon}
                </div>

                {/* برچسب */}
                <span className={`text-xs font-medium text-center leading-tight px-1 ${
                  isCurrent 
                    ? 'text-blue-800' 
                    : isCompleted 
                    ? 'text-green-800'
                    : isLockedStage 
                    ? 'text-gray-500' 
                    : 'text-gray-700'
                }`}>
                  {stage.label}
                </span>

                {/* شماره */}
                <span className={`text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center mt-1 ${
                  isCurrent 
                    ? 'bg-blue-500 text-white' 
                    : isCompleted 
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}>
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* دکمه‌های کنترل */}
      {isManager && (
        <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={currentIndex === 0 || isLocked || payrollLoading}
            className="flex-1 px-4 py-2.5 bg-gray-500 hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg border border-gray-600 transition-colors text-sm h-11 flex items-center justify-center gap-2 shadow-sm"
          >
            <span>قدم قبلی</span>
            <span>➡️</span>
          </button>

          <button
            onClick={handleNext}
            disabled={currentIndex === PERIOD_STAGES.length - 1 || isLocked || payrollLoading}
            className="flex-1 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg border border-blue-700 transition-colors text-sm h-11 flex items-center justify-center gap-2 shadow-sm"
          >
            <span>قدم بعدی</span>
            <span>⬅️</span>
          </button>

          {isLocked && (
            <button
              onClick={() => {
                if (window.confirm('⚠️ قفل دوره باز شود؟')) {
                  onStatusChange(currentPeriod.status, true);
                }
              }}
              disabled={payrollLoading}
              className="px-4 py-2.5 bg-red-500 hover:bg-red-600 disabled:bg-red-300 disabled:cursor-not-allowed text-white font-semibold rounded-lg border border-red-600 transition-colors text-sm h-11 flex items-center justify-center gap-2 shadow-sm flex-1"
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
