// src/components/TimesheetByDay.jsx
import React from 'react';

const TimesheetByDay = ({ meta, byDay }) => {
  if (!meta || !meta.days || meta.days.length === 0) {
    return <div className="text-sm text-gray-500 mt-4">دیتایی یافت نشد.</div>;
  }

  return (
    <div className="mt-4 overflow-x-auto">
      <table className="min-w-full text-xs md:text-sm">
        <thead>
          <tr className="bg-gray-100 text-gray-700">
            <th className="px-3 py-2 text-center font-semibold">روز ماه</th>
            <th className="px-3 py-2 text-center font-semibold">روز هفته</th>
            <th className="px-3 py-2 text-center font-semibold">نوع روز</th>
            <th className="px-3 py-2 text-right font-semibold">کارگرها</th>
          </tr>
        </thead>
        <tbody>
          {meta.days.map((d, idx) => {
            const dayData = byDay[d.day] || { workers: [] };
            const isAlt = idx % 2 === 0;

            return (
              <tr
                key={d.day}
                className={`align-top ${
                  isAlt ? 'bg-gray-50' : 'bg-white'
                } hover:bg-blue-50 transition-colors`}
              >
                {/* روز ماه */}
                <td className="px-3 py-2 text-center text-gray-800 font-semibold">
                  {d.day}
                </td>

                {/* روز هفته (شنبه تا جمعه) */}
                <td className="px-3 py-2 text-center text-gray-700 font-semibold">
                  {d.weekday_name}
                </td>

                {/* نوع روز (تعطیل رسمی / جمعه / عادی) */}
                <td className="px-3 py-2 text-center">
                  <span
                    className={
                      d.is_official_holiday
                        ? 'px-2 py-1 rounded-full bg-red-100 text-red-700 text-[11px] font-bold'
                        : d.is_friday
                        ? 'px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-[11px] font-bold'
                        : 'px-2 py-1 rounded-full bg-gray-100 text-gray-700 text-[11px] font-semibold'
                    }
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
                    <span className="text-gray-400 text-xs">
                      هیچ رکوردی برای این روز ثبت نشده است
                    </span>
                  ) : (
                    <table className="w-full text-[11px] md:text-[12px]">
                      <tbody>
                        {dayData.workers.map((w, wIdx) => (
                          <tr
                            key={w.worker_id}
                            className={`border-b last:border-0 ${
                              wIdx % 2 === 0 ? 'bg-white/40' : 'bg-gray-100/60'
                            }`}
                          >
                            <td className="px-1 py-1 text-gray-800 font-medium">
                              {w.worker_name}
                            </td>
                            <td className="px-1 py-1 text-center">
                              <span
                                className={
                                  w.status === 'PRESENT'
                                    ? 'bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full text-[10px] font-bold'
                                    : w.status === 'ABSENT'
                                    ? 'bg-red-50 text-red-700 border border-red-200 px-2 py-0.5 rounded-full text-[10px] font-bold'
                                    : w.status === 'LEAVE'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full text-[10px] font-bold'
                                    : 'bg-gray-50 text-gray-700 border border-gray-200 px-2 py-0.5 rounded-full text-[10px] font-semibold'
                                }
                              >
                                {w.status === 'PRESENT'
                                  ? 'حاضر'
                                  : w.status === 'ABSENT'
                                  ? 'غایب'
                                  : w.status === 'LEAVE'
                                  ? 'مرخصی'
                                  : w.status}
                              </span>
                            </td>
                            <td className="px-1 py-1 text-center text-gray-700 font-mono">
                              {w.time_in || '-'}{' '}
                              <span className="mx-1 text-gray-400">تا</span>{' '}
                              {w.time_out || '-'}
                            </td>
                            <td className="px-1 py-1 text-center text-gray-700 font-mono">
                              {w.hours_worked}
                              <span className="text-[10px] text-gray-500 mr-1">
                                ساعت
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
