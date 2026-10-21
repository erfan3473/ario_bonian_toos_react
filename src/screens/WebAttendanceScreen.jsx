import React, { useEffect, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import { 
  fetchWorkerStatus, 
  clockWorkerAction, 
  fetchMonthlyShifts 
} from '../features/workers/workerSlice';
import { 
  FaClock, 
  FaPlay, 
  FaStop, 
  FaHistory, 
  FaMoneyBillWave, 
  FaProjectDiagram, 
  FaCalendarAlt, 
  FaChartBar, 
  FaCalendarCheck 
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

const WebAttendanceScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { data: statusData, loading: statusLoading } = useSelector((state) => state.workers.workerStatus);
  const actionLoading = useSelector((state) => state.workers.clockActionLoading);
  const { data: monthlyData, loading: monthlyLoading } = useSelector((state) => state.workers.monthlyShifts);

  useEffect(() => {
    dispatch(fetchWorkerStatus());
    dispatch(fetchMonthlyShifts());
  }, [dispatch]);

  // استخراج دقیق شاخص‌های آماری بر مبنای ساختار واقعی بک‌اند
  const analytics = useMemo(() => {
    if (!monthlyData || !Array.isArray(monthlyData.days)) {
      return {
        yesterdayHours: 0,
        last7DaysHours: 0,
        last7DaysChart: [],
        projectRadarData: [],
      };
    }

    const days = monthlyData.days;

    // ۱. کارکرد ۷ روز گذشته و دیتای نمودار میله‌ای
    const recent7 = days.slice(-7);
    const last7DaysHours = recent7.reduce((sum, d) => sum + (Number(d.total_hours) || 0), 0);
    const last7DaysChart = recent7.map((d) => ({
      name: d.date_jalali ? d.date_jalali.substring(5) : d.date,
      hours: Number(d.total_hours) || 0,
      earned: d.total_earned || 0,
    }));

    // ۲. کارکرد دیروز (روز ماقبل آخرین روز ثبت شده)
    let yesterdayHours = 0;
    if (days.length >= 2) {
      yesterdayHours = Number(days[days.length - 2].total_hours) || 0;
    }

    // ۳. تجمیع ساعات پروژه‌ها برای نمودار راداری
    const projectHoursMap = {};
    days.forEach((day) => {
      if (Array.isArray(day.projects)) {
        day.projects.forEach((proj) => {
          const pName = proj.project_name || 'نامشخص';
          projectHoursMap[pName] = (projectHoursMap[pName] || 0) + (Number(proj.hours) || 0);
        });
      }
    });

    const projectRadarData = Object.keys(projectHoursMap).map((name) => ({
      subject: name,
      hours: Number(projectHoursMap[name].toFixed(2)),
      fullMark: monthlyData.total_hours || 100,
    }));

    return {
      yesterdayHours,
      last7DaysHours: Number(last7DaysHours.toFixed(2)),
      last7DaysChart,
      projectRadarData,
    };
  }, [monthlyData]);

  // ثبت ورود/خروج/اضافه‌کاری
  const handleClockAction = async (action) => {
    toast.loading('در حال ثبت عملیات...', { id: 'clock-toast' });
    try {
      const payload = {
        action: action,
        lat: null,
        long: null,
        accuracy: null,
      };

      const resultAction = await dispatch(clockWorkerAction(payload)).unwrap();
      toast.dismiss('clock-toast');
      
      const successMsg = 
        resultAction.status === 'WORKING' ? 'ورود با موفقیت ثبت شد' : 
        resultAction.status === 'OVERTIME_STARTED' ? 'اضافه‌کاری شروع شد' : 'خروج با موفقیت ثبت شد';
      toast.success(successMsg);
      
      dispatch(fetchWorkerStatus());
      dispatch(fetchMonthlyShifts());
    } catch (error) {
      toast.dismiss('clock-toast');
      const errorMessage = typeof error === 'string' ? error : error?.message || 'خطا در ثبت عملیات';
      toast.error(errorMessage);
    }
  };

  if (statusLoading && !statusData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!statusData) return null;

  if (!statusData.is_employee || !statusData.is_worker) {
    return (
      <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} shadow-lg`} dir="rtl">
        <FaHistory className="mx-auto text-4xl text-red-500 mb-4" />
        <h2 className="text-xl font-bold mb-2">عدم دسترسی</h2>
        <p className="opacity-80">{statusData.detail || 'پروفایل کارمندی/کارگری برای شما ثبت نشده است.'}</p>
      </div>
    );
  }

  const {
    clocked_in,
    overtime_active,
    current_project_name,
    earned_today,
    leave_balance_annual,
    today_shifts = [],
    today_overtimes = [],
    has_active_contract
  } = statusData;

  const isWorking = clocked_in;
  const isOvertime = overtime_active;
  const isIdle = !isWorking && !isOvertime;

  return (
    <div className="max-w-6xl mx-auto p-2 sm:p-4 space-y-6" dir="rtl">
      
      {/* 🔹 بخش ۱: وضعیت حاضر و دکمه‌های کنترل تردد */}
      <div className={`p-6 rounded-2xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <FaClock className="text-blue-500" /> میز کار و کنترل تردد
            </h1>
            <p className={`mt-2 text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <FaProjectDiagram /> پروژه فعال: <span className="font-bold text-blue-500">{current_project_name || 'مشخص نشده'}</span>
            </p>
          </div>
          
          <div className="flex gap-4">
            <div className={`px-4 py-2 rounded-xl text-center ${isDark ? 'bg-gray-700/60' : 'bg-gray-100'}`}>
              <p className="text-xs opacity-70 mb-1">درآمد امروز</p>
              <p className="font-bold text-emerald-500 flex items-center justify-center gap-1">
                {earned_today ? earned_today.toLocaleString() : 0} <FaMoneyBillWave />
              </p>
            </div>
            {leave_balance_annual !== null && (
              <div className={`px-4 py-2 rounded-xl text-center ${isDark ? 'bg-gray-700/60' : 'bg-gray-100'}`}>
                <p className="text-xs opacity-70 mb-1">مانده مرخصی</p>
                <p className="font-bold text-sky-500">{leave_balance_annual} روز</p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 border-t pt-6 border-gray-200 dark:border-gray-700">
          <button
            onClick={() => handleClockAction('IN')}
            disabled={!has_active_contract || isWorking || isOvertime || actionLoading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 
              ${isIdle && has_active_contract 
                ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.3)]' 
                : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-500'}`}
          >
            <FaPlay className="text-3xl mb-2" />
            <span className="font-bold text-lg">شروع شیفت</span>
            {!has_active_contract && <span className="text-xs mt-1 text-red-500">قرارداد فعال ندارید</span>}
          </button>

          <button
            onClick={() => handleClockAction('OUT')}
            disabled={isIdle || actionLoading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 
              ${!isIdle 
                ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)]' 
                : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-500'}`}
          >
            <FaStop className="text-3xl mb-2" />
            <span className="font-bold text-lg">پایان کار (خروج)</span>
          </button>

          <button
            onClick={() => handleClockAction('TO_OVERTIME')}
            disabled={!has_active_contract || isWorking || isOvertime || actionLoading}
            className={`flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-300 border-2 
              ${isIdle && has_active_contract
                ? 'border-purple-500 bg-purple-500/10 text-purple-500 hover:bg-purple-500/20 shadow-[0_0_15px_rgba(168,85,247,0.3)]' 
                : 'border-gray-300 dark:border-gray-600 opacity-50 cursor-not-allowed text-gray-500'}`}
          >
            <FaHistory className="text-3xl mb-2" />
            <span className="font-bold text-lg">شروع اضافه‌کاری</span>
          </button>
        </div>
      </div>

      {/* 🔹 بخش ۲: کارت‌های آماری کارکرد (ماه، هفته پیش، دیروز) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-2xl shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between text-xs opacity-70 mb-2">
            <span>کل کارکرد ماه</span>
            <FaCalendarAlt className="text-blue-500 text-base" />
          </div>
          <p className="text-2xl font-black">
            {monthlyData?.total_hours ?? 0} <span className="text-xs font-normal">ساعت</span>
          </p>
        </div>

        <div className={`p-4 rounded-2xl shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between text-xs opacity-70 mb-2">
            <span>کارکرد ۷ روز گذشته</span>
            <FaChartBar className="text-indigo-500 text-base" />
          </div>
          <p className="text-2xl font-black text-indigo-400">
            {analytics.last7DaysHours} <span className="text-xs font-normal">ساعت</span>
          </p>
        </div>

        <div className={`p-4 rounded-2xl shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between text-xs opacity-70 mb-2">
            <span>کارکرد دیروز</span>
            <FaClock className="text-amber-500 text-base" />
          </div>
          <p className="text-2xl font-black text-amber-500">
            {analytics.yesterdayHours} <span className="text-xs font-normal">ساعت</span>
          </p>
        </div>

        <div className={`p-4 rounded-2xl shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <div className="flex items-center justify-between text-xs opacity-70 mb-2">
            <span>روزهای حضور در ماه</span>
            <FaCalendarCheck className="text-emerald-500 text-base" />
          </div>
          <p className="text-2xl font-black text-emerald-500">
            {monthlyData?.total_days_worked ?? 0} <span className="text-xs font-normal">روز</span>
          </p>
        </div>
      </div>

      {/* 🔹 بخش ۳: نمودار میله‌ای (۷ روز گذشته) و نمودار راداری (توزیع ساعات روی پروژه‌ها) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* نمودار میله‌ای کارکرد ۷ روز گذشته */}
        <div className={`p-6 rounded-2xl shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <FaChartBar className="text-blue-500" /> روند کارکرد ۷ روز اخیر
          </h3>
          <div className="h-64">
            {analytics.last7DaysChart.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={analytics.last7DaysChart} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#4B5563' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: isDark ? '#9CA3AF' : '#4B5563' }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    cursor={{ fill: isDark ? '#1F2937' : '#F3F4F6' }}
                    contentStyle={{ 
                      backgroundColor: isDark ? '#111827' : '#FFFFFF', 
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      borderRadius: '10px',
                      color: isDark ? '#FFFFFF' : '#000000',
                      direction: 'rtl'
                    }}
                  />
                  <Bar dataKey="hours" name="ساعات حضور" fill="#3B82F6" radius={[6, 6, 0, 0]} barSize={26} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center opacity-60 text-sm">
                داده‌ای برای ۷ روز گذشته ثبت نشده است.
              </div>
            )}
          </div>
        </div>

        {/* نمودار راداری تمرکز کاری بر روی پروژه‌ها */}
        <div className={`p-6 rounded-2xl shadow-md border ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}>
          <h3 className="text-base font-bold mb-4 flex items-center gap-2">
            <FaProjectDiagram className="text-purple-500" /> توزیع ساعت کاری روی پروژه‌ها (راداری)
          </h3>
          <div className="h-64 flex items-center justify-center">
            {analytics.projectRadarData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.projectRadarData}>
                  <PolarGrid stroke={isDark ? '#374151' : '#E5E7EB'} />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#D1D5DB' : '#374151', fontSize: 12 }} />
                  <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                  <Radar name="ساعت" dataKey="hours" stroke="#A855F7" fill="#A855F7" fillOpacity={0.4} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? '#111827' : '#FFFFFF', 
                      borderColor: isDark ? '#374151' : '#E5E7EB',
                      borderRadius: '10px',
                      direction: 'rtl'
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex h-full items-center justify-center opacity-60 text-sm">
                داده‌ای برای رسم نمودار راداری وجود ندارد.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 🔹 بخش ۴: جدول ترددهای ثبت‌شده امروز */}
      <div className={`p-6 rounded-2xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <FaHistory className="text-blue-500" />  ترددهای ثبت‌شده امروز
        </h3>
        
        {today_shifts.length === 0 && today_overtimes.length === 0 ? (
          <p className="text-center py-6 opacity-70 text-sm">امروز هیچ ترددی برای شما ثبت نشده است.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-right">
              <thead className={`text-xs uppercase ${isDark ? 'bg-gray-700/50 text-gray-400' : 'bg-gray-100 text-gray-600'}`}>
                <tr>
                  <th className="px-4 py-3 rounded-tr-xl">نوع</th>
                  <th className="px-4 py-3">پروژه</th>
                  <th className="px-4 py-3">زمان ورود</th>
                  <th className="px-4 py-3">زمان خروج</th>
                  <th className="px-4 py-3 rounded-tl-xl">مدت (ساعت)</th>
                </tr>
              </thead>
              <tbody>
                {today_shifts.map((shift) => (
                  <tr key={`shift-${shift.id}`} className={`border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                    <td className="px-4 py-3 font-medium text-emerald-500">شیفت عادی</td>
                    <td className="px-4 py-3">{shift.project_name || '-'}</td>
                    <td className="px-4 py-3">{new Date(shift.time_in).toLocaleTimeString('fa-IR')}</td>
                    <td className="px-4 py-3">
                      {shift.time_out ? (
                        new Date(shift.time_out).toLocaleTimeString('fa-IR')
                      ) : (
                        <span className="text-amber-500 animate-pulse font-medium">در حال کار...</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">{shift.hours > 0 ? shift.hours : '-'}</td>
                  </tr>
                ))}
                
                {today_overtimes.map((ot) => (
                  <tr key={`ot-${ot.id}`} className={`border-b ${isDark ? 'border-gray-700/60' : 'border-gray-100'}`}>
                    <td className="px-4 py-3 font-medium text-purple-500">اضافه‌کاری</td>
                    <td className="px-4 py-3">{ot.project_name || '-'}</td>
                    <td className="px-4 py-3">{new Date(ot.time_in).toLocaleTimeString('fa-IR')}</td>
                    <td className="px-4 py-3">
                      {ot.time_out ? (
                        new Date(ot.time_out).toLocaleTimeString('fa-IR')
                      ) : (
                        <span className="text-amber-500 animate-pulse font-medium">در حال کار...</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-bold">{ot.hours > 0 ? ot.hours : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default WebAttendanceScreen;