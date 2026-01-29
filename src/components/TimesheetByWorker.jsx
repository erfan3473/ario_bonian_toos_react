// src/components/TimesheetByWorker.jsx
import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateOvertime } from '../features/attendance/attendanceSlice';
import { decimalHoursToHHMM } from '../utils/dateUtils';

// --- توابع کمکی ---

// ترجمه وضعیت‌ها به فارسی
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

// کامپوننت سلول قابل ویرایش برای ستون اضافه کار تایید شده
const EditableOvertimeCell = ({ attendanceId, value, isEditable }) => {
  const dispatch = useDispatch();
  const [localValue, setLocalValue] = useState(value || 0);
  const [isChanged, setIsChanged] = useState(false);

  // اگر رکورد ناقص است یا آیدی ندارد، فقط نمایش بده
  if (!isEditable || !attendanceId) {
    return (
        <span className={value > 0 ? "font-bold" : "opacity-50"}>
            {value > 0 ? decimalHoursToHHMM(value) : '-'}
        </span>
    );
  }

  const handleBlur = () => {
    if (isChanged) {
      // ارسال تغییرات به سرور
      dispatch(updateOvertime({ attendanceId, hours: localValue }));
      setIsChanged(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.target.blur(); // باعث اجرا شدن handleBlur می‌شود
    }
  };

  return (
    <input
      type="number"
      step="0.5"
      min="0"
      className={`w-14 text-center text-xs border rounded px-1 py-0.5 font-mono focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors
        ${isChanged 
            ? 'bg-yellow-50 border-yellow-400 text-gray-900' 
            : 'bg-white/90 border-green-200 text-green-800'
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
  );
};

// --- کامپوننت اصلی ---

const TimesheetByWorker = ({ workers, byWorker }) => {
  if (!workers || workers.length === 0) {
    return <div className="text-sm text-gray-400 mt-4 text-center">دیتایی یافت نشد.</div>;
  }

  return (
    <div className="space-y-8 mt-6">
      {workers.map((w) => {
        const wData = byWorker[w.worker_id] || {};
        const days = wData.days || [];
        const summary = wData.summary || {};

        return (
          <div
            key={w.worker_id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden mb-6"
          >
            {/* --- هدر کارت (خلاصه وضعیت کارگر) --- */}
            <div className="bg-gray-50 border-b border-gray-200 px-4 py-4 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-lg shadow-sm border border-blue-200">
                  {w.worker_name ? w.worker_name.charAt(0) : '?'}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-base">{w.worker_name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                     <span className="text-xs text-gray-500 font-mono bg-gray-200 px-1.5 py-0.5 rounded">
                       {w.worker_code}
                     </span>
                  </div>
                </div>
              </div>

              {/* بج‌های خلاصه آمار */}
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 text-xs w-full xl:w-auto">
                <div className="px-2 py-1.5 bg-white border border-gray-200 rounded flex flex-col items-center justify-center">
                  <span className="text-gray-500 mb-0.5 text-[10px]">روزهای حضور</span>
                  <span className="font-bold text-gray-800">{summary.total_present_days}</span>
                </div>
                <div className="px-2 py-1.5 bg-white border border-gray-200 rounded flex flex-col items-center justify-center">
                  <span className="text-gray-500 mb-0.5 text-[10px]">کارکرد کل</span>
                  <span className="font-bold text-blue-600 dir-ltr font-mono">
                    {decimalHoursToHHMM(summary.total_hours)}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-red-50 border border-red-100 rounded flex flex-col items-center justify-center">
                  <span className="text-red-500 mb-0.5 text-[10px]">کسر کار</span>
                  <span className="font-bold text-red-700 dir-ltr font-mono">
                    {decimalHoursToHHMM(summary.total_deficit_hours)}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-indigo-50 border border-indigo-100 rounded flex flex-col items-center justify-center">
                  <span className="text-indigo-600 mb-0.5 text-[10px]">شب‌کاری</span>
                  <span className="font-bold text-indigo-700 dir-ltr font-mono">
                    {decimalHoursToHHMM(summary.total_night_hours)}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-rose-50 border border-rose-100 rounded flex flex-col items-center justify-center">
                  <span className="text-rose-600 mb-0.5 text-[10px]">جمعه‌کاری</span>
                  <span className="font-bold text-rose-700 dir-ltr font-mono">
                    {decimalHoursToHHMM(summary.total_friday_hours)}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-purple-50 border border-purple-100 rounded flex flex-col items-center justify-center">
                  <span className="text-purple-500 mb-0.5 text-[10px]">اضافه(س)</span>
                  <span className="font-bold text-purple-700 dir-ltr font-mono">
                    {decimalHoursToHHMM(summary.total_calculated_overtime)}
                  </span>
                </div>
                <div className="px-2 py-1.5 bg-green-50 border border-green-100 rounded flex flex-col items-center justify-center">
                  <span className="text-green-600 mb-0.5 text-[10px]">اضافه(ت)</span>
                  <span className="font-bold text-green-700 dir-ltr font-mono">
                    {decimalHoursToHHMM(summary.total_overtime_hours)}
                  </span>
                </div>
              </div>
            </div>

            {/* --- جدول ریز کارکرد --- */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-right whitespace-nowrap">
                <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-center w-10">#</th>
                    <th className="px-4 py-3 font-semibold w-24">تاریخ</th>
                    <th className="px-4 py-3 font-semibold w-20">روز</th>
                    <th className="px-4 py-3 font-semibold w-24 text-center">وضعیت</th>
                    <th className="px-4 py-3 font-semibold min-w-[140px]">ترددها</th>
                    <th className="px-4 py-3 font-semibold text-center text-blue-700">کارکرد</th>
                    <th className="px-4 py-3 font-semibold text-center text-orange-600">کسرکار</th>
                    <th className="px-4 py-3 font-semibold text-center text-indigo-700">شب</th>
                    <th className="px-4 py-3 font-semibold text-center text-rose-600">جمعه</th>
                    <th className="px-4 py-3 font-semibold text-center text-purple-600">اضافه(س)</th>
                    <th className="px-4 py-3 font-semibold text-center text-green-700 w-24">اضافه(ت)</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {days.map((d) => {
                    // --- منطق تشخیص وضعیت ردیف ---
                    const firstLog = d.attendance_logs?.[0];
                    const start = firstLog?.time_in;
                    const end = firstLog?.time_out;

                    // ۱. آیا ناقص است؟ (ورود دارد، خروج ندارد)
                    const isIncomplete = start && !end;

                    // ۲. آیا شروع شیفت در شب است؟ (۱۹ تا ۵ صبح)
                    const isNightStart = start && (start >= '19:00' || start <= '05:00');

                    // ۳. تعیین کلاس CSS ردیف
                    let rowClass = 'hover:bg-gray-50'; // پیش‌فرض عادی
                    if (isIncomplete) {
                        rowClass = 'bg-yellow-50 text-yellow-900 hover:bg-yellow-100'; // ناقص (زرد)
                    } else if (isNightStart) {
                        rowClass = 'bg-gray-800 text-white hover:bg-gray-700'; // شب (تیره)
                    } else if (d.is_friday) {
                        rowClass = 'bg-orange-50/20 hover:bg-gray-50'; // جمعه (کمرنگ)
                    }

                    // متغیر کمکی برای رنگ متن‌ها در حالت شب (فقط اگر ناقص نباشد)
                    const isDarkRow = isNightStart && !isIncomplete;

                    // پیدا کردن ID اولین رکورد برای ویرایش
                    const attendanceId = firstLog?.id;

                    return (
                      <tr key={d.gregorian_date} className={`transition-colors ${rowClass}`}>
                        {/* ردیف */}
                        <td className={`px-4 py-3 text-center font-mono ${isDarkRow ? 'text-gray-400' : 'text-gray-400'}`}>
                          {d.day_number}
                        </td>

                        {/* تاریخ */}
                        <td className={`px-4 py-3 font-medium ${isDarkRow ? 'text-white' : 'text-gray-800'}`}>
                          {d.jalali_date}
                        </td>

                        {/* روز هفته */}
                        <td className="px-4 py-3">
                           <div className="flex flex-col">
                              <span className={`${d.is_friday && !isDarkRow ? 'text-red-600 font-bold' : isDarkRow ? 'text-gray-300' : 'text-gray-600'}`}>
                                  {d.weekday_name}
                              </span>
                              {d.is_official_holiday && <span className="text-[9px] text-red-500">{d.holiday_title}</span>}
                           </div>
                        </td>

                        {/* وضعیت (ترجمه شده) */}
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-[10px] font-bold border block w-full
                             ${
                               isIncomplete 
                                 ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                 : d.status === 'PRESENT'
                                   ? (isDarkRow ? 'bg-green-900 text-green-300 border-green-700' : 'bg-green-50 text-green-700 border-green-100')
                                   : d.status === 'ABSENT'
                                   ? 'bg-red-50 text-red-700 border-red-100'
                                   : d.status === 'LEAVE'
                                   ? 'bg-blue-50 text-blue-700 border-blue-100'
                                   : 'bg-gray-50 text-gray-600 border-gray-200'
                             }`}>
                            {isIncomplete ? 'خروج نخورده' : getStatusLabel(d.status)}
                          </span>
                        </td>

                        {/* ترددها */}
                        <td className="px-4 py-3">
                          {d.attendance_logs && d.attendance_logs.length > 0 ? (
                              <div className="flex flex-col gap-1.5">
                                  {d.attendance_logs.map((log, idx) => {
                                      const isNextDay = log.time_in && log.time_out && log.time_out < log.time_in;
                                      return (
                                        <div key={log.id || idx} className="flex items-center gap-2 text-[11px]">
                                            <div className={`px-1.5 py-0.5 rounded border font-mono min-w-[40px] text-center
                                                ${isDarkRow ? 'bg-gray-700 border-gray-600 text-green-300' : 'bg-white border-gray-200 text-green-700'}`}>
                                                {log.time_in || '-'}
                                            </div>
                                            <span className="text-gray-400">←</span>
                                            <div className={`px-1.5 py-0.5 rounded border font-mono min-w-[40px] text-center relative
                                                ${isDarkRow ? 'bg-gray-700 border-gray-600 text-red-300' : 'bg-white border-gray-200 text-red-700'}`}>
                                                {log.time_out || '-'}
                                                {isNextDay && (
                                                    <span className={`absolute -top-1.5 -left-2 text-[8px] px-1 rounded-full shadow-sm
                                                        ${isDarkRow ? 'bg-red-900 text-white' : 'bg-red-100 text-red-600'}`}>
                                                        +1
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                      );
                                  })}
                              </div>
                          ) : (
                              <span className="text-gray-300 text-[10px] block py-1">—</span>
                          )}
                        </td>

                        {/* کارکرد */}
                        <td className={`px-4 py-3 text-center font-mono font-bold dir-ltr
                            ${isDarkRow ? 'text-blue-300' : 'text-blue-700 bg-blue-50/20'}`}>
                          {d.hours_worked > 0 ? decimalHoursToHHMM(d.hours_worked) : '-'}
                        </td>

                        {/* کسر کار */}
                        <td className={`px-4 py-3 text-center font-mono dir-ltr
                            ${isDarkRow ? 'text-orange-300' : 'text-orange-600'}`}>
                          {d.deficit_hours > 0 ? decimalHoursToHHMM(d.deficit_hours) : '-'}
                        </td>

                        {/* شب کاری */}
                        <td className={`px-4 py-3 text-center font-mono dir-ltr
                            ${isDarkRow ? 'text-indigo-300' : 'text-indigo-700'}`}>
                          {d.night_hours > 0 ? decimalHoursToHHMM(d.night_hours) : '-'}
                        </td>

                        {/* جمعه کاری */}
                        <td className={`px-4 py-3 text-center font-mono dir-ltr
                            ${isDarkRow ? 'text-rose-300' : 'text-rose-600'}`}>
                          {d.friday_hours > 0 ? decimalHoursToHHMM(d.friday_hours) : '-'}
                        </td>

                        {/* اضافه کار سیستم */}
                        <td className={`px-4 py-3 text-center font-mono dir-ltr
                            ${isDarkRow ? 'text-purple-300' : 'text-purple-600'}`}>
                          {d.calculated_overtime > 0 ? decimalHoursToHHMM(d.calculated_overtime) : '-'}
                        </td>

                        {/* ✅ ستون ویرایش اضافه کار */}
                        <td className={`px-2 py-2 text-center dir-ltr ${isDarkRow ? 'text-white' : ''}`}>
                           <EditableOvertimeCell 
                              attendanceId={attendanceId}
                              value={d.overtime_hours}
                              isEditable={attendanceId && !isIncomplete} // اگر رکورد ناقصه نمیشه ویرایش کرد
                           />
                        </td>
                      </tr>
                    );
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