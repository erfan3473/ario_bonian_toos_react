// src/components/WorkerCard.jsx
import React from 'react';

const statusMap = {
  NOT_STARTED: {
    label: 'بدون شیفت امروز',
    className: 'bg-gray-700 text-gray-300 border-gray-600',
  },
  WORKING: {
    label: 'درحال کار',
    className: 'bg-green-900/40 text-green-300 border-green-500/50',
  },
  FINISHED: {
    label: 'شیفت امروز تمام شده',
    className: 'bg-blue-900/30 text-blue-200 border-blue-500/50',
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
      className={`p-4 rounded-xl transition-all duration-200 border cursor-pointer relative overflow-hidden
        ${highlight ? 'ring-2 ring-blue-500 shadow-lg bg-gray-800' : 'hover:bg-gray-800 bg-gray-900'}
        ${worker.stale ? 'border-red-900/50' : 'border-gray-700'} 
      `}
    >
      {/* نوار وضعیت کنار کارت */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-1 ${
          worker.stale ? 'bg-red-500/50' : 'bg-green-500'
        }`}
      ></div>

      <div className="flex items-center gap-4">
        {/* آواتار */}
        <div className="relative">
          <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-800 flex-shrink-0">
            {worker.profile_image ? (
              <img
                src={worker.profile_image}
                alt={displayName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-500">
                {/* آیکون پیش‌فرض */}
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  className="w-8 h-8"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.5 6a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM3.751 20.105a8.25 8.25 0 0116.498 0 .75.75 0 01-.437.695A18.683 18.683 0 0112 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 01-.437-.695z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
            )}
          </div>
          {/* آنلاین / آفلاین */}
          <span
            className={`absolute bottom-0 left-0 w-3.5 h-3.5 border-2 border-gray-900 rounded-full ${
              worker.stale ? 'bg-gray-500' : 'bg-green-500 animate-pulse'
            }`}
          ></span>
        </div>

        {/* متن‌ها */}
        <div className="flex-1 min-w-0">
          {/* سر تیتر: نام کارگر */}
          <h3 className="text-white font-bold text-lg truncate">
            {displayName}
          </h3>

          {/* سمت شغلی */}
          <p className="text-sm text-blue-400 truncate">
            {worker.position || 'بدون سمت'}
          </p>

          {/* پروژه فعلی */}
          <p className="text-xs text-gray-400 mt-1 truncate">
            پروژه فعلی:{' '}
            <span className="text-indigo-300 font-medium">
              {worker.current_project_name || 'بدون پروژه'}
            </span>
          </p>

          {/* پایین کارت: فقط آنلاین/آخرین بازدید + وضعیت امروز (خط نام تکراری حذف شد) */}
          <div className="flex justify-end items-end mt-3 gap-2">
            <div className="flex flex-col items-end gap-1">
              <div className="flex items-center gap-1 text-xs">
                <span
                  className={worker.stale ? 'text-red-400' : 'text-green-400'}
                >
                  {worker.stale ? 'آخرین بازدید:' : 'آنلاین:'}
                </span>
                <span className="text-gray-300 font-medium">{lastSeen}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] border ${statusConf.className}`}
              >
                {statusConf.label}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkerCard;
