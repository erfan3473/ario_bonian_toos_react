import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { decimalHoursToHHMM } from '../utils/dateUtils';
import { fetchWorkerLocationStats } from '../features/attendance/attendanceSlice'; // ایمپورت اکشن GPS

const TimesheetSummary = ({ meta, workers, byWorker, loading }) => {
  const dispatch = useDispatch();

  // استیت‌های مربوط به تحلیل مکانی
  const { filters, locationStats, locationStatsLoading, locationStatsError } = useSelector((state) => state.attendance);
  const [activeGpsWorker, setActiveGpsWorker] = useState(null);

  if (loading || !meta || !workers || workers.length === 0) {
    return (
      <div className="text-center text-gray-400 py-10 border-2 border-dashed border-gray-200 rounded-xl mt-6 bg-gray-50">
        <p className="text-sm">دیتایی برای نمایش خلاصه وجود ندارد.</p>
      </div>
    );
  }

  // تابع باز و بسته کردن پنل GPS برای هر شخص
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
                <th className="px-3 py-3 text-right font-semibold sticky right-0 bg-gray-100 z-10 shadow-[1px_0_0_#e5e7eb]">نام پرسنل</th>
                <th className="px-3 py-3 text-center font-semibold">روزهای<br/>حضور</th>
                <th className="px-3 py-3 text-center font-semibold text-blue-700">مجموع<br/>کارکرد</th>
                <th className="px-3 py-3 text-center font-semibold text-teal-600">میانگین<br/>ساعت حضور</th>
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
                const averageHours = presentDays > 0 ? (hours / presentDays) : 0;
                const night = summary.total_night_hours || 0;
                const friday = summary.total_friday_hours || 0;
                const calcOvertime = summary.total_calculated_overtime || 0;
                const approvedOvertime = summary.total_overtime_hours || 0;

                const isGpsOpen = activeGpsWorker === worker.worker_id;

                return (
                  <React.Fragment key={worker.worker_id}>
                    {/* --- ردیف اصلی اطلاعات --- */}
                    <tr className={`transition ${isGpsOpen ? 'bg-indigo-50/30' : 'hover:bg-gray-50'}`}>
                      <td className={`px-3 py-3 sticky right-0 z-10 border-l border-gray-100 shadow-[1px_0_0_#e5e7eb] ${isGpsOpen ? 'bg-indigo-50/80' : 'bg-white'}`}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-bold text-gray-800 text-sm">
                              {worker.worker_name}
                            </div>
                            <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                              {worker.worker_code}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleGps(worker.worker_id)}
                            title="تحلیل موقعیت مکانی"
                            className={`mr-auto p-1.5 rounded-full border transition-colors ${isGpsOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-gray-50 text-indigo-500 border-gray-200 hover:bg-indigo-100'}`}
                          >
                            📍
                          </button>
                        </div>
                      </td>

                      <td className="px-3 py-3 text-center"><span className="font-bold text-gray-700">{presentDays}</span></td>
                      <td className="px-3 py-3 text-center font-mono text-blue-700 font-bold dir-ltr bg-blue-50/30">{decimalHoursToHHMM(hours)}</td>
                      <td className="px-3 py-3 text-center font-mono dir-ltr">{averageHours > 0 ? <span className="text-teal-600 font-bold">{decimalHoursToHHMM(averageHours)}</span> : <span className="text-gray-300">-</span>}</td>
                      <td className="px-3 py-3 text-center font-mono dir-ltr">{night > 0 ? <span className="text-indigo-700 font-bold">{decimalHoursToHHMM(night)}</span> : <span className="text-gray-300">-</span>}</td>
                      <td className="px-3 py-3 text-center font-mono dir-ltr">{friday > 0 ? <span className="text-rose-600 font-bold">{decimalHoursToHHMM(friday)}</span> : <span className="text-gray-300">-</span>}</td>
                      <td className="px-3 py-3 text-center font-mono dir-ltr">{calcOvertime > 0 ? <span className="text-purple-600 font-medium">{decimalHoursToHHMM(calcOvertime)}</span> : <span className="text-gray-300">-</span>}</td>
                      <td className="px-3 py-3 text-center font-mono dir-ltr bg-green-50/30">{approvedOvertime > 0 ? <span className="text-green-700 font-bold">{decimalHoursToHHMM(approvedOvertime)}</span> : <span className="text-gray-300">-</span>}</td>
                    </tr>

                    {/* --- ردیف کشویی (Expandable Row) برای GPS --- */}
                    {isGpsOpen && (
                      <tr>
                        <td colSpan="8" className="p-0 border-b-2 border-indigo-200 bg-indigo-50/40">
                          <div className="p-4 md:p-6 animate-fade-in shadow-inner">
                            <h4 className="text-indigo-800 font-bold mb-4 text-sm md:text-base flex items-center gap-2">
                              📊 تحلیل مکانی ({worker.worker_name}) در بازه انتخابی
                            </h4>
                            
                            {locationStatsLoading && <div className="text-indigo-600 animate-pulse text-sm">در حال دریافت و تحلیل نقاط مکانی...</div>}
                            {locationStatsError && <div className="text-red-600 bg-red-50 p-3 rounded text-sm">{locationStatsError}</div>}
                            
                            {!locationStatsLoading && !locationStatsError && locationStats && (
                              locationStats.total_logs === 0 ? (
                                <div className="text-gray-500 bg-white p-4 rounded-lg border border-gray-200 text-center text-sm">
                                  دیتای موقعیت مکانی (GPS) برای این شخص در این بازه ثبت نشده است.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  {/* بخش آماری */}
                                  <div className="flex flex-col gap-3 justify-center">
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                                      <span className="text-gray-600 text-xs md:text-sm font-semibold">مجموع مسافت طی شده:</span>
                                      <span className="text-lg font-bold text-indigo-600 dir-ltr">
                                        {locationStats.distance_kilometers} <span className="text-xs font-normal text-gray-500">km</span>
                                      </span>
                                    </div>
                                    <div className="bg-white p-3 rounded-xl border border-gray-200 flex items-center justify-between shadow-sm">
                                      <span className="text-gray-600 text-xs md:text-sm font-semibold">تعداد کل نقاط ثبت شده:</span>
                                      <span className="text-lg font-bold text-gray-700">{locationStats.total_logs}</span>
                                    </div>
                                  </div>

                                  {/* بخش چارت (Donut) */}
                                  <div className="flex justify-center items-center">
                                    <div 
                                      className="relative w-32 h-32 md:w-40 md:h-40 rounded-full shadow-inner"
                                      style={{
                                        background: `conic-gradient(
                                          #22c55e 0% ${locationStats.chart_data.inside_project_percent}%, 
                                          #eab308 ${locationStats.chart_data.inside_project_percent}% ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}%, 
                                          #ef4444 ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}% 100%
                                        )`
                                      }}
                                    >
                                      <div className="absolute inset-3 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <div className="text-center">
                                          <div className="text-xl md:text-2xl font-black text-gray-800">{locationStats.chart_data.inside_project_percent}%</div>
                                          <div className="text-[9px] md:text-[10px] text-gray-500">حضور در پروژه</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* بخش راهنما */}
                                  <div className="flex flex-col justify-center gap-2">
                                    <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-green-500"></div>
                                        <span className="text-xs text-gray-700">داخل پروژه</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">({locationStats.raw_counts.inside} نقطه)</span>
                                        <span className="font-bold text-green-600 text-xs w-8 text-left">{locationStats.chart_data.inside_project_percent}%</span>
                                      </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-400"></div>
                                        <span className="text-xs text-gray-700">خارج محدوده</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">({locationStats.raw_counts.outside} نقطه)</span>
                                        <span className="font-bold text-yellow-600 text-xs w-8 text-left">{locationStats.chart_data.outside_project_percent}%</span>
                                      </div>
                                    </div>
                                    <div className="bg-white p-2 rounded-lg border border-gray-100 flex items-center justify-between shadow-sm">
                                      <div className="flex items-center gap-2">
                                        <div className="w-2.5 h-2.5 rounded-full bg-red-500"></div>
                                        <span className="text-xs text-gray-700">GPS خاموش</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[10px] text-gray-400">({locationStats.raw_counts.off} نقطه)</span>
                                        <span className="font-bold text-red-600 text-xs w-8 text-left">{locationStats.chart_data.gps_off_percent}%</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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
