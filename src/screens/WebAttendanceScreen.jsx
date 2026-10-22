import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import moment from 'moment-jalaali';
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
  FaCalendarCheck,
  FaSun,
  FaMoon
} from 'react-icons/fa';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';

// 🌟 کامپوننت ساعت آنالوگ دایره‌ای زنده
const LiveAnalogClock = ({ time, isDark }) => {
  const seconds = time.seconds();
  const minutes = time.minutes();
  const hours = time.hours() % 12;

  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full border-2 flex items-center justify-center shadow-inner shrink-0 ${
      isDark ? 'bg-gray-900 border-blue-500/40 shadow-blue-500/10' : 'bg-white border-blue-400 shadow-blue-200'
    }`}>
      {/* نشانگرهای ۴ جهت اصلی */}
      <div className="absolute top-1 w-1 h-2 bg-gray-400 rounded-full" />
      <div className="absolute bottom-1 w-1 h-2 bg-gray-400 rounded-full" />
      <div className="absolute left-1 h-1 w-2 bg-gray-400 rounded-full" />
      <div className="absolute right-1 h-1 w-2 bg-gray-400 rounded-full" />

      {/* عقربه ساعت‌شمار */}
      <div
        className="absolute w-1 h-6 bg-blue-500 rounded-full origin-bottom"
        style={{
          bottom: '50%',
          transform: `rotate(${hourDeg}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
        }}
      />

      {/* عقربه دقیقه‌شمار */}
      <div
        className="absolute w-0.5 h-8 bg-purple-500 rounded-full origin-bottom"
        style={{
          bottom: '50%',
          transform: `rotate(${minDeg}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)'
        }}
      />

      {/* عقربه ثانیه‌شمار */}
      <div
        className="absolute w-0.5 h-9 bg-rose-500 rounded-full origin-bottom z-10"
        style={{
          bottom: '50%',
          transform: `rotate(${secDeg}deg)`,
          transition: seconds === 0 ? 'none' : 'transform 0.15s ease-out'
        }}
      />

      {/* نقطه مرکزی */}
      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 z-20 border border-white shadow" />
    </div>
  );
};

const WebAttendanceScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { data: statusData, loading: statusLoading } = useSelector((state) => state.workers.workerStatus);
  const actionLoading = useSelector((state) => state.workers.clockActionLoading);
  const { data: monthlyData, loading: monthlyLoading } = useSelector((state) => state.workers.monthlyShifts);

  // استیت زمان زنده برای تیک‌تاک ساعت و ثانیه‌شمار
  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // محاسبه بازه روز/شب و آیکون
  const hour = currentTime.hour();
  const isMorning = hour >= 4 && hour < 12;
  const timeOfDay = isMorning ? 'صبحگاه' : (hour >= 12 && hour < 18 ? 'عصرگاه' : 'شامگاه');
  const TimeIcon = isMorning ? FaSun : FaMoon;
  const iconColor = isMorning ? 'text-amber-500' : 'text-indigo-400';

  useEffect(() => {
    dispatch(fetchWorkerStatus());
    dispatch(fetchMonthlyShifts());
  }, [dispatch]);

  // استخراج شاخص‌های آماری بر مبنای ساختار بک‌اند
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

      {/* 🔹 بخش ۱: وضعیت حاضر و دکمه‌های کنترل تردد همراه با ساعت زنده مرکزی */}
      <div className={`p-6 rounded-2xl shadow-lg border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-800'}`}>
        <div className="flex flex-col lg:flex-row justify-between items-center mb-6 gap-6">
          
          {/* راست: عنوان صفحه و پروژه */}
          <div className="text-center lg:text-right w-full lg:w-auto">
            <h1 className="text-2xl font-black flex items-center justify-center lg:justify-start gap-2">
              <FaClock className="text-blue-500" /> میز کار و کنترل تردد
            </h1>
            <p className={`mt-2 text-sm flex items-center justify-center lg:justify-start gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              <FaProjectDiagram /> پروژه فعال: <span className="font-bold text-blue-500">{current_project_name || 'مشخص نشده'}</span>
            </p>
          </div>

          {/* 🌟 مرکز: باکس تاریخ بزرگ با ساعت دایره‌ای زنده */}
          <div className={`flex items-center gap-4 px-6 py-3.5 rounded-2xl border shadow-lg mx-auto transition-all ${
            isDark 
              ? 'bg-gray-900/90 border-blue-500/30 text-white shadow-blue-500/5' 
              : 'bg-gradient-to-r from-blue-50/80 to-purple-50/80 border-blue-200 text-gray-900 shadow-blue-100'
          }`}>
            {/* ساعت آنالوگ دایره‌ای */}
            <LiveAnalogClock time={currentTime} isDark={isDark} />

            {/* جزئیات متنی تاریخ و ساعت دیجیتال لایو */}
            <div className="flex flex-col items-start gap-1">
              <div className="flex items-center gap-2 text-base sm:text-lg font-black leading-tight">
                <TimeIcon className={`${iconColor} text-lg animate-pulse`} />
                <span>امروز: {currentTime.format('dddd jD jMMMM')}</span>
              </div>

              <div className="text-xs sm:text-sm font-mono font-bold opacity-80 flex items-center gap-2" dir="ltr">
                <span>{currentTime.format('jYYYY/jMM/jDD')}</span>
                <span>•</span>
                <span className="text-blue-500 font-black text-sm sm:text-base">{currentTime.format('HH:mm:ss')}</span>
                <span className="text-xs font-sans">({timeOfDay})</span>
              </div>
            </div>
          </div>

          {/* چپ: درآمد و مانده مرخصی */}
          <div className="flex gap-3 w-full lg:w-auto justify-center lg:justify-end">
            <div className={`px-4 py-2.5 rounded-xl text-center border ${isDark ? 'bg-gray-700/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
              <p className="text-xs opacity-70 mb-1">درآمد امروز</p>
              <p className="font-bold text-emerald-500 flex items-center justify-center gap-1 text-sm">
                {earned_today ? earned_today.toLocaleString() : 0} <FaMoneyBillWave />
              </p>
            </div>
            {leave_balance_annual !== null && (
              <div className={`px-4 py-2.5 rounded-xl text-center border ${isDark ? 'bg-gray-700/40 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <p className="text-xs opacity-70 mb-1">مانده مرخصی</p>
                <p className="font-bold text-sky-500 text-sm">{leave_balance_annual} روز</p>
              </div>
            )}
          </div>
        </div>

        {/* دکمه‌های ثبت تردد */}
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
          <FaHistory className="text-blue-500" /> ترددهای ثبت‌شده امروز
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