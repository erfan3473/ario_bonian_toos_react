// src/components/TimesheetByWorker.jsx
import React from 'react';

const TimesheetByWorker = ({ workers, byWorker }) => {
  if (!workers || workers.length === 0) {
    return <div className="text-sm text-gray-400">دیتایی یافت نشد.</div>;
  }

  return (
    <div className=" space-y-6 mt-4">
      {workers.map((w) => {
        const wData = byWorker[w.worker_id] || byWorker[w.workerId] || {};
        const days = wData.days || [];
        const summary = wData.summary || {};

        return (
          <div
            key={w.worker_id}
            className="bg-gray-800 rounded-md overflow-hidden border border-gray-700"
          >
            <div className=" px-4 py-2 bg-gray-700 flex justify-between text-sm">
              <div>
                <span className="flex font-semibold">{w.worker_name}</span>{' '}
                <span className="text-gray-400">({w.worker_code})</span>
              </div>
              <div className="text-xs text-gray-300">
                حضور: {summary.total_present_days || 0} روز، غیبت:{' '}
                {summary.total_absent_days || 0}، مرخصی:{' '}
                {summary.total_leave_days || 0}، ساعت کار:{' '}
                {summary.total_hours || 0}، اضافه‌کاری:{' '}
                {summary.total_overtime_hours || 0}
              </div>
            </div>

            <div className=" overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr className=" bg-gray-900">
                    <th className="px-2 py-1">روز ماه</th>
                    <th className="px-2 py-1">روز هفته</th>
                    <th className="px-2 py-1">نوع روز</th>
                    <th className="px-2 py-1">وضعیت</th>
                    <th className="px-2 py-1">ورود</th>
                    <th className="px-2 py-1">خروج</th>
                    <th className="px-2 py-1">ساعت کار</th>
                    <th className="px-2 py-1">اضافه‌کاری</th>
                  </tr>
                </thead>
                <tbody>
                  {days.map((d) => (
              
                    <tr key={d.day} className="border-t border-gray-700">
                      <td className="px-2 py-1 text-center text-gray-100">
                        {d.day}
                      </td>
                      <td className="px-2 py-1 text-center text-red-200">
                        {d.weekday_name || '-'}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {d.is_official_holiday
                         ? d.holiday_title || 'تعطیل رسمی'
                          : d.is_friday
                          ? 'جمعه'
                          : 'عادی'}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {d.status === 'PRESENT'
                          ? 'حاضر'

                          : d.status === 'ABSENT'
                          ? 'غایب'

                          :d.status ==='present'
                          ? 'حاضر'

                          : d.status === 'LEAVE'
                          ? 'مرخصی'
                          : d.status}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {d.time_in
                          ? new Date(d.time_in).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {d.time_out
                          ? new Date(d.time_out).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {d.hours_worked}
                      </td>
                      <td className="px-2 py-1 text-center">
                        {d.overtime_hours}
                      </td>
                    </tr>
                  ))}
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
