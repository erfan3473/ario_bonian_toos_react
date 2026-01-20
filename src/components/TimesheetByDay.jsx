// src/components/TimesheetByDay.jsx
import React from 'react';

const EmptyValue = () => (
  <span className="text-gray-300 select-none">—</span>
);

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
          <tr className="text-gray-700">
            <th className="px-3 py-2 text-center font-semibold w-28">
              روز
            </th>
            <th className="px-3 py-2 text-center font-semibold w-24">
              هفته
            </th>
            <th className="px-3 py-2 text-center font-semibold w-32">
              نوع روز
            </th>
            <th className="px-3 py-2 text-right font-semibold">
              کارگرها
            </th>
          </tr>
        </thead>

        <tbody>
          {meta.days.map((d, idx) => {
            const dayKey = d.day_number || d.day;
            const dayData = byDay[dayKey] || { workers: [] };

            return (
              <tr
                key={dayKey}
                className={`align-middle border-t ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                } hover:bg-blue-50/60 transition`}
              >
                {/* تاریخ */}
                <td className="px-3 py-3 text-center align-middle">
                  <div className="font-semibold text-gray-800">
                    {dayKey}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">
                    {d.jalali_date || (
                      <>
                        {d.year}/{d.month}/{d.day}
                      </>
                    )}
                  </div>
                </td>

                {/* روز هفته */}
                <td className="px-3 py-3 text-center font-medium text-gray-700">
                  {d.weekday_name || <EmptyValue />}
                </td>

                {/* نوع روز */}
                <td className="px-3 py-3 text-center">
                  <span
                    className={`inline-flex items-center justify-center px-2 py-1 rounded-full text-[11px] font-semibold
                      ${
                        d.is_official_holiday
                          ? 'bg-red-100 text-red-700'
                          : d.is_friday
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-700'
                      }`}
                  >
                    {d.is_official_holiday
                      ? d.holiday_title || 'تعطیل رسمی'
                      : d.is_friday
                      ? 'جمعه'
                      : 'عادی'}
                  </span>
                </td>

                {/* کارگرها */}
                <td className="px-3 py-3">
                  {dayData.workers.length === 0 ? (
                    <div className="text-xs text-gray-400 italic">
                      هیچ رکوردی ثبت نشده
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {dayData.workers.map((w) => (
                        <div
                          key={w.worker_id}
                          className="grid grid-cols-[1.5fr_1fr_2fr_1fr] gap-2 items-center rounded-md bg-white/70 px-2 py-1 border border-gray-100"
                        >
                          {/* نام */}
                          <div className="font-medium text-gray-800 truncate">
                            {w.worker_name}
                          </div>

                          {/* وضعیت */}
                          <div className="text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold
                                ${
                                  w.status === 'PRESENT' || w.status === 'present'
                                    ? 'bg-green-50 text-green-700 border border-green-200'
                                    : w.status === 'ABSENT'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : w.status === 'LEAVE'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gray-50 text-gray-600 border border-gray-200'
                                }`}
                            >
                              {w.status === 'PRESENT' || w.status === 'present'
                                ? 'حاضر'
                                : w.status === 'ABSENT'
                                ? 'غایب'
                                : w.status === 'LEAVE'
                                ? 'مرخصی'
                                : w.status || 'نامشخص'}
                            </span>
                          </div>

                          {/* ساعت */}
                          <div className="text-center font-mono text-gray-700">
                            {w.time_in || <EmptyValue />}
                            <span className="mx-1 text-gray-300">–</span>
                            {w.time_out || <EmptyValue />}
                          </div>

                          {/* مجموع */}
                          <div className="text-center font-mono text-gray-700">
                            {w.hours_worked ?? <EmptyValue />}
                            <span className="text-[10px] text-gray-400 mr-1">
                              ساعت
                            </span>
                          </div>
                        </div>
                      ))}
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
