// src/components/WorkerCard.jsx
import React from 'react';

const statusMap = {
  NOT_STARTED: {
    label: 'بدون شیفت',
    className: 'bg-gray-700 text-gray-400 border-gray-600',
    dotColor: 'bg-gray-500'
  },
  WORKING: {
    label: 'درحال کار',
    className: 'bg-green-900/30 text-green-300 border-green-500/40',
    dotColor: 'bg-green-500 animate-pulse'
  },
  FINISHED: {
    label: 'پایان کار',
    className: 'bg-blue-900/30 text-blue-300 border-blue-500/40',
    dotColor: 'bg-blue-500'
  },
};

const WorkerCard = ({ worker, highlight, onClick, lastSeen }) => {
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
        ${highlight ? 'ring-2 ring-blue-500 shadow-lg bg-gray-800 scale-[1.02]' : 'hover:bg-gray-800 bg-gray-900'}
        ${worker.stale ? 'border-red-900/30' : 'border-gray-700'} 
      `}
    >
      {/* نوار وضعیت رنگی کنار کارت */}
      <div className={`absolute right-0 top-0 bottom-0 w-1 transition-colors ${worker.stale ? 'bg-red-500/50' : statusConf.dotColor}`}></div>

      <div className="flex items-start gap-4">
        {/* آواتار */}
        <div className="relative mt-1">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800 shadow-inner">
            {worker.profile_image ? (
              <img src={worker.profile_image} alt={displayName} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500 text-2xl font-bold bg-gray-800">
                 {displayName.charAt(0)}
              </div>
            )}
          </div>
          {/* نشانگر آنلاین/آفلاین */}
          <span className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-2 border-gray-900 rounded-full ${worker.stale ? 'bg-gray-500' : 'bg-green-500 animate-pulse'}`}></span>
        </div>

        {/* محتوا */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <div>
                <h3 className="text-white font-bold text-lg truncate leading-tight">{displayName}</h3>
                <p className="text-xs text-blue-400 mt-1">{worker.position || 'نیروی ساده'}</p>
            </div>
            {/* بج وضعیت */}
            <span className={`px-2 py-0.5 rounded text-[10px] border font-bold ${statusConf.className}`}>
                {statusConf.label}
            </span>
          </div>

          {/* پروژه */}
          <p className="text-xs text-gray-400 mt-2 truncate flex items-center gap-1">
            <span className="opacity-50">📍</span>
            <span className="text-gray-300">{worker.current_project_name || '---'}</span>
          </p>

          {/* خط جداکننده */}
          <div className="h-px bg-gray-700/50 my-3"></div>

          {/* ⏱ بخش زمان‌بندی (جدید) */}
          <div className="flex justify-between items-end">
            
            {/* زمان‌های شیفت */}
            <div className="flex gap-3 text-xs">
                {/* ساعت شروع */}
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px]">شروع</span>
                    {worker.shift_start ? (
                        <span className="text-white font-mono font-bold tracking-wider">{worker.shift_start}</span>
                    ) : (
                        <span className="text-gray-600">--:--</span>
                    )}
                </div>

                {/* فلش بین ساعت‌ها */}
                <div className="self-center text-gray-600">➝</div>

                {/* ساعت پایان */}
                <div className="flex flex-col">
                    <span className="text-gray-500 text-[10px]">پایان</span>
                    {worker.shift_end ? (
                        <span className="text-white font-mono font-bold tracking-wider">{worker.shift_end}</span>
                    ) : (
                        statusKey === 'WORKING' ? (
                            <span className="text-green-400/70 animate-pulse text-[10px] pt-0.5">در حال کار...</span>
                        ) : (
                            <span className="text-gray-600">--:--</span>
                        )
                    )}
                </div>
            </div>

            {/* آخرین بازدید */}
            <div className="text-[10px] text-gray-500 flex items-center gap-1 bg-gray-800/50 px-2 py-1 rounded">
               <span className={worker.stale ? 'text-red-400' : 'text-green-400'}>●</span>
               {lastSeen}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;