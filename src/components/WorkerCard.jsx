import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const statusMap = {
  NOT_STARTED: {
    label: 'بدون شیفت',
    classNameDark: 'bg-gray-800/60 text-gray-400 border-gray-700/50',
    classNameLight: 'bg-gray-100 text-gray-600 border-gray-200',
    dotColor: 'bg-gray-400',
  },
  WORKING: {
    label: 'در حال کار',
    classNameDark: 'bg-emerald-950/30 text-emerald-300 border-emerald-500/30',
    classNameLight: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dotColor: 'bg-emerald-500 animate-pulse',
  },
  FINISHED: {
    label: 'پایان شیفت',
    classNameDark: 'bg-blue-950/30 text-blue-300 border-blue-500/30',
    classNameLight: 'bg-blue-50 text-blue-700 border-blue-200',
    dotColor: 'bg-blue-500',
  },
};

const getGpsIssue = (worker) => {
  if (worker.gps_enabled === false) return 'GPS خاموش';
  if (worker.location_enabled === false) return 'لوکیشن خاموش';
  if (worker.permission_granted === false) return 'دسترسی رد شده';
  return null;
};

const WorkerCard = ({ worker, highlight, selected, onClick, onClickDetails, lastSeen }) => {
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const handleClick = () => {
    if (onClick) onClick(worker.id);
  };

  const statusKey = worker.today_attendance_status || 'NOT_STARTED';
  const statusConf = statusMap[statusKey] || statusMap.NOT_STARTED;

  const displayName = worker.full_name || 'نامشخص';
  const positionColor = worker.position_color_hex || '#3B82F6';
  const isOnline = !worker.stale;
  const gpsIssue = getGpsIssue(worker);

  const latestDate = worker.latest_attendance_date_jalali;
  const latestShiftIn = worker.latest_shift_in;

  const speedKmh = Number.isFinite(Number(worker.speed))
    ? Math.round(Number(worker.speed) * 3.6)
    : 0;
  const showSpeed = isOnline && speedKmh >= 1;

  return (
    <div
      onClick={handleClick}
      className={`
        w-full p-2.5 sm:p-3 rounded-2xl border transition-all cursor-pointer shadow-sm hover:shadow-md
        flex flex-col justify-between gap-2 relative overflow-hidden select-none
        ${selected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
        ${highlight ? 'animate-pulse ring-2 ring-amber-400' : ''}
        ${
          isOnline
            ? isDark
              ? 'bg-slate-900/90 border-emerald-500/40 hover:bg-slate-800'
              : 'bg-white border-emerald-400/50 hover:bg-emerald-50/40'
            : isDark
              ? 'bg-slate-950/60 border-gray-800 hover:bg-slate-900 opacity-80'
              : 'bg-gray-50/90 border-gray-200 hover:bg-gray-100/70 opacity-90'
        }
      `}
    >
      {/* آیکون هشدار GPS در گوشه کارت */}
      {gpsIssue && (
        <div
          title={gpsIssue}
          className="absolute top-2 left-2 z-10 flex items-center gap-1 bg-amber-500/15 border border-amber-500/40 text-amber-500 px-1.5 py-0.5 rounded-full text-[10px] font-bold animate-pulse"
        >
          <svg className="w-3 h-3 shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-[9px] hidden sm:inline">{gpsIssue}</span>
        </div>
      )}

      {/* هدر: آواتار و نام کاربر */}
      <div className="flex items-center gap-2.5">
        <div className="relative shrink-0">
          {worker.profile_image ? (
            <img
              src={worker.profile_image}
              alt={displayName}
              className="w-10 h-10 rounded-full object-cover border-2 shadow-inner"
              style={{ borderColor: positionColor }}
            />
          ) : (
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 shadow-inner"
              style={{ backgroundColor: positionColor, borderColor: positionColor }}
            >
              {displayName.charAt(0)}
            </div>
          )}
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
              isDark ? 'border-slate-900' : 'border-white'
            } ${isOnline ? 'bg-emerald-500' : 'bg-gray-400'}`}
          />
        </div>

        <div className="flex-1 min-w-0 pr-0.5">
          <h3
            title={displayName}
            className={`font-bold text-sm tracking-tight truncate leading-snug ${
              isOnline
                ? isDark ? 'text-gray-100' : 'text-gray-900'
                : isDark ? 'text-gray-400' : 'text-gray-500'
            }`}
          >
            {displayName}
          </h3>

          <div className="flex items-center gap-1.5 text-[11px] mt-0.5 truncate">
            <span
              className="font-medium shrink-0"
              style={{ color: positionColor }}
            >
              {worker.position || 'نیروی ساده'}
            </span>
            <span className={isDark ? 'text-gray-700' : 'text-gray-300'}>|</span>
            <span
              className={`truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}
              title={worker.current_project_name || 'بدون پروژه'}
            >
              {worker.current_project_name || 'بدون پروژه'}
            </span>
          </div>
        </div>
      </div>

      {gpsIssue && (
        <div className="sm:hidden flex items-center gap-1 text-[10px] text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-md -mt-1">
          <span>⚠️ {gpsIssue}</span>
        </div>
      )}

      {/* وضعیت شیفت */}
      <div
        className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-colors ${
          isDark ? statusConf.classNameDark : statusConf.classNameLight
        }`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          <span className={`w-2 h-2 rounded-full shrink-0 ${statusConf.dotColor}`} />
          <span className="font-semibold text-[11px] whitespace-nowrap">{statusConf.label}</span>

          {showSpeed && (
            <span
              className={`text-[9px] border px-1 py-0.2 rounded font-mono ${
                isDark
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-blue-100 text-blue-700 border-blue-300'
              }`}
            >
              {speedKmh}k
            </span>
          )}
        </div>

        <div className="flex items-center justify-end min-w-0 font-mono text-[10px]">
          {worker.shift_start || worker.shift_end ? (
            <div className="flex items-center gap-1 shrink-0">
              {worker.shift_start && (
                <span className={isDark ? 'text-emerald-400' : 'text-emerald-700'}>
                  ▲{worker.shift_start}
                </span>
              )}
              {worker.shift_end && (
                <span className={isDark ? 'text-blue-400 opacity-80' : 'text-blue-700 opacity-80'}>
                  ▼{worker.shift_end}
                </span>
              )}
            </div>
          ) : (
            latestDate && (
              <div
                title={`${latestDate} ${latestShiftIn ? `- ساعت: ${latestShiftIn}` : ''}`}
                className="flex flex-col items-end leading-tight opacity-80 truncate"
              >
                <span className="font-semibold text-[10px] tracking-tight">
                  {latestDate.replace(/^14\d{2}\//, '')}
                </span>
                {latestShiftIn && (
                  <span className={`text-[9px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {latestShiftIn}
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {/* فوتر: شناسه کاربری، دکمه اطلاعات و زمان آخرین به‌روزرسانی */}
      <div className={`flex items-center justify-between text-[10px] px-1 font-mono pt-1 border-t ${
        isDark ? 'border-gray-800 text-gray-500' : 'border-gray-100 text-gray-400'
      }`}>
        <span>{worker.user_id ? `#${worker.user_id}` : ''}</span>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onClickDetails) onClickDetails(worker);
          }}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-sans font-bold border transition-all ${
            isDark
              ? 'bg-blue-900/30 hover:bg-blue-900/60 text-blue-300 border-blue-500/40'
              : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200'
          }`}
          title="مشاهده خلاصه وضعیت پرسنلی"
        >
          <span>👤</span>
          <span>اطلاعات</span>
        </button>

        <span>{lastSeen || '—'}</span>
      </div>
    </div>
  );
};

export default memo(WorkerCard);