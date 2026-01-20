// src/components/TimesheetSummary.jsx
import React from 'react';

const decimalHoursToHHMM = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '00:00';
  const hours = Math.floor(value);
  const minutes = Math.round((value - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const TimesheetSummary = ({ meta, workers, byWorker, loading }) => {
  if (loading || !meta || !workers || workers.length === 0) {
    return (
      <div className="text-center text-gray-400 py-14 border border-gray-700 rounded-xl bg-gray-900 mt-6">
        <div className="text-4xl mb-3">📊</div>
        <p className="text-sm">
          در حال بارگذاری اطلاعات خلاصه...
        </p>
      </div>
    );
  }

  const totalDaysInRange = meta.total_days || 0;

  return (
    <div className="mt-4">
      {/* هدر */}
      <div className="mb-3 flex justify-between items-center">
        <h3 className="text-sm font-semibold text-gray-600">
          خلاصه عملکرد کارگرها ({workers.length} نفر)
        </h3>
        <div className="text-xs text-gray-400">
          بازه: {totalDaysInRange} روز
        </div>
      </div>

      {/* جدول */}
      <div className="bg-gray-900 border border-gray-700 rounded-lg overflow-hidden">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-800 text-gray-300 border-b border-gray-700">
              <th className="px-3 py-2 text-right">کارگر</th>
              <th className="px-3 py-2 text-center">حضور</th>
              <th className="px-3 py-2 text-center">ساعت کار</th>
              <th className="px-3 py-2 text-center">اضافه‌کاری</th>
              <th className="px-3 py-2 text-center">میانگین روزانه</th>
            </tr>
          </thead>

          <tbody>
            {workers.map((worker, index) => {
              const wData = byWorker[worker.worker_id];
              if (!wData || !wData.summary) return null;

              const summary = wData.summary;
              const presentDays = summary.total_present_days || 0;
              const hours = summary.total_hours || 0;
              const overtime = summary.total_overtime_hours || 0;
              const dailyAvg = presentDays > 0 ? hours / presentDays : 0;

              return (
                <tr
                  key={worker.worker_id}
                  className={`border-b border-gray-800 ${
                    index % 2 === 0 ? 'bg-gray-900' : 'bg-gray-850'
                  }`}
                >
                  {/* کارگر */}
                  <td className="px-3 py-2">
                    <div className="font-medium text-gray-100">
                      {worker.worker_name}
                    </div>
                    <div className="text-[11px] text-gray-400">
                      {worker.worker_code}
                    </div>
                  </td>

                  {/* حضور */}
                  <td className="px-3 py-2 text-center">
                    <div className="text-gray-100 font-semibold">
                      {presentDays}
                      <span className="text-[10px] text-gray-400 mr-1">
                        روز
                      </span>
                    </div>
                    <div className="text-[10px] text-gray-500">
                      از {totalDaysInRange} روز
                    </div>
                  </td>

                  {/* ساعت کار */}
                  <td className="px-3 py-2 text-center font-mono text-cyan-400">
                    {decimalHoursToHHMM(hours)}
                  </td>

                  {/* اضافه کاری */}
                  <td className="px-3 py-2 text-center font-mono">
                    <span
                      className={
                        overtime > 0
                          ? 'text-purple-400 font-semibold'
                          : 'text-gray-500'
                      }
                    >
                      {decimalHoursToHHMM(overtime)}
                    </span>
                  </td>

                  {/* میانگین */}
                  <td className="px-3 py-2 text-center">
                    <div className="font-mono text-gray-100">
                      {decimalHoursToHHMM(dailyAvg)}
                    </div>
                    <div className="text-[10px] text-gray-500">
                      ساعت / روز
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TimesheetSummary;
