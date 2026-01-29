import React from 'react';
import { decimalHoursToHHMM } from '../utils/dateUtils';

const TimesheetSummary = ({ meta, workers, byWorker, loading }) => {
  if (loading || !meta || !workers || workers.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-xl mt-6 bg-gray-50">
        <p className="text-sm">دیتایی برای نمایش خلاصه وجود ندارد.</p>
      </div>
    );
  }

  const totalDaysInRange = meta.total_days || 0;

  return (
    <div className="mt-6">
      <div className="mb-3 flex justify-between items-end">
        <h3 className="text-lg font-bold text-gray-800">
          کارنامه کلی پرسنل
        </h3>
        <span className="text-xs font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full border border-blue-100">
           تعداد پرسنل: {workers.length}
        </span>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-xs md:text-sm whitespace-nowrap">
            <thead className="bg-gray-100 text-gray-600 border-b border-gray-200">
              <tr>
                <th className="px-3 py-3 text-right font-semibold sticky right-0 bg-gray-100 z-10">نام پرسنل</th>
                <th className="px-3 py-3 text-center font-semibold">روزهای<br/>حضور</th>
                <th className="px-3 py-3 text-center font-semibold text-blue-700">مجموع<br/>کارکرد</th>
                <th className="px-3 py-3 text-center font-semibold text-orange-600">کسر کار</th>
                <th className="px-3 py-3 text-center font-semibold text-indigo-700">شب‌کاری</th>
                <th className="px-3 py-3 text-center font-semibold text-rose-600">جمعه‌کاری</th>
                <th className="px-3 py-3 text-center font-semibold text-purple-600">اضافه کار<br/>(سیستم)</th>
                <th className="px-3 py-3 text-center font-semibold text-green-700">اضافه کار<br/>(تایید شده)</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {workers.map((worker) => {
                const wData = byWorker[worker.worker_id];
                if (!wData || !wData.summary) return null;

                const summary = wData.summary;
                const presentDays = summary.total_present_days || 0;
                const hours = summary.total_hours || 0;
                
                const deficit = summary.total_deficit_hours || 0;
                const night = summary.total_night_hours || 0;
                const friday = summary.total_friday_hours || 0;
                const calcOvertime = summary.total_calculated_overtime || 0;
                const approvedOvertime = summary.total_overtime_hours || 0;

                return (
                  <tr key={worker.worker_id} className="hover:bg-gray-50 transition">
                    {/* نام */}
                    <td className="px-3 py-3 sticky right-0 bg-white z-10 border-l border-gray-100">
                      <div className="font-bold text-gray-800 text-sm">
                        {worker.worker_name}
                      </div>
                      <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                        {worker.worker_code}
                      </div>
                    </td>

                    {/* روزهای حضور */}
                    <td className="px-3 py-3 text-center">
                      <span className="font-bold text-gray-700">{presentDays}</span>
                    </td>

                    {/* مجموع کارکرد */}
                    <td className="px-3 py-3 text-center font-mono text-blue-700 font-bold dir-ltr bg-blue-50/30">
                      {decimalHoursToHHMM(hours)}
                    </td>

                    {/* کسر کار */}
                    <td className="px-3 py-3 text-center font-mono dir-ltr">
                      {deficit > 0 ? (
                          <span className="text-orange-600 font-bold">{decimalHoursToHHMM(deficit)}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>

                    {/* شب‌کاری */}
                    <td className="px-3 py-3 text-center font-mono dir-ltr">
                      {night > 0 ? (
                          <span className="text-indigo-700 font-bold">{decimalHoursToHHMM(night)}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>

                    {/* جمعه‌کاری */}
                    <td className="px-3 py-3 text-center font-mono dir-ltr">
                      {friday > 0 ? (
                          <span className="text-rose-600 font-bold">{decimalHoursToHHMM(friday)}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>

                    {/* اضافه کار سیستمی */}
                    <td className="px-3 py-3 text-center font-mono dir-ltr">
                      {calcOvertime > 0 ? (
                          <span className="text-purple-600 font-medium">{decimalHoursToHHMM(calcOvertime)}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>

                    {/* اضافه کار تایید شده */}
                    <td className="px-3 py-3 text-center font-mono dir-ltr bg-green-50/30">
                      {approvedOvertime > 0 ? (
                          <span className="text-green-700 font-bold">{decimalHoursToHHMM(approvedOvertime)}</span>
                      ) : <span className="text-gray-300">-</span>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimesheetSummary;