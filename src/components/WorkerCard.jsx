import React, { memo } from 'react';
import { useSelector } from 'react-redux';

const statusMap = {
  NOT_STARTED: {
    label: 'بدون شیفت',
    classNameDark: 'bg-gray-700/20 text-gray-400 border-gray-600/30',
    classNameLight: 'bg-gray-100 text-gray-600 border-gray-300',
    dotColor: 'bg-gray-500',
  },
  WORKING: {
    label: 'کار',
    classNameDark: 'bg-green-900/20 text-green-300 border-green-500/30',
    classNameLight: 'bg-green-100 text-green-700 border-green-300',
    dotColor: 'bg-green-500 animate-pulse',
  },
  FINISHED: {
    label: 'پایان',
    classNameDark: 'bg-blue-900/20 text-blue-300 border-blue-500/30',
    classNameLight: 'bg-blue-100 text-blue-700 border-blue-300',
    dotColor: 'bg-blue-500',
  },
};

const getGpsIssue = (worker) => {
  if (worker.gps_enabled === false) return 'GPS خاموش';
  if (worker.location_enabled === false) return 'لوکیشن خاموش';
  if (worker.permission_granted === false) return 'دسترسی رد شده';
  return null;
};

const WorkerCard = ({ worker, highlight, selected, onClick, lastSeen }) => {
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
        w-full p-3 rounded-xl border transition-all cursor-pointer shadow-sm hover:shadow-md
        flex flex-col gap-2 relative overflow-hidden
        ${selected ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
        ${highlight ? 'animate-pulse ring-2 ring-yellow-400' : ''}
        ${
          isOnline
            ? isDark
              ? 'bg-slate-800 border-green-500/40 hover:bg-slate-700'
              : 'bg-white border-green-400/50 hover:bg-green-50'
            : isDark
              ? 'bg-slate-900/50 border-gray-700 hover:bg-slate-800 opacity-80'
              : 'bg-gray-50 border-gray-300 hover:bg-gray-100 opacity-90'
        }
      `}
    >
      <div className="flex items-center gap-3">
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
          <span
            className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${
              isDark ? 'border-slate-800' : 'border-white'
            } ${isOnline ? 'bg-green-500' : 'bg-gray-500'}`}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1">
            <h3 className={`font-bold text-sm truncate ${isOnline ? (isDark ? 'text-white' : 'text-gray-900') : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>
              {displayName}
            </h3>
            <div className="flex items-center gap-1 shrink-0">
              {gpsIssue && (
                <span
                  title={gpsIssue}
                  className="text-xs bg-yellow-500/20 text-yellow-600 border border-yellow-500/40 px-1.5 py-0.5 rounded-full font-bold"
                >
                  ⚠️
                </span>
              )}
              {worker.user_id && (
                <span className={`text-[10px] font-mono px-1.5 rounded ${
                  isDark ? 'text-gray-500 bg-black/20' : 'text-gray-600 bg-gray-200'
                }`}>
                  #{worker.user_id}
                </span>
              )}
            </div>
          </div>

          <div className={`flex items-center gap-1.5 text-xs truncate mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <span style={{ color: positionColor }}>{worker.position || 'نیروی ساده'}</span>
            <span className={isDark ? 'text-gray-600' : 'text-gray-400'}>|</span>
            <span className={`truncate max-w-[100px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={worker.current_project_name}>
              {worker.current_project_name || 'بدون پروژه'}
            </span>
          </div>

          {gpsIssue && <span className="text-[10px] text-yellow-600 mt-0.5">{gpsIssue}</span>}
        </div>
      </div>

      <div className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border ${isDark ? statusConf.classNameDark : statusConf.classNameLight}`}>
        <div className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-full ${statusConf.dotColor}`} />
          <span className="text-xs font-bold">{statusConf.label}</span>

          {showSpeed ? (
            <span className={`ml-2 text-[10px] border px-1.5 py-0.5 rounded font-mono ${
              isDark
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                : 'bg-blue-100 text-blue-700 border-blue-300'
            }`}>
              💨 {speedKmh} km/h
            </span>
          ) : (
            <span className="ml-2 h-[18px] inline-block" />
          )}
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono">
          {worker.shift_start || worker.shift_end ? (
            <>
              {worker.shift_start && <span className={isDark ? 'text-green-300' : 'text-green-700'}>▲{worker.shift_start}</span>}
              {worker.shift_end && <span className={isDark ? 'text-blue-300 opacity-80' : 'text-blue-700 opacity-80'}>▼{worker.shift_end}</span>}
            </>
          ) : (
            latestDate && (
              <div className="flex items-center gap-1 opacity-75">
                <span className="text-[10px]">{latestDate}</span>
                {latestShiftIn && <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>({latestShiftIn})</span>}
              </div>
            )
          )}
        </div>
      </div>

      {lastSeen && (
        <div className={`text-[10px] text-right px-1 -mt-1 ${
          isDark ? 'text-gray-600' : 'text-gray-500'
        }`}>
          {lastSeen}
        </div>
      )}
    </div>
  );
};

// 🚀 استفاده از memo برای جلوگیری از رندر مجدد در هر تیک سوکت
export default memo(WorkerCard);