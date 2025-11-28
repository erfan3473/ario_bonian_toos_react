import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { fetchDailyAttendance } from '../features/workers/workerSlice';

const DailyAttendanceScreen = () => {
  const { projectId, date } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { list: attendanceList, loading, error } = useSelector(
    (state) => state.workers.dailyAttendance
  );

  const { list: projects } = useSelector((state) => state.workers.projects);
  const projectName = projects.find(p => p.id === Number(projectId))?.name || "پروژه";

  useEffect(() => {
    if (projectId && date) {
      dispatch(fetchDailyAttendance({ projectId, date }));
    }
  }, [dispatch, projectId, date]);

  const toPersianDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
      return Number(amount).toLocaleString('fa-IR');
  };

  // ✅ محاسبه خلاصه آمار (اضافه شدن درآمد)
  const totalWorkers = attendanceList.length;
  const totalHours = attendanceList.reduce((acc, curr) => acc + (curr.total_hours_decimal || 0), 0);
  const totalEarned = attendanceList.reduce((acc, curr) => acc + (curr.earned_amount || 0), 0);

  return (
    <div className="container mx-auto px-4 py-6 rtl font-vazir">
      {/* دکمه بازگشت */}
      <button 
        onClick={() => navigate(-1)}
        className="mb-4 text-gray-400 hover:text-white flex items-center gap-1 text-sm transition"
      >
        ➡️ بازگشت به گزارشات
      </button>

      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-8 border-b border-gray-700 pb-4 gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white mb-2">
                📋 لیست حضور و غیاب
            </h1>
            <p className="text-gray-400">
                {projectName} <span className="mx-2">|</span> <span className="text-yellow-400 font-mono">{toPersianDate(date)}</span>
            </p>
        </div>
        
        {/* ✅ کارت‌های خلاصه آمار (آپدیت شده) */}
        <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 text-center flex-grow xl:flex-grow-0 min-w-[100px]">
                <div className="text-2xl font-bold text-blue-400">{totalWorkers}</div>
                <div className="text-xs text-gray-400">نفر حاضر</div>
            </div>
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 text-center flex-grow xl:flex-grow-0 min-w-[100px]">
                <div className="text-2xl font-bold text-green-400 font-mono">{totalHours.toFixed(1)}</div>
                <div className="text-xs text-gray-400">مجموع ساعت</div>
            </div>
            {/* کارت جدید درآمد کل */}
            <div className="bg-gray-800 p-3 rounded-lg border border-gray-600 text-center flex-grow xl:flex-grow-0 min-w-[140px]">
                <div className="text-2xl font-bold text-yellow-400 font-mono">{formatCurrency(totalEarned)}</div>
                <div className="text-xs text-gray-400">مجموع درآمد (تومان)</div>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="text-center text-blue-400 animate-pulse py-10">در حال دریافت لیست...</div>
      ) : error ? (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-700 text-center">{error}</div>
      ) : attendanceList.length === 0 ? (
        <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/30">
            هیچ کارگری در این تاریخ برای این پروژه ثبت نشده است.
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl shadow-xl overflow-hidden border border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-sm">
              <thead className="bg-gray-800 text-gray-400 uppercase text-xs font-bold">
                <tr>
                  <th className="px-6 py-4">مشخصات کارگر</th>
                  <th className="px-6 py-4 text-center">ورود</th>
                  <th className="px-6 py-4 text-center">خروج</th>
                  <th className="px-6 py-4 text-center">مدت (ساعت)</th>
                  <th className="px-6 py-4 text-center text-yellow-500">درآمد (تومان)</th>
                  <th className="px-6 py-4 text-center">وضعیت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700 text-gray-300">
                {attendanceList.map((att) => (
                  <tr key={att.id} className="hover:bg-gray-800/50 transition">
                    
                    {/* ✅ ستون نام: شامل نام، سمت و تلفن */}
                    <td className="px-6 py-4">
                        <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center text-lg mt-1">
                                👤
                            </div>
                            <div className="flex flex-col">
                                <span className="text-white font-bold text-base">{att.worker_name}</span>
                                <div className="flex items-center gap-2 text-xs text-gray-400 mt-1">
                                    <span className="bg-gray-800 px-1.5 py-0.5 rounded border border-gray-600">{att.worker_position}</span>
                                    <span>📞 {att.worker_phone}</span>
                                </div>
                            </div>
                        </div>
                    </td>

                    <td className="px-6 py-4 text-center font-mono dir-ltr text-green-300 text-base">
                        {att.time_in_display || '---'}
                    </td>
                    <td className="px-6 py-4 text-center font-mono dir-ltr text-red-300 text-base">
                        {att.time_out_display || '---'}
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="bg-gray-800 px-2 py-1 rounded border border-gray-600 font-mono font-bold">
                            {att.total_hours_hhmmss || '00:00'}
                        </span>
                    </td>

                    {/* ✅ ستون درآمد */}
                    <td className="px-6 py-4 text-center">
                        {att.earned_amount > 0 ? (
                            <span className="text-yellow-400 font-mono font-bold text-lg">
                                {formatCurrency(att.earned_amount)}
                            </span>
                        ) : (
                            <span className="text-gray-600 text-xs">محاسبه نشده</span>
                        )}
                    </td>

                    <td className="px-6 py-4 text-center">
                        {att.status === 'PRESENT' ? (
                            <span className="bg-green-900/30 text-green-400 px-2 py-1 rounded text-xs border border-green-800">حاضر</span>
                        ) : (
                            <span className="bg-red-900/30 text-red-400 px-2 py-1 rounded text-xs border border-red-800">{att.status}</span>
                        )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyAttendanceScreen;