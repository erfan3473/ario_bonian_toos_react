// src/components/TimesheetByDay.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateOvertime } from '../features/attendance/attendanceSlice';
import { decimalHoursToHHMM } from '../utils/dateUtils';

const EmptyValue = () => <span className="text-gray-300 select-none">-</span>;

// تابع کمکی ترجمه
const getStatusLabel = (status) => {
  switch (status) {
    case 'PRESENT': return 'حاضر';
    case 'ABSENT': return 'غایب';
    case 'LEAVE': return 'مرخصی';
    case 'REJECTED': return 'رد شده';
    case 'PENDING': return 'در انتظار';
    default: return status || '-';
  }
};

// --- کامپوننت سلول قابل ویرایش (مشترک) ---
const EditableOvertimeCell = ({ attendanceId, value, isEditable }) => {
  const dispatch = useDispatch();
  const [localValue, setLocalValue] = useState(value || 0);
  const [isChanged, setIsChanged] = useState(false);

  // اگر غیرقابل ویرایش است (مثلاً خروج نخورده)
  if (!isEditable || !attendanceId) {
    return null; // در نمای روزانه اگر نباشد بهتر است نشان ندهیم تا شلوغ نشود
  }

  const handleBlur = () => {
    if (isChanged) {
      dispatch(updateOvertime({ attendanceId, hours: localValue }));
      setIsChanged(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur();
    }
  };

  return (
    <div className="flex flex-col items-center px-1">
      <input
        type="number"
        step="0.5"
        min="0"
        className={`w-12 text-center text-[10px] border rounded px-0.5 py-0.5 font-mono focus:outline-none focus:ring-1 focus:ring-green-500 transition-colors
          ${isChanged 
              ? 'bg-yellow-50 border-yellow-400 text-gray-900' 
              : 'bg-white border-green-200 text-green-700 font-bold'
          }
        `}
        value={localValue}
        onChange={(e) => {
          const val = parseFloat(e.target.value);
          setLocalValue(isNaN(val) ? 0 : val);
          setIsChanged(true);
        }}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
      />
      <span className="text-[8px] text-green-600 block -mt-0.5">تایید</span>
    </div>
  );
};

// --- کامپوننت اصلی ---
const TimesheetByDay = ({ meta, byDay }) => {
  if (!meta?.days?.length) {
    return (
      <div className="mt-6 text-center text-sm text-gray-400">
        📭 دیتایی برای نمایش وجود ندارد
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200">
      <table className="min-w-full text-xs md:text-sm border-collapse">
        <thead className="bg-gray-100">
          <tr className="text-gray-700 border-b border-gray-200">
            <th className="px-3 py-3 text-center font-semibold w-28">روز</th>
            <th className="px-3 py-3 text-center font-semibold w-24">هفته</th>
            <th className="px-3 py-3 text-center font-semibold w-28">تقویم</th>
            <th className="px-3 py-3 text-right font-semibold">کارکرد پرسنل</th>
          </tr>
        </thead>

        <tbody>
          {meta.days.map((d, idx) => {
            const dayKey = d.gregorian_date; 
            const dayData = byDay[dayKey] || { workers: [] };

            return (
              <tr
                key={dayKey}
                className={`align-top border-t ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50/40 transition-colors`}
              >
                {/* تاریخ */}
                <td className="px-3 py-4 text-center">
                  <div className="font-bold text-gray-800 text-base">
                    {d.day}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {d.month} / {d.year}
                  </div>
                </td>

                {/* روز هفته */}
                <td className="px-3 py-4 text-center font-medium text-gray-700">
                  {d.weekday_name || <EmptyValue />}
                </td>

                {/* نوع روز */}
                <td className="px-3 py-4 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-1 rounded-md text-[10px] font-semibold w-full max-w-[90px]
                      ${
                        d.is_official_holiday
                          ? 'bg-red-100 text-red-700'
                          : d.is_friday
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                  >
                    {d.is_official_holiday
                      ? d.holiday_title || 'تعطیل رسمی'
                      : d.is_friday
                      ? 'جمعه'
                      : 'عادی'}
                  </span>
                </td>

                {/* لیست کارگرها */}
                <td className="px-3 py-2">
                  {dayData.workers.length === 0 ? (
                    <div className="text-xs text-gray-400 italic py-2 pr-2">
                      هیچ رکوردی ثبت نشده
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2 py-1">
                      {dayData.workers.map((w) => {
                        const firstLog = w.attendance_logs?.[0];
                        const start = firstLog?.time_in;
                        const end = firstLog?.time_out;

                        // ۱. تشخیص وضعیت
                        const isIncomplete = start && !end;
                        const isNightStart = start && (start >= '19:00' || start <= '05:00');

                        // ۲. تعیین استایل کارت
                        let cardClass = 'bg-white text-gray-800 border-gray-200';
                        if (isIncomplete) {
                            cardClass = 'bg-yellow-50 text-yellow-900 border-yellow-300 ring-1 ring-yellow-200';
                        } else if (isNightStart) {
                            cardClass = 'bg-gray-800 text-white border-gray-600';
                        }

                        const statusText = isIncomplete ? 'خروج نخورده' : getStatusLabel(w.status);
                        const isDarkRow = isNightStart && !isIncomplete;
                        
                        // ID رکورد برای ویرایش
                        const attendanceId = firstLog?.id;

                        return (
                          <div
                            key={w.worker_id}
                            className={`flex flex-col lg:flex-row lg:items-center gap-2 rounded-lg p-2 shadow-sm border transition-all ${cardClass}`}
                          >
                            {/* بخش ۱: نام و وضعیت */}
                            <div className="flex items-center justify-between lg:w-1/4 min-w-[150px]">
                              <div className={`font-medium truncate pl-1 ${isDarkRow ? 'text-white' : 'text-gray-800'}`} title={w.worker_name}>
                                {w.worker_name}
                              </div>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0
                                  ${
                                    isIncomplete
                                      ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                      : w.status === 'PRESENT'
                                        ? (isDarkRow ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-200')
                                        : w.status === 'ABSENT'
                                        ? 'bg-red-50 text-red-700 border-red-100'
                                        : w.status === 'LEAVE'
                                        ? 'bg-blue-50 text-blue-700 border-blue-100'
                                        : 'bg-gray-50 text-gray-600 border-gray-200'
                                  }`}
                              >
                                {statusText}
                              </span>
                            </div>

                            {/* بخش ۲: لاگ‌های تردد */}
                            <div className="flex-1 flex flex-wrap gap-1.5 items-center">
                              {w.attendance_logs && w.attendance_logs.length > 0 ? (
                                w.attendance_logs.map((log, i) => {
                                  const isNextDay = log.time_in && log.time_out && log.time_out < log.time_in;
                                  return (
                                    <div 
                                      key={log.id || i} 
                                      className={`flex items-center text-[10px] px-1.5 py-0.5 rounded border 
                                        ${isDarkRow ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}
                                      `}
                                    >
                                      <span className={`${isDarkRow ? 'text-green-300' : 'text-green-700'} font-mono font-bold`}>
                                        {log.time_in || '--:--'}
                                      </span>
                                      <span className="mx-1 text-gray-400">←</span>
                                      <div className="flex items-center">
                                         <span className={`${isDarkRow ? 'text-red-300' : 'text-red-600'} font-mono font-bold`}>
                                           {log.time_out || '--:--'}
                                         </span>
                                         {isNextDay && (
                                           <span className="mr-1 text-[8px] text-red-400 font-bold">(+۱)</span>
                                         )}
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <span className="text-[10px] text-gray-400 select-none">بدون تردد</span>
                              )}
                            </div>

                            {/* بخش ۳: اطلاعات مالی و اینپوت */}
                            <div className={`flex items-center gap-2 text-right lg:border-r lg:pr-3 min-w-[140px] justify-end flex-wrap
                                ${isDarkRow ? 'border-gray-600' : 'border-gray-100'}`}
                            >
                               {/* شب */}
                               {w.night_hours > 0 && (
                                  <div className="text-center px-1">
                                      <div className={`font-mono font-bold text-[10px] dir-ltr ${isDarkRow ? 'text-indigo-300' : 'text-indigo-700'}`}>
                                          {decimalHoursToHHMM(w.night_hours)}
                                      </div>
                                      <span className={`text-[8px] block -mt-0.5 ${isDarkRow ? 'text-indigo-400' : 'text-indigo-400'}`}>شب</span>
                                  </div>
                               )}

                               {/* جمعه */}
                               {w.friday_hours > 0 && (
                                  <div className="text-center px-1">
                                      <div className={`font-mono font-bold text-[10px] dir-ltr ${isDarkRow ? 'text-rose-300' : 'text-rose-600'}`}>
                                          {decimalHoursToHHMM(w.friday_hours)}
                                      </div>
                                      <span className={`text-[8px] block -mt-0.5 ${isDarkRow ? 'text-rose-400' : 'text-rose-400'}`}>جمعه</span>
                                  </div>
                               )}

                               {/* کسری */}
                               {w.deficit_hours > 0 && (
                                  <div className="text-center px-1">
                                      <div className={`font-mono font-bold text-[10px] dir-ltr ${isDarkRow ? 'text-orange-300' : 'text-orange-600'}`}>
                                          {decimalHoursToHHMM(w.deficit_hours)}
                                      </div>
                                      <span className="text-[8px] text-orange-400 block -mt-0.5">کسری</span>
                                  </div>
                               )}

                               {/* کارکرد کل */}
                               <div className={`text-center pl-1 border-l ${isDarkRow ? 'border-gray-600' : 'border-gray-100'}`}>
                                 <div className={`font-mono font-bold text-sm dir-ltr ${isDarkRow ? 'text-white' : 'text-gray-800'}`}>
                                   {decimalHoursToHHMM(w.hours_worked)}
                                 </div>
                                 <span className="text-[9px] text-gray-400 block -mt-0.5">ساعت</span>
                               </div>

                               {/* ✅ اینپوت ویرایش اضافه کار (تایید شده) */}
                               <div className="pl-1">
                                  <EditableOvertimeCell 
                                    attendanceId={attendanceId}
                                    value={w.overtime_hours}
                                    isEditable={attendanceId && !isIncomplete}
                                  />
                               </div>

                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimesheetByDay;