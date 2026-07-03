// src/components/TimesheetByWorker
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
   وضعیت‌ها و برچسب‌های رنگی
   ========================================== */
const STATUS_MAP = {
  PRESENT:  { label: 'حاضر',      color: 'text-green-700 bg-green-50 border-green-200' },
  ABSENT:   { label: 'غایب',      color: 'text-red-700 bg-red-50 border-red-200' },
  LEAVE:    { label: 'مرخصی',     color: 'text-blue-700 bg-blue-50 border-blue-200' },
  APPROVED: { label: 'تایید شده', color: 'text-green-700 bg-green-100 border-green-300' },
  PENDING:  { label: 'در انتظار', color: 'text-yellow-700 bg-yellow-100 border-yellow-300' },
  REJECTED: { label: 'رد شده',    color: 'text-red-700 bg-red-200 border-red-400' },
  RETURNED: { label: 'برگشتی',    color: 'text-purple-700 bg-purple-100 border-purple-300' },
  SKIPPED:  { label: 'رد مرحله',  color: 'text-gray-500 bg-gray-100 border-gray-300' },
  NO_CONTRACT: { label: 'بدون قرارداد',       color: 'text-slate-600 bg-slate-100 border-slate-300' }, // <--- این خط اضافه شد
};

const getStatusInfo = (status) =>
  STATUS_MAP[status] || { label: status || 'نامشخص', color: 'text-gray-600 bg-gray-100 border-gray-300' };

const StatusBadge = ({ status }) => {
  const { label, color } = getStatusInfo(status);
  return <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>{label}</span>;
};

/* ==========================================
   کامپوننت جدول مراحل تأیید مینیاتوری
   ========================================== */
const ApprovalStepsMiniTable = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <table className="min-w-[200px] text-xs border border-gray-300 rounded overflow-hidden">
      <thead>
        <tr className="bg-gray-100">
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">مرحله</th>
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">وضعیت</th>
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">تأییدکننده</th>
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">سمت</th>
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">یادداشت</th>
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">قبل (دقیقه)</th>
          <th className="px-2 py-1 text-center font-medium text-gray-700 border-b border-gray-300">بعد (دقیقه)</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step, idx) => (
          <tr key={idx} className="border-t border-gray-200 even:bg-gray-50">
            <td className="px-2 py-1 text-center text-gray-700 font-mono">{step.step_order ?? '-'}</td>
            <td className="px-2 py-1 text-center"><StatusBadge status={step.status} /></td>
            <td className="px-2 py-1 text-center text-gray-700 whitespace-nowrap">{step.approver_name || '---'}</td>
            <td className="px-2 py-1 text-center text-gray-700 whitespace-nowrap">{step.approver_position || '---'}</td>
            <td className="px-2 py-1 text-center text-gray-700 max-w-[100px] truncate" title={step.note}>{step.note || '---'}</td>
            <td className="px-2 py-1 text-center text-gray-700 font-mono">{formatMinutes(step.approved_minutes_before)}</td>
            <td className="px-2 py-1 text-center text-gray-700 font-mono">{formatMinutes(step.approved_minutes_after)}</td>
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
  
  // استخراج مقادیر مربوط به GPS از Redux
  const { filters, locationStats, locationStatsLoading, locationStatsError } = useSelector((state) => state.attendance);

  // نگهداری آیدی کارگری که پنل GPS او باز شده است
  const [activeGpsWorker, setActiveGpsWorker] = useState(null);

  if (!workers || workers.length === 0) {
    return <div className="p-4 text-center text-gray-500">داده‌ای برای نمایش وجود ندارد.</div>;
  }

  const getDayType = (day) => {
    if (day.is_official_holiday) return 'تعطیل رسمی';
    if (day.is_friday) return 'جمعه';
    return 'عادی';
  };

  const handleToggleGps = (workerId) => {
    if (activeGpsWorker === workerId) {
      // اگر قبلاً باز بوده، ببند
      setActiveGpsWorker(null);
    } else {
      // باز کن و دیتای سرور را بگیر
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
    <div className="space-y-8">
      {workers.map((w) => {
        const wData = byWorker[w.worker_id];
        if (!wData) return null;

        const days = wData.days || [];
        const summary = wData.summary || {};
        const isGpsOpen = activeGpsWorker === w.worker_id;

        return (
          <div key={w.worker_id} className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white mb-8">
            {/* هدر کارگر */}
            <div className="bg-gray-100 p-4 border-b border-gray-200">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-xl">
                    {(w.worker_name || '?')[0]}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{w.worker_name}</h3>
                    <div className="text-gray-600 text-sm mt-1">کد: <span className="font-mono">{w.worker_code}</span></div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-sm text-gray-600 bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <span className="font-semibold">روزهای حضور:</span> {summary.total_present_days ?? 0} روز
                  </div>
                  
                  {/* دکمه باز کردن تحلیل مکانی */}
                  <button 
                    onClick={() => handleToggleGps(w.worker_id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 border ${
                      isGpsOpen 
                        ? 'bg-indigo-600 text-white border-indigo-600' 
                        : 'bg-white text-indigo-600 border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span>📍</span> تحلیل موقعیت مکانی {isGpsOpen ? '▲' : '▼'}
                  </button>
                </div>
              </div>
            </div>

            {/* پنل تحلیل موقعیت مکانی (مخفی تا زمانی که کلیک شود) */}
            {isGpsOpen && (
              <div className="bg-indigo-50/50 border-b border-gray-200 p-6 animate-fade-in">
                <h4 className="text-indigo-800 font-bold mb-4 flex items-center gap-2">
                  📊 تحلیل جی‌پی‌اس و حضور فیزیکی (فقط ساعات موظفی)
                </h4>
                
                {locationStatsLoading && <div className="text-indigo-600 animate-pulse">در حال دریافت و تحلیل نقاط مکانی...</div>}
                
                {locationStatsError && <div className="text-red-600 bg-red-50 p-3 rounded">{locationStatsError}</div>}
                
                {!locationStatsLoading && !locationStatsError && locationStats && (
                  locationStats.total_logs === 0 ? (
                    <div className="text-gray-500 bg-white p-4 rounded-lg border border-gray-200 text-center">
                      دیتای موقعیت مکانی (GPS) برای این شخص در بازه انتخابی ثبت نشده است.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      
                      {/* بخش 1: کارت‌های آماری */}
                      <div className="flex flex-col gap-3 justify-center">
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                          <span className="text-gray-600 text-sm font-semibold">مجموع مسافت طی شده:</span>
                          <span className="text-xl font-bold text-indigo-600 dir-ltr">
                            {locationStats.distance_kilometers} <span className="text-sm font-normal text-gray-500">km</span>
                          </span>
                        </div>
                        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                          <span className="text-gray-600 text-sm font-semibold">تعداد کل نقاط ثبت شده:</span>
                          <span className="text-xl font-bold text-gray-700">{locationStats.total_logs}</span>
                        </div>
                      </div>

                      {/* بخش 2: نمودار دایره‌ای (Donut Chart با CSS خالص) */}
                      <div className="flex justify-center items-center">
                        <div 
                          className="relative w-40 h-40 rounded-full shadow-inner"
                          style={{
                            background: `conic-gradient(
                              #22c55e 0% ${locationStats.chart_data.inside_project_percent}%, 
                              #eab308 ${locationStats.chart_data.inside_project_percent}% ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}%, 
                              #ef4444 ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}% 100%
                            )`
                          }}
                        >
                          {/* دایره توخالی وسط (ایجاد حالت Donut) */}
                          <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                            <div className="text-center">
                              <div className="text-2xl font-black text-gray-800">{locationStats.chart_data.inside_project_percent}%</div>
                              <div className="text-[10px] text-gray-500">حضور در پروژه</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* بخش 3: راهنمای نمودار (Legend) */}
                      <div className="flex flex-col justify-center gap-3">
                        {/* داخل پروژه */}
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span className="text-sm text-gray-700">داخل محدوده پروژه</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">({locationStats.raw_counts.inside} نقطه)</span>
                            <span className="font-bold text-green-600 w-10 text-left">{locationStats.chart_data.inside_project_percent}%</span>
                          </div>
                        </div>

                        {/* خارج پروژه */}
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                            <span className="text-sm text-gray-700">خارج از محدوده</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">({locationStats.raw_counts.outside} نقطه)</span>
                            <span className="font-bold text-yellow-600 w-10 text-left">{locationStats.chart_data.outside_project_percent}%</span>
                          </div>
                        </div>

                        {/* خاموش / بدون دسترسی */}
                        <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full bg-red-500"></div>
                            <span className="text-sm text-gray-700">GPS خاموش/خطا</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-400">({locationStats.raw_counts.off} نقطه)</span>
                            <span className="font-bold text-red-600 w-10 text-left">{locationStats.chart_data.gps_off_percent}%</span>
                          </div>
                        </div>
                      </div>

                    </div>
                  )
                )}
              </div>
            )}

            {/* جدول روزها */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100 text-gray-700 border-b border-gray-200">
                    <th className="p-3 text-right font-semibold">روز و تاریخ</th>
                    <th className="p-3 text-center font-semibold">هفته</th>
                    <th className="p-3 text-center font-semibold">نوع روز</th>
                    <th className="p-3 text-center font-semibold">وضعیت کلی</th>
                    <th className="p-3 text-center font-semibold bg-blue-50/50">حضور (ورود / خروج)</th>
                    <th className="p-3 text-center font-semibold bg-orange-50/50">اضافه‌کاری (از / تا)</th>
                    <th className="p-3 text-center font-semibold bg-orange-50/50">مجموع تأییدشده</th>
                    <th className="p-3 text-center font-semibold bg-orange-50/50">مراحل تأیید اضافه‌کاری</th>
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
                    let rowBg = 'bg-white hover:bg-gray-50';
                    if (day.is_friday) rowBg = 'bg-red-50 hover:bg-red-100';
                    else if (day.is_official_holiday) rowBg = 'bg-orange-50 hover:bg-orange-100';

                    return Array.from({ length: rowSpan }).map((_, i) => {
                      const att = attLogs[i] || null;
                      const ot = otLogs[i] || null;

                      return (
                        <tr key={`${dayIndex}-${i}`} className={`border-b border-gray-200 transition-colors ${rowBg}`}>
                          {i === 0 && (
                            <>
                              <td className="p-3 text-right border-l border-gray-200 align-top" rowSpan={rowSpan}>
                                <div className="font-medium text-gray-800">{day.weekday_name}</div>
                                <div className="text-gray-500 text-xs mt-1" dir="ltr">{day.jalali_date}</div>
                                {day.holiday_title && <div className="text-red-500 text-xs mt-1 font-semibold">{day.holiday_title}</div>}
                              </td>
                              <td className="p-3 text-center border-l border-gray-200 align-top" rowSpan={rowSpan}>{Math.ceil(day.day_number / 7) || '-'}</td>
                              <td className="p-3 text-center border-l border-gray-200 align-top" rowSpan={rowSpan}>
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${day.is_official_holiday ? 'bg-red-100 text-red-700 border-red-300' : day.is_friday ? 'bg-orange-100 text-orange-700 border-orange-300' : 'bg-gray-100 text-gray-700 border-gray-300'}`}>{getDayType(day)}</span>
                              </td>
                              <td className="p-3 text-center border-l border-gray-200 align-top" rowSpan={rowSpan}><StatusBadge status={day.status} /></td>
                            </>
                          )}
                          <td className="p-3 border-l border-gray-200 bg-blue-50/20 align-top">
                            {att ? (
                              <div className="flex items-center gap-1 text-xs" dir="ltr">
                                <span className="font-mono font-bold text-green-700">{att.time_in || '--:--'}</span>
                                <span className="text-gray-400">←</span>
                                <span className="font-mono font-bold text-red-600">{att.time_out || '--:--'}</span>
                              </div>
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                          <td className="p-3 border-l border-gray-200 bg-orange-50/20 align-top">
                            {ot ? (
                              <div className="flex items-center gap-1 text-xs" dir="ltr">
                                <span className="font-mono font-bold text-blue-600">{ot.time_in || '--:--'}</span>
                                <span className="text-gray-400">←</span>
                                <span className="font-mono font-bold text-purple-600">{ot.time_out || '--:--'}</span>
                              </div>
                            ) : <span className="text-gray-300">-</span>}
                          </td>
                          {i === 0 && (
                            <td className="p-3 text-center border-l border-gray-200 bg-orange-50/20 font-bold text-gray-800" rowSpan={rowSpan}>
                              {decimalHoursToHHMM(day.overtime_hours)}
                            </td>
                          )}
                          <td className="p-3 border-l border-gray-200 bg-orange-50/20 align-top">
                            {ot ? <ApprovalStepsMiniTable steps={otMap[ot.id] || []} /> : <span className="text-gray-300">-</span>}
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
