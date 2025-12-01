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
  const displayName = worker.name || 'ناشناس';

  return (
    <div
      onClick={handleClick}
      className={`p-4 rounded-xl transition-all duration-200 border cursor-pointer relative overflow-hidden group
        ${highlight ? 'ring-2 ring-blue-500 shadow-xl bg-gray-800 scale-[1.02]' : 'hover:bg-gray-800 bg-gray-900'}
        ${selected ? 'ring-2 ring-purple-500 shadow-lg' : ''}
        ${worker.stale ? 'border-red-900/30 opacity-75' : 'border-gray-700'} 
      `}
    >
      {/* نوار وضعیت رنگی */}
      <div className={`absolute right-0 top-0 bottom-0 w-1 transition-colors ${worker.stale ? 'bg-red-500/50' : statusConf.dotColor}`}></div>

      <div className="flex items-start gap-4">
        {/* آواتار */}
        <div className="relative mt-1 flex-shrink-0">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-700 bg-gradient-to-br from-gray-800 to-gray-900 shadow-inner">
            {worker.profile_image ? (
              <img 
                src={worker.profile_image} 
                alt={displayName} 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl font-bold">
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
          {/* نشانگر آنلاین/آفلاین */}
          <span className={`absolute -bottom-0.5 -left-0.5 w-4 h-4 border-2 border-gray-900 rounded-full shadow-lg ${worker.stale ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></span>
        </div>

        {/* محتوا */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-white font-bold text-base truncate leading-tight">{displayName}</h3>
              <p className="text-xs text-blue-400 mt-0.5 flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>{worker.position || 'نیروی ساده'}</span>
              </p>
            </div>
            
            {/* بج وضعیت */}
            <span className={`px-2 py-1 rounded-md text-[10px] border font-bold flex items-center gap-1 ${statusConf.className}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${statusConf.dotColor}`}></span>
              {statusConf.label}
            </span>
          </div>

          {/* پروژه */}
          <div className="bg-gray-800/50 rounded-lg px-2 py-1.5 mb-2">
            <p className="text-xs text-gray-400 truncate flex items-center gap-1.5">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-white font-medium">{worker.current_project_name || 'بدون پروژه'}</span>
            </p>
          </div>

          {/* زمان‌بندی شیفت */}
          <div className="flex justify-between items-center">
            {/* ساعات */}
            <div className="flex gap-2 text-xs">
              {/* شروع */}
              <div className="flex flex-col items-center bg-gray-800/50 px-2 py-1 rounded-lg">
                <span className="text-gray-500 text-[9px] uppercase">ورود</span>
                {worker.shift_start ? (
                  <span className="text-white font-mono font-bold tracking-wider text-xs">{worker.shift_start}</span>
                ) : (
                  <span className="text-gray-600 text-[10px]">--:--</span>
                )}
              </div>

              {/* فلش */}
              <div className="self-center text-gray-600 text-sm">→</div>

              {/* پایان */}
              <div className="flex flex-col items-center bg-gray-800/50 px-2 py-1 rounded-lg">
                <span className="text-gray-500 text-[9px] uppercase">خروج</span>
                {worker.shift_end ? (
                  <span className="text-white font-mono font-bold tracking-wider text-xs">{worker.shift_end}</span>
                ) : (
                  statusKey === 'WORKING' ? (
                    <span className="text-green-400/70 animate-pulse text-[9px] pt-0.5">جاری...</span>
                  ) : (
                    <span className="text-gray-600 text-[10px]">--:--</span>
                  )
                )}
              </div>
            </div>

            {/* آخرین بازدید */}
            <div className="text-[9px] text-gray-500 flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded-lg">
              <span className={`w-1.5 h-1.5 rounded-full ${worker.stale ? 'bg-red-400' : 'bg-green-400 animate-pulse'}`}></span>
              <span className="font-mono">{lastSeen}</span>
            </div>
          </div>
        </div>
      </div>

      {/* اثر انتخاب */}
      {selected && (
        <div className="absolute inset-0 bg-purple-500/5 pointer-events-none rounded-xl"></div>
      )}
    </div>
  );
};

export default WorkerCard;
