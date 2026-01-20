import React from 'react';

const decimalHoursToHHMM = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '-';
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const statusBadge = (status) => {
  switch (status) {
    case 'PRESENT':
    case 'present':
      return 'bg-green-100 text-green-700';
    case 'ABSENT':
      return 'bg-red-100 text-red-700';
    case 'LEAVE':
      return 'bg-yellow-100 text-yellow-800';
    default:
      return 'bg-gray-100 text-gray-600';
  }
};

const TimesheetByWorker = ({ workers, byWorker }) => {
  if (!workers || workers.length === 0) {
    return <div className="text-sm text-gray-400">دیتایی یافت نشد.</div>;
  }

  return (
    <div className="space-y-6 mt-4">
      {workers.map((w) => {
        const wData = byWorker[w.worker_id] || {};
        const days = wData.days || [];
        const summary = wData.summary || {};

        return (
          <div
            key={w.worker_id}
            className="bg-white rounded-xl border border-gray-200 shadow-sm"
          >
            {/* Header */}
            <div className="px-5 py-3 flex flex-col md:flex-row md:justify-between gap-2 bg-gray-50 border-b">
              <div>
                <div className="font-semibold text-gray-800">
                  {w.worker_name}
                  <span className="text-gray-400 text-sm mr-2">
                    ({w.worker_code})
                  </span>
                </div>
              </div>

              <div className="text-xs text-gray-600 flex flex-wrap gap-3">
                <span>حضور: {summary.total_present_days || 0}</span>
                <span>غیبت: {summary.total_absent_days || 0}</span>
                <span>
                  ساعت کار: {decimalHoursToHHMM(summary.total_hours)}
                </span>
                <span>
                  اضافه‌کاری: {decimalHoursToHHMM(summary.total_overtime_hours)}
                </span>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs text-gray-700">
                <thead>
                  <tr className="bg-gray-100 text-gray-600">
                    <th className="px-3 py-2">روز</th>
                    <th className="px-3 py-2">هفته</th>
                    <th className="px-3 py-2">نوع</th>
                    <th className="px-3 py-2">وضعیت</th>
                    <th className="px-3 py-2">ورود</th>
                    <th className="px-3 py-2">خروج</th>
                    <th className="px-3 py-2">ساعت کار</th>
                    <th className="px-3 py-2">اضافه‌کاری</th>
                  </tr>
                </thead>

                <tbody>
                  {days.map((d, idx) => (
                    <tr
                      key={d.day_number || d.day}  // تغییر: استفاده از day_number
                      className={`border-t ${
                        idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                      }`}
                    >
                      {/* ستون اول: شماره روز در بازه + تاریخ شمسی */}
                      <td className="px-3 py-2 text-center">
                        <div className="font-semibold">{d.day_number || d.day}</div> {/* تغییر: day_number */}
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          {d.jalali_date || `${d.year}/${d.month}/${d.day}`} {/* تغییر: نمایش تاریخ کامل */}
                        </div>
                      </td>
                      
                      <td className="px-3 py-2 text-center font-medium">
                        {d.weekday_name || '-'}
                      </td>
                      
                      <td className="px-3 py-2 text-center">
                        {d.is_official_holiday
                          ? d.holiday_title || 'تعطیل رسمی'
                          : d.is_friday
                          ? 'جمعه'
                          : 'عادی'}
                      </td>
                      
                      {/* بقیه ستون‌ها بدون تغییر می‌مانند */}
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${statusBadge(
                            d.status
                          )}`}
                        >
                          {d.status === 'PRESENT' || d.status === 'present'
                            ? 'حاضر'
                            : d.status === 'ABSENT'
                            ? 'غایب'
                            : d.status === 'LEAVE'
                            ? 'مرخصی'
                            : d.status}
                        </span>
                      </td>
                      
                      <td className="px-3 py-2 text-center">
                        {d.time_in
                          ? new Date(d.time_in).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      
                      <td className="px-3 py-2 text-center">
                        {d.time_out
                          ? new Date(d.time_out).toLocaleTimeString('fa-IR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : '-'}
                      </td>
                      
                      <td className="px-3 py-2 text-center">
                        {decimalHoursToHHMM(d.hours_worked)}
                      </td>
                      
                      <td className="px-3 py-2 text-center">
                        {decimalHoursToHHMM(d.overtime_hours)}
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
