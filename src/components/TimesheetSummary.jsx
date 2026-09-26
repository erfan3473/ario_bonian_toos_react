import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { decimalHoursToHHMM } from '../utils/dateUtils';
import { fetchWorkerLocationStats } from '../features/attendance/attendanceSlice';

const TimesheetSummary = ({ meta, workers, byWorker, loading }) => {
  const dispatch = useDispatch();
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

  const { filters, locationStats, locationStatsLoading, locationStatsError } = useSelector((state) => state.attendance);
  const [activeGpsWorker, setActiveGpsWorker] = useState(null);

  if (loading || !meta || !workers || workers.length === 0) {
    return (
      <div className={`text-center py-6 border border-dashed rounded-lg mt-4 text-xs ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
        <p>دیتایی برای نمایش خلاصه وجود ندارد.</p>
      </div>
    );
  }

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
    <div className="mt-4">
      <div className="mb-2 flex justify-between items-end">
        <h3 className={`text-sm font-bold ${isDark ? 'text-gray-800' : 'text-gray-800'}`}>
          کارنامه کلی پرسنل
        </h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border ${isDark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-slate-800 border-slate-300'}`}>
           تعداد پرسنل: {workers.length}
        </span>
      </div>

      <div className={`border rounded-lg shadow-sm overflow-hidden ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'}`}>
        <div className="overflow-x-auto max-h-[75vh] overflow-y-auto">
          <table className="min-w-full text-[11px] whitespace-nowrap border-collapse">
            <thead className={`sticky top-0 z-20 shadow-sm ${isDark ? 'bg-slate-800 text-gray-300 border-gray-700' : 'bg-slate-200 text-gray-700 border-gray-300'}`}>
              <tr>
                <th className={`px-2 py-2 text-right font-bold sticky right-0 z-30 border-l ${isDark ? 'bg-slate-800 border-gray-700 shadow-[1px_0_0_#374151]' : 'bg-slate-200 border-gray-300 shadow-[1px_0_0_#d1d5db]'}`}>ردیف و نام پرسنل</th>
                <th className={`px-2 py-2 text-center font-bold border-l ${isDark ? 'border-gray-700' : 'border-gray-300'}`}>حضور<br/>(روز)</th>
                <th className={`px-2 py-2 text-center font-bold border-l ${isDark ? 'text-blue-400 border-gray-700' : 'text-blue-700 border-gray-300'}`}>مجموع<br/>کارکرد</th>
                <th className={`px-2 py-2 text-center font-bold border-l ${isDark ? 'text-teal-400 border-gray-700' : 'text-teal-600 border-gray-300'}`}>میانگین<br/>ساعت حضور</th>
                <th className={`px-2 py-2 text-center font-bold border-l ${isDark ? 'text-indigo-400 border-gray-700' : 'text-indigo-700 border-gray-300'}`}>شب‌کاری</th>
                <th className={`px-2 py-2 text-center font-bold border-l ${isDark ? 'text-rose-400 border-gray-700' : 'text-rose-600 border-gray-300'}`}>جمعه‌کاری</th>
                <th className={`px-2 py-2 text-center font-bold border-l ${isDark ? 'text-purple-400 border-gray-700' : 'text-purple-600 border-gray-300'}`}>اضافه کار<br/>(سیستم)</th>
                <th className={`px-2 py-2 text-center font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>اضافه کار<br/>(تایید شده)</th>
              </tr>
            </thead>

            <tbody>
              {workers.map((worker, index) => {
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

                const rowBgColor = isGpsOpen 
                  ? (isDark ? 'bg-indigo-900/30' : 'bg-indigo-50/50') 
                  : (isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50');

                const borderColor = isDark ? 'border-gray-700' : 'border-gray-200';

                return (
                  <React.Fragment key={worker.worker_id}>
                    {/* --- ردیف اصلی اطلاعات --- */}
                    <tr className={`border-b transition-colors duration-150 ${borderColor} ${rowBgColor}`}>
                      <td className={`px-2 py-1.5 sticky right-0 z-10 border-l align-middle ${borderColor} ${rowBgColor} ${isDark ? 'shadow-[1px_0_0_#374151]' : 'shadow-[1px_0_0_#e5e7eb]'}`}>
                        <div className="flex items-center gap-1.5">
                          <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono shadow-sm shrink-0 ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                            {index + 1}
                          </span>
                          <div className="leading-tight">
                            <div className={`font-bold text-[11px] ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                              {worker.worker_name}
                            </div>
                            <div className={`text-[9px] font-mono mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {worker.worker_code}
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleGps(worker.worker_id)}
                            title="تحلیل موقعیت مکانی"
                            className={`mr-auto p-1 rounded-full border transition-colors ${
                              isGpsOpen 
                                ? (isDark ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-indigo-600 text-white border-indigo-600') 
                                : (isDark ? 'bg-gray-700 text-indigo-400 border-gray-600 hover:bg-gray-600' : 'bg-gray-50 text-indigo-500 border-gray-200 hover:bg-indigo-100')
                            }`}
                          >
                            📍
                          </button>
                        </div>
                      </td>

                      <td className={`px-2 py-1.5 text-center border-l align-middle ${borderColor}`}>
                        <span className={`font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{presentDays}</span>
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono font-bold dir-ltr border-l align-middle ${borderColor} ${isDark ? 'text-blue-400 bg-blue-900/10' : 'text-blue-700 bg-blue-50/40'}`}>
                        {decimalHoursToHHMM(hours)}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono dir-ltr border-l align-middle ${borderColor}`}>
                        {averageHours > 0 ? <span className={`font-bold ${isDark ? 'text-teal-400' : 'text-teal-600'}`}>{decimalHoursToHHMM(averageHours)}</span> : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono dir-ltr border-l align-middle ${borderColor}`}>
                        {night > 0 ? <span className={`font-bold ${isDark ? 'text-indigo-400' : 'text-indigo-700'}`}>{decimalHoursToHHMM(night)}</span> : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono dir-ltr border-l align-middle ${borderColor}`}>
                        {friday > 0 ? <span className={`font-bold ${isDark ? 'text-rose-400' : 'text-rose-600'}`}>{decimalHoursToHHMM(friday)}</span> : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono dir-ltr border-l align-middle ${borderColor}`}>
                        {calcOvertime > 0 ? <span className={`font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{decimalHoursToHHMM(calcOvertime)}</span> : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                      </td>
                      <td className={`px-2 py-1.5 text-center font-mono dir-ltr align-middle ${isDark ? 'bg-green-900/10' : 'bg-green-50/40'}`}>
                        {approvedOvertime > 0 ? <span className={`font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{decimalHoursToHHMM(approvedOvertime)}</span> : <span className={isDark ? 'text-gray-600' : 'text-gray-300'}>-</span>}
                      </td>
                    </tr>

                    {/* --- ردیف کشویی (Expandable Row) برای GPS --- */}
                    {isGpsOpen && (
                      <tr>
                        <td colSpan="8" className={`p-0 border-b-2 ${isDark ? 'border-indigo-800 bg-indigo-900/20' : 'border-indigo-200 bg-indigo-50/40'}`}>
                          <div className="p-3 animate-fade-in shadow-inner">
                            <h4 className={`font-bold mb-3 text-xs flex items-center gap-1 ${isDark ? 'text-indigo-300' : 'text-indigo-800'}`}>
                              📊 تحلیل مکانی ({worker.worker_name}) در بازه انتخابی
                            </h4>
                            
                            {locationStatsLoading && <div className={`animate-pulse text-xs ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>در حال دریافت و تحلیل نقاط مکانی...</div>}
                            {locationStatsError && <div className={`p-2 rounded text-xs ${isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-50 text-red-600'}`}>{locationStatsError}</div>}
                            
                            {!locationStatsLoading && !locationStatsError && locationStats && (
                              locationStats.total_logs === 0 ? (
                                <div className={`p-3 rounded-lg border text-center text-[11px] ${isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-white border-gray-200 text-gray-500'}`}>
                                  دیتای موقعیت مکانی (GPS) برای این شخص در این بازه ثبت نشده است.
                                </div>
                              ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  {/* بخش آماری */}
                                  <div className="flex flex-col gap-2 justify-center">
                                    <div className={`p-2 rounded-lg border flex items-center justify-between shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                      <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>مجموع مسافت طی شده:</span>
                                      <span className={`text-sm font-bold dir-ltr ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>
                                        {locationStats.distance_kilometers} <span className="text-[9px] font-normal opacity-70">km</span>
                                      </span>
                                    </div>
                                    <div className={`p-2 rounded-lg border flex items-center justify-between shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                      <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>تعداد کل نقاط ثبت شده:</span>
                                      <span className={`text-sm font-bold ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>{locationStats.total_logs}</span>
                                    </div>
                                  </div>

                                  {/* بخش چارت (Donut) */}
                                  <div className="flex justify-center items-center">
                                    <div 
                                      className="relative w-24 h-24 rounded-full shadow-inner"
                                      style={{
                                        background: `conic-gradient(
                                          #22c55e 0% ${locationStats.chart_data.inside_project_percent}%, 
                                          #eab308 ${locationStats.chart_data.inside_project_percent}% ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}%, 
                                          #ef4444 ${locationStats.chart_data.inside_project_percent + locationStats.chart_data.outside_project_percent}% 100%
                                        )`
                                      }}
                                    >
                                      <div className={`absolute inset-2.5 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                                        <div className="text-center">
                                          <div className={`text-sm font-black ${isDark ? 'text-gray-100' : 'text-gray-800'}`}>{locationStats.chart_data.inside_project_percent}%</div>
                                          <div className={`text-[8px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>در پروژه</div>
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* بخش راهنما */}
                                  <div className="flex flex-col justify-center gap-1.5">
                                    <div className={`p-1.5 rounded border flex items-center justify-between shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                        <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>داخل پروژه</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({locationStats.raw_counts.inside} نقطه)</span>
                                        <span className="font-bold text-green-500 text-[10px] w-6 text-left">{locationStats.chart_data.inside_project_percent}%</span>
                                      </div>
                                    </div>
                                    <div className={`p-1.5 rounded border flex items-center justify-between shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-yellow-400"></div>
                                        <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>خارج محدوده</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({locationStats.raw_counts.outside} نقطه)</span>
                                        <span className="font-bold text-yellow-500 text-[10px] w-6 text-left">{locationStats.chart_data.outside_project_percent}%</span>
                                      </div>
                                    </div>
                                    <div className={`p-1.5 rounded border flex items-center justify-between shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
                                      <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 rounded-full bg-red-500"></div>
                                        <span className={`text-[10px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>GPS خاموش</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[9px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>({locationStats.raw_counts.off} نقطه)</span>
                                        <span className="font-bold text-red-500 text-[10px] w-6 text-left">{locationStats.chart_data.gps_off_percent}%</span>
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