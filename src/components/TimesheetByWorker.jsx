// src/components/TimesheetByWorker.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWorkerLocationStats } from '../features/attendance/attendanceSlice';

/* ==========================================
   توابع کمکی
   ========================================== */
const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const decimalHoursToHHMM = (hours) => {
  if (hours === null || hours === undefined || isNaN(hours)) return '-';
  const totalMinutes = Math.round(hours * 60);
  return formatMinutes(totalMinutes);
};

/* ==========================================
   وضعیت‌ها و برچسب‌های رنگی (پشتیبانی از Dark/Light)
   ========================================== */
const getStatusInfo = (status, isDark) => {
  const STATUS_MAP = {
    PRESENT: { label: 'حاضر', color: isDark ? 'text-green-400 bg-green-900/40 border-green-700' : 'text-green-700 bg-green-50 border-green-200' },
    ABSENT: { label: 'غایب', color: isDark ? 'text-red-400 bg-red-900/40 border-red-700' : 'text-red-700 bg-red-50 border-red-200' },
    LEAVE: { label: 'مرخصی', color: isDark ? 'text-blue-400 bg-blue-900/40 border-blue-700' : 'text-blue-700 bg-blue-50 border-blue-200' },
    APPROVED: { label: 'تایید شده', color: isDark ? 'text-green-300 bg-green-800/40 border-green-600' : 'text-green-700 bg-green-100 border-green-300' },
    PENDING: { label: 'در انتظار', color: isDark ? 'text-yellow-400 bg-yellow-900/40 border-yellow-700' : 'text-yellow-700 bg-yellow-100 border-yellow-300' },
    REJECTED: { label: 'رد شده', color: isDark ? 'text-red-300 bg-red-800/40 border-red-600' : 'text-red-700 bg-red-200 border-red-400' },
    RETURNED: { label: 'برگشتی', color: isDark ? 'text-purple-400 bg-purple-900/40 border-purple-700' : 'text-purple-700 bg-purple-100 border-purple-300' },
    SKIPPED: { label: 'رد مرحله', color: isDark ? 'text-gray-400 bg-gray-700 border-gray-500' : 'text-gray-500 bg-gray-100 border-gray-300' },
    NO_CONTRACT: { label: 'بدون قرارداد', color: isDark ? 'text-slate-300 bg-slate-700 border-slate-500' : 'text-slate-600 bg-slate-100 border-slate-300' },
  };

  return STATUS_MAP[status] || {
    label: status || 'نامشخص',
    color: isDark ? 'text-gray-400 bg-gray-800 border-gray-600' : 'text-gray-600 bg-gray-100 border-gray-300',
  };
};

const StatusBadge = ({ status }) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');
  const { label, color } = getStatusInfo(status, isDark);
  return <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold border ${color}`}>{label}</span>;
};

/* ==========================================
   کامپوننت جدول مراحل تأیید مینیاتوری
   ========================================== */
const ApprovalStepsMiniTable = ({ steps }) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

  if (!steps || steps.length === 0) {
    return <span className={`text-[10px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>;
  }

  return (
    <table className={`min-w-[180px] text-[10px] border rounded overflow-hidden shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>
      <thead>
        <tr className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>مرحله</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>وضعیت</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>تأییدکننده</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>سمت</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-300'}`}>یادداشت</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step, idx) => (
          <tr key={idx} className={`border-t ${isDark ? 'border-gray-700 even:bg-gray-800/50' : 'border-gray-200 even:bg-gray-50'}`}>
            <td className={`px-1 py-0.5 text-center font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{step.step_order ?? '-'}</td>
            <td className="px-1 py-0.5 text-center"><StatusBadge status={step.status} /></td>
            <td className={`px-1 py-0.5 text-center whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{step.approver_name || '---'}</td>
            <td className={`px-1 py-0.5 text-center whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{step.approver_position || '---'}</td>
            <td className={`px-1 py-0.5 text-center max-w-[80px] truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={step.note}>{step.note || '---'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ==========================================
   کامپوننت اصلی TimesheetByWorker
   ========================================== */
const TimesheetByWorker = ({ workers, byWorker }) => {
  const dispatch = useDispatch();
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

  const { filters, locationStats, locationStatsLoading, locationStatsError } = useSelector((state) => state.attendance);
  const [activeGpsWorker, setActiveGpsWorker] = useState(null);

  if (!workers || workers.length === 0) {
    return <div className={`p-4 text-center text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>داده‌ای برای نمایش وجود ندارد.</div>;
  }

  const getDayType = (day) => {
    if (day.is_official_holiday) return 'تعطیل رسمی';
    if (day.is_friday) return 'جمعه';
    return 'عادی';
  };

  const handleToggleGps = (workerId) => {
    if (activeGpsWorker === workerId) {
      setActiveGpsWorker(null);
    } else {
      setActiveGpsWorker(workerId);
      dispatch(fetchWorkerLocationStats({
        worker_id: workerId,
        start_date: filters.start_date,
        end_date: filters.end_date,
        project_id: filters.projectId
      }));
    }
  };

  return (
    <div className="space-y-6">
      {workers.map((w, index) => {
        const wData = byWorker[w.worker_id];
        if (!wData) return null;

        const days = wData.days || [];
        const summary = wData.summary || {};
        const isGpsOpen = activeGpsWorker === w.worker_id;

        return (
          <div key={w.worker_id} className={`overflow-hidden rounded-lg border shadow-sm mb-4 ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
            
            {/* هدر کارگر فشرده شده */}
            <div className={`px-3 py-2 border-b ${isDark ? 'bg-slate-800 border-gray-700' : 'bg-slate-100 border-gray-200'}`}>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  {/* دایره شماره ردیف */}
                  <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-mono shadow-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'}`}>
                    {index + 1}
                  </span>
                  
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${isDark ? 'bg-blue-900/50 text-blue-300' : 'bg-blue-200 text-blue-800'}`}>
                    {(w.worker_name || '?')[0]}
                  </div>
                  <div className="leading-tight">
                    <h3 className={`font-bold text-[13px] ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>{w.worker_name}</h3>
                    <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>کد: <span className="font-mono">{w.worker_code}</span></div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className={`text-[11px] px-2 py-1 rounded shadow-sm border ${isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-white text-gray-700 border-gray-200'}`}>
                    <span className="font-semibold">حضور:</span> <span className="font-mono">{summary.total_present_days ?? 0}</span> روز
                  </div>

                  {/* دکمه باز کردن تحلیل مکانی */}
                  <button 
                    onClick={() => handleToggleGps(w.worker_id)}
                    className={`px-2 py-1 rounded text-[11px] font-bold transition-colors flex items-center gap-1 border ${
                      isGpsOpen 
                        ? (isDark ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-600 text-white border-indigo-600') 
                        : (isDark ? 'bg-gray-800 text-indigo-400 border-indigo-900 hover:bg-gray-700' : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50')
                    }`}
                  >
                    <span>📍</span> جی‌پی‌اس {isGpsOpen ? '▲' : '▼'}
                  </button>
                </div>
              </div>
            </div>

            {/* پنل تحلیل موقعیت مکانی */}
            {isGpsOpen && (
              <div className={`border-b p-4 ${isDark ? 'bg-indigo-900/20 border-gray-700' : 'bg-indigo-50/50 border-gray-200'} animate-fade-in`}>
                <h4 className={`font-bold mb-3 text-xs flex items-center gap-1 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                  📊 تحلیل جی‌پی‌اس (ساعات موظفی)
                </h4>

                {locationStatsLoading && <div className={`text-xs animate-pulse ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>در حال دریافت اطلاعات...</div>}
                {locationStatsError && <div className={`text-xs p-2 rounded ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600'}`}>{locationStatsError}</div>}

                {!locationStatsLoading && !locationStatsError && locationStats && (
                  locationStats.total_logs === 0 ? (
                    <div className={`text-xs p-3 rounded-lg border text-center ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
                      دیتای موقعیت مکانی (GPS) برای این شخص در بازه انتخابی ثبت نشده است.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* کارت‌های آماری */}
                      <div className="flex flex-col gap-2 justify-center">
                        <div className={`p-2.5 rounded-lg border shadow-sm flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>مسافت طی شده:</span>
                          <span className={`text-sm font-bold dir-ltr ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                            {locationStats.distance_kilometers} <span className="text-[9px] font-normal opacity-70">km</span>
                          </span>
                        </div>
                        <div className={`p-2.5 rounded-lg border shadow-sm flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                          <span className={`text-[11px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>تعداد نقاط:</span>
                          <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{locationStats.total_logs}</span>
                        </div>
                      </div>

                      {/* نمودار دایره‌ای */}
                      <div className="flex justify-center items-center">
                        <div 
                          className="relative w-28 h-28 rounded-full shadow-inner"
                          style={{
                            background: `conic-gradient(
                              #22c55e 0% ${locationStats.chart_data.inside_project_percent}%, 
                              #eab308 ${locationStats.chart_data.inside_project_percent}% ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}%, 
                              #ef4444 ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}% 100%
                            )`
                          }}
                        >
                          <div className={`absolute inset-2.5 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                            <div className="text-center">
                              <div className={`text-lg font-black ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{locationStats.chart_data.inside_project_percent}%</div>
                              <div className={`text-[8px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>در پروژه</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* راهنمای نمودار */}
                      <div className="flex flex-col justify-center gap-2">
                        <div className={`p-2 rounded border flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                            <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>داخل محدوده</span>
                          </div>
                          <span className="font-bold text-green-500 text-[11px] w-8 text-left">{locationStats.chart_data.inside_project_percent}%</span>
                        </div>
                        <div className={`p-2 rounded border flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                            <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>خارج محدوده</span>
                          </div>
                          <span className="font-bold text-yellow-500 text-[11px] w-8 text-left">{locationStats.chart_data.outside_project_percent}%</span>
                        </div>
                        <div className={`p-2 rounded border flex items-center justify-between ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                            <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>خاموش/خطا</span>
                          </div>
                          <span className="font-bold text-red-500 text-[11px] w-8 text-left">{locationStats.chart_data.gps_off_percent}%</span>
                        </div>
                      </div>
                    </div>
                  )
                )}
              </div>
            )}

            {/* جدول روزها */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-[11px] border-collapse">
                <thead className={`sticky top-0 z-10 shadow-sm ${isDark ? 'bg-slate-800 text-gray-200 border-gray-700' : 'bg-slate-200 text-gray-700 border-gray-300'}`}>
                  <tr>
                    <th className={`px-2 py-1.5 text-right font-semibold border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>روز و تاریخ</th>
                    {/* ستون هفته حذف شد */}
                    <th className={`px-2 py-1.5 text-center font-semibold border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>نوع روز</th>
                    <th className={`px-2 py-1.5 text-center font-semibold border-b ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>وضعیت کلی</th>
                    <th className={`px-2 py-1.5 text-center font-semibold border-b ${isDark ? 'bg-blue-900/30 border-gray-700' : 'bg-blue-50/50 border-gray-300'}`}>حضور (خروج / ورود)</th>
                    <th className={`px-2 py-1.5 text-center font-semibold border-b ${isDark ? 'bg-orange-900/30 border-gray-700' : 'bg-orange-50/50 border-gray-300'}`}>اضافه‌کاری (تا / از)</th>
                    <th className={`px-2 py-1.5 text-center font-semibold border-b ${isDark ? 'bg-orange-900/30 border-gray-700' : 'bg-orange-50/50 border-gray-300'}`}>مجموع تأییدشده اضافه کاری </th>
                    <th className={`px-2 py-1.5 text-center font-semibold border-b ${isDark ? 'bg-orange-900/30 border-gray-700' : 'bg-orange-50/50 border-gray-300'}`}>مراحل تأیید اضافه‌کاری</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((day, dayIndex) => {
                    const attLogs = day.attendance_logs || [];
                    const otLogs = day.overtime_logs || [];

                    const otMap = {};
                    (day.overtime_approvals || []).forEach((app) => {
                      otMap[app.overtime_id] = app.steps || [];
                    });

                    const rowSpan = Math.max(attLogs.length, otLogs.length, 1);
                    
                    // تنظیم پس‌زمینه ردیف‌ها با پشتیبانی از دارک‌مود
                    let rowBg = isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-sky-50';
                    if (day.is_friday) {
                      rowBg = isDark ? 'bg-orange-900/20 hover:bg-orange-900/40' : 'bg-orange-50 hover:bg-orange-100';
                    } else if (day.is_official_holiday) {
                      rowBg = isDark ? 'bg-red-900/20 hover:bg-red-900/40' : 'bg-red-50 hover:bg-red-100';
                    }

                    return Array.from({ length: rowSpan }).map((_, i) => {
                      const att = attLogs[i] || null;
                      const ot = otLogs[i] || null;

                      const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

                      return (
                        <tr key={`${dayIndex}-${i}`} className={`border-b transition-colors ${borderColor} ${rowBg}`}>
                          {i === 0 && (
                            <>
                              <td className={`px-2 py-1 text-right border-l align-middle ${borderColor}`} rowSpan={rowSpan}>
                                <div className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{day.weekday_name}</div>
                                <div className={`text-[10px] mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} dir="ltr">{day.jalali_date}</div>
                                {day.holiday_title && <div className={`text-[9px] mt-0.5 font-bold ${isDark ? 'text-red-400' : 'text-red-500'}`}>{day.holiday_title}</div>}
                              </td>
                              <td className={`px-2 py-1 text-center border-l align-middle ${borderColor}`} rowSpan={rowSpan}>
                                <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                                  day.is_official_holiday ? (isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-100 text-red-700 border-red-300') : 
                                  day.is_friday ? (isDark ? 'bg-orange-900/40 text-orange-400 border-orange-800' : 'bg-orange-100 text-orange-700 border-orange-300') : 
                                  (isDark ? 'bg-gray-700 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-700 border-gray-300')
                                }`}>{getDayType(day)}</span>
                              </td>
                              <td className={`px-2 py-1 text-center border-l align-middle ${borderColor}`} rowSpan={rowSpan}>
                                <StatusBadge status={day.status} />
                              </td>
                            </>
                          )}
                          <td className={`px-2 py-1 text-center border-l align-middle ${borderColor} ${isDark ? 'bg-blue-900/10' : 'bg-blue-50/30'}`}>
                            {att ? (
                              <div className="flex items-center justify-center gap-1 text-[11px]" dir="ltr">
                                <span className={`font-mono font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{att.time_out || '--:--'}</span>
                                <span className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>▶</span>
                                <span className={`font-mono font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{att.time_in || '--:--'}</span>
                              </div>
                            ) : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                          </td>
                          <td className={`px-2 py-1 text-center border-l align-middle ${borderColor} ${isDark ? 'bg-orange-900/10' : 'bg-orange-50/30'}`}>
                            {ot ? (
                              <div className="flex items-center justify-center gap-1 text-[11px]" dir="ltr">
                                <span className={`font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{ot.time_out || '--:--'}</span>
                                <span className={`text-[8px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>▶</span>
                                <span className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{ot.time_in || '--:--'}</span>
                              </div>
                            ) : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                          </td>
                          {i === 0 && (
                            <td className={`px-2 py-1 text-center border-l align-middle font-bold text-sm font-mono ${borderColor} ${isDark ? 'bg-orange-900/10 text-gray-200' : 'bg-orange-50/30 text-gray-800'}`} rowSpan={rowSpan}>
                              {decimalHoursToHHMM(day.overtime_hours)}
                            </td>
                          )}
                          <td className={`px-2 py-1 text-center border-l align-middle ${borderColor} ${isDark ? 'bg-orange-900/10' : 'bg-orange-50/30'}`}>
                            {ot ? <ApprovalStepsMiniTable steps={otMap[ot.id] || []} /> : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default TimesheetByWorker;