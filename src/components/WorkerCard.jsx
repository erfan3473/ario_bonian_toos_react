// src/components/WorkerCard.jsx

import React from 'react';

const statusMap = {
  NOT_STARTED: {
    label: 'بدون شیفت',
    className: 'bg-gray-700/30 text-gray-400 border-gray-600',
    dotColor: 'bg-gray-500',
    iconColor: 'text-gray-500'
  },
  WORKING: {
    label: 'در حال کار',
    className: 'bg-green-900/30 text-green-300 border-green-500/40',
    dotColor: 'bg-green-500 animate-pulse',
    iconColor: 'text-green-500'
  },
  FINISHED: {
    label: 'پایان کار',
    className: 'bg-blue-900/30 text-blue-300 border-blue-500/40',
    dotColor: 'bg-blue-500',
    iconColor: 'text-blue-500'
  },
};

const WorkerCard = ({ worker, highlight, selected, onClick, lastSeen }) => {
  const handleClick = () => {
    if (onClick) onClick(worker.id);
  };

  const statusKey = worker.today_attendance_status || 'NOT_STARTED';
  const statusConf = statusMap[statusKey] || statusMap.NOT_STARTED;

  const displayName = worker.full_name || 'اسم ثبت نشده';
  const positionColor = worker.position_color_hex || '#3B82F6';
  const isOnline = !worker.stale;

  // ✅ اطلاعات آخرین شیفت (از Backend)
  const latestDate = worker.latest_attendance_date_jalali;
  const latestShiftIn = worker.latest_shift_in;
  const latestShiftOut = worker.latest_shift_out;
  const isShiftOpen = worker.is_shift_open;

  return (
    <div
      onClick={handleClick}
      className={`
        relative p-4 rounded-lg border-2 cursor-pointer transition-all
        ${selected ? 'ring-2 ring-blue-400 scale-105' : ''}
        ${highlight ? 'animate-pulse ring-2 ring-yellow-400' : ''}
        ${isOnline 
          ? 'bg-slate-800/60 border-green-500/50 hover:bg-slate-700/80' 
          : 'bg-slate-800/30 border-gray-600/50 hover:bg-slate-800/50 opacity-70'
        }
      `}
    >
      {/* Badge آنلاین/آفلاین */}
      <div className="absolute top-2 left-2">
        {isOnline ? (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-green-900/40 text-green-300 text-xs rounded-full border border-green-500/30">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            آنلاین
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2 py-0.5 bg-gray-700/40 text-gray-400 text-xs rounded-full border border-gray-600/30">
            <span className="w-2 h-2 bg-gray-500 rounded-full"></span>
            آفلاین
          </span>
        )}
      </div>

      {/* گوشه بالا راست: user.id */}
      {worker.user_id && (
        <div className="absolute top-2 right-2 text-[10px] text-gray-400 bg-slate-900/70 px-2 py-0.5 rounded-full border border-slate-700">
          ID: {worker.user_id}
        </div>
      )}

      {/* هدر کارت */}
      <div className="flex items-center gap-3 mb-3 mt-4">
        {/* عکس پروفایل */}
        <div className="relative">
          {worker.profile_image ? (
            <img
              src={worker.profile_image}
              alt={displayName}
              className="w-12 h-12 rounded-full object-cover border-2"
              style={{ borderColor: positionColor }}
            />
          ) : (
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold border-2"
              style={{ backgroundColor: positionColor, borderColor: positionColor }}
            >
              {displayName.charAt(0)}
            </div>
          )}
          
          {/* نقطه وضعیت آنلاین */}
          <span 
            className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-800 ${
              isOnline ? 'bg-green-500' : 'bg-gray-500'
            }`}
          />
        </div>

        {/* نام و نام خانوادگی */}
        <div className="flex-1 min-w-0">
          <h3 className={`font-semibold truncate ${isOnline ? 'text-white' : 'text-gray-400'}`}>
            {displayName}
          </h3>
          <p className="text-sm text-gray-400 truncate">
            {worker.position || 'نیروی ساده'}
          </p>
        </div>
      </div>

      {/* اطلاعات پروژه */}
      <div className="mb-3 p-2 rounded bg-slate-900/40 border border-slate-700/50">
        <p className="text-xs text-gray-400 mb-1">پروژه</p>
        <p className="text-sm text-gray-200 truncate">
          {worker.current_project_name || 'بدون پروژه'}
        </p>
      </div>

      {/* وضعیت شیفت */}
      <div className={`p-2 rounded border ${statusConf.className}`}>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${statusConf.dotColor}`}></span>
            <span className="text-sm font-medium">{statusConf.label}</span>
          </div>
        </div>
        
        {/* ✅ نمایش ورود و خروج (شیفت امروز) */}
        {(worker.shift_start || worker.shift_end) && (
          <div className="flex items-center gap-3 text-xs mt-2 pt-2 border-t border-gray-700/50">
            {worker.shift_start && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">ورود:</span>
                <span className="font-semibold text-green-300">{worker.shift_start}</span>
              </div>
            )}
            
            {worker.shift_end && (
              <div className="flex items-center gap-1">
                <span className="text-gray-400">خروج:</span>
                <span className="font-semibold text-blue-300">{worker.shift_end}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ✅ آخرین شیفت (اگه امروز شیفت نداره) */}
      {!worker.shift_start && !worker.shift_end && latestDate && latestShiftIn && (
        <div className="mt-2 p-2 rounded bg-slate-900/30 border border-slate-700/30">
          <p className="text-[10px] text-gray-500 mb-1">آخرین حضور</p>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{latestDate}</span>
            <div className="flex items-center gap-2">
              <span className="text-green-300">{latestShiftIn}</span>
              {isShiftOpen ? (
                <span className="text-orange-400 animate-pulse">● باز</span>
              ) : latestShiftOut ? (
                <span className="text-blue-300">{latestShiftOut}</span>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* آخرین بروزرسانی */}
      {lastSeen && (
        <div className="mt-2 text-xs text-gray-500 text-center">
          {lastSeen}
        </div>
      )}
    </div>
  );
};

export default WorkerCard;
