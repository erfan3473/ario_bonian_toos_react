// src/components/WorkerCard.jsx

import React from 'react';

const statusMap = {
  NOT_STARTED: {
    label: 'بدون شیفت',
    className: 'bg-gray-700/20 text-gray-400 border-gray-600/30',
    dotColor: 'bg-gray-500',
  },
  WORKING: {
    label: 'کار', // کوتاه شده برای جا شدن
    className: 'bg-green-900/20 text-green-300 border-green-500/30',
    dotColor: 'bg-green-500 animate-pulse',
  },
  FINISHED: {
    label: 'پایان', // کوتاه شده
    className: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
    dotColor: 'bg-blue-500',
  },
};

const WorkerCard = ({ worker, highlight, selected, onClick, lastSeen }) => {
  const handleClick = () => {
    if (onClick) onClick(worker.id);
  };

  const statusKey = worker.today_attendance_status || 'NOT_STARTED';
  const statusConf = statusMap[statusKey] || statusMap.NOT_STARTED;

  const displayName = worker.full_name || 'نامشخص';
  const positionColor = worker.position_color_hex || '#3B82F6';
  const isOnline = !worker.stale;

  // اطلاعات آخرین شیفت
  const latestDate = worker.latest_attendance_date_jalali;
  const latestShiftIn = worker.latest_shift_in;
  const latestShiftOut = worker.latest_shift_out;
  const isShiftOpen = worker.is_shift_open;

  return (
    <div
      onClick={handleClick}
      className={`
        w-full p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md
        flex flex-col gap-2 relative overflow-hidden
        ${selected ? 'ring-2 ring-blue-500 bg-blue-900/10' : ''}
        ${highlight ? 'animate-pulse ring-2 ring-yellow-400' : ''}
        ${isOnline 
          ? 'bg-slate-800 border-green-500/40 hover:bg-slate-700' 
          : 'bg-slate-900/50 border-gray-700 hover:bg-slate-800 opacity-80'
        }
      `}
    >
      {/* 1️⃣ ردیف بالا: آواتار + مشخصات اصلی + ID */}
      <div className="flex items-center gap-3">
        {/* آواتار */}
        <div className="relative shrink-0">
          {worker.profile_image ? (
            <img
              src={worker.profile_image}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border-2"
              style={{ borderColor: positionColor }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2"
              style={{ backgroundColor: positionColor, borderColor: positionColor }}
            >
              {displayName.charAt(0)}
            </div>
          )}
          {/* دات آنلاین */}
          <span className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-slate-800 ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`} />
        </div>

        {/* نام و سمت و پروژه */}
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between">
            <h3 className={`font-bold text-sm truncate ${isOnline ? 'text-white' : 'text-gray-400'}`}>
              {displayName}
            </h3>
            {/* ID در گوشه بالا */}
            {worker.user_id && (
              <span className="text-[10px] font-mono text-gray-500 bg-black/20 px-1.5 rounded">
                #{worker.user_id}
              </span>
            )}
          </div>
          
          {/* ترکیب سمت و پروژه در یک خط */}
          <div className="flex items-center gap-1.5 text-xs text-gray-400 truncate mt-0.5">
            <span style={{ color: positionColor }}>{worker.position || 'نیروی ساده'}</span>
            <span className="text-gray-600">|</span>
            <span className="text-gray-300 truncate max-w-[100px]" title={worker.current_project_name}>
              {worker.current_project_name || 'بدون پروژه'}
            </span>
          </div>
        </div>
      </div>

      {/* 2️⃣ ردیف پایین: وضعیت و ساعت‌ها (در یک خط) */}
      <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${statusConf.className}`}>
        
        {/* سمت راست: لیبل وضعیت */}
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusConf.dotColor}`}></span>
          <span className="text-xs font-bold">{statusConf.label}</span>
        </div>

        {/* سمت چپ: ساعت‌ها */}
        <div className="flex items-center gap-2 text-[11px] font-mono">
            {/* حالت عادی: نمایش ساعت امروز */}
            {(worker.shift_start || worker.shift_end) ? (
                <>
                    {worker.shift_start && <span className="text-green-300">▲{worker.shift_start}</span>}
                    {worker.shift_end && <span className="text-blue-300 opacity-80">▼{worker.shift_end}</span>}
                </>
            ) : (
                /* حالت بدون شیفت امروز: نمایش خلاصه آخرین بازدید */
                latestDate && (
                    <div className="flex items-center gap-1 opacity-75">
                        <span className="text-[10px]">{latestDate}</span>
                        {latestShiftIn && <span className="text-gray-300">({latestShiftIn})</span>}
                    </div>
                )
            )}
        </div>
      </div>
      
      {/* 3️⃣ فوتر خیلی کوچک: Last Seen */}
      {lastSeen && (
        <div className="text-[10px] text-gray-600 text-right px-1 -mt-1">
           {lastSeen}
        </div>
      )}

    </div>
  );
};

export default WorkerCard;