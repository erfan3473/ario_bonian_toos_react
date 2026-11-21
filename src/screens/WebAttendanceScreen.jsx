// src/screens/WebAttendanceScreen.jsx
import React, { useEffect, useState, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-hot-toast';
import moment from 'moment-jalaali';
import {
  fetchWorkerStatus,
  clockWorkerAction,
  fetchMonthlyShifts,
} from '../features/workers/workerSlice';
import TodayOpsCartable from '../components/attendance/TodayOpsCartable';
import {
  FaClock,
  FaPlay,
  FaStop,
  FaHistory,
  FaProjectDiagram,
  FaCalendarAlt,
  FaChartBar,
  FaCalendarCheck,
  FaSun,
  FaMoon,
} from 'react-icons/fa';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const CornerBrackets = ({ accent = 'cyan', isDark = true }) => {
  const accentMap = {
    cyan: isDark ? 'border-sky-400/60' : 'border-sky-600/60',
    amber: isDark ? 'border-amber-400/60' : 'border-amber-600/60',
    emerald: isDark ? 'border-emerald-400/60' : 'border-emerald-600/60',
  };
  const colorClass = accentMap[accent] || accentMap.cyan;

  return (
    <>
      <span aria-hidden="true" className={`pointer-events-none absolute top-0 start-0 w-2 h-2 border-t border-s ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute top-0 end-0 w-2 h-2 border-t border-e ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 start-0 w-2 h-2 border-b border-s ${colorClass}`} />
      <span aria-hidden="true" className={`pointer-events-none absolute bottom-0 end-0 w-2 h-2 border-b border-e ${colorClass}`} />
    </>
  );
};

// ساعت آنالوگ زنده تاکتیکی
const LiveAnalogClock = ({ time, isDark }) => {
  const seconds = time.seconds();
  const minutes = time.minutes();
  const hours = time.hours() % 12;

  const secDeg = seconds * 6;
  const minDeg = minutes * 6 + seconds * 0.1;
  const hourDeg = hours * 30 + minutes * 0.5;

  return (
    <div
      dir="ltr"
      className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 flex items-center justify-center shrink-0 mx-auto sm:mx-0 ${
        isDark
          ? 'bg-tactical-canvas border-sky-400/50 shadow-[0_0_15px_rgba(56,189,248,0.12)]'
          : 'bg-white border-sky-600/50 shadow-inner'
      }`}
    >
      <div className="absolute top-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-slate-400" />
      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-slate-400" />
      <div className="absolute left-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-slate-400" />
      <div className="absolute right-1 top-1/2 -translate-y-1/2 h-0.5 w-1.5 bg-slate-400" />

      <div
        className={`absolute w-1 h-4 sm:h-5 rounded-full origin-bottom ${isDark ? 'bg-sky-400' : 'bg-sky-700'}`}
        style={{
          bottom: '50%',
          left: 'calc(50% - 2px)',
          transform: `rotate(${hourDeg}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
        }}
      />
      <div
        className={`absolute w-0.5 h-5 sm:h-7 rounded-full origin-bottom ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`}
        style={{
          bottom: '50%',
          left: 'calc(50% - 1px)',
          transform: `rotate(${minDeg}deg)`,
          transition: 'transform 0.2s cubic-bezier(0.4, 2.08, 0.55, 0.44)',
        }}
      />
      <div
        className="absolute w-0.5 h-6 sm:h-8 bg-rose-500 rounded-full origin-bottom z-10"
        style={{
          bottom: '50%',
          left: 'calc(50% - 1px)',
          transform: `rotate(${secDeg}deg)`,
          transition: seconds === 0 ? 'none' : 'transform 0.15s ease-out',
        }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-rose-500 z-20 border border-white" />
    </div>
  );
};

const WebAttendanceScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const { data: statusData, loading: statusLoading } = useSelector((state) => state.workers.workerStatus);
  const actionLoading = useSelector((state) => state.workers.clockActionLoading);
  const { data: monthlyData } = useSelector((state) => state.workers.monthlyShifts);

  const [currentTime, setCurrentTime] = useState(moment());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(moment());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const hour = currentTime.hour();
  const isMorning = hour >= 4 && hour < 12;
  const timeOfDay = isMorning ? 'صبحگاه' : hour >= 12 && hour < 18 ? 'عصرگاه' : 'شامگاه';
  const TimeIcon = isMorning ? FaSun : FaMoon;
  const iconColor = isMorning ? 'text-amber-400' : 'text-sky-400';

  useEffect(() => {
    dispatch(fetchWorkerStatus());
    dispatch(fetchMonthlyShifts());
  }, [dispatch]);

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
    const recent7 = days.slice(-7);
    const last7DaysHours = recent7.reduce((sum, d) => sum + (Number(d.total_hours) || 0), 0);
    const last7DaysChart = recent7.map((d) => ({
      name: d.date_jalali ? d.date_jalali.substring(5) : d.date,
      hours: Number(d.total_hours) || 0,
      earned: d.total_earned || 0,
    }));

    let yesterdayHours = 0;
    if (days.length >= 2) {
      yesterdayHours = Number(days[days.length - 2].total_hours) || 0;
    }

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

  const handleClockAction = async (action) => {
    toast.loading('در حال ثبت عملیات...', { id: 'clock-toast' });
    try {
      const payload = { action, lat: null, long: null, accuracy: null };
      const resultAction = await dispatch(clockWorkerAction(payload)).unwrap();
      toast.dismiss('clock-toast');

      const successMsg =
        resultAction.status === 'WORKING'
          ? 'ورود با موفقیت ثبت شد'
          : resultAction.status === 'OVERTIME_STARTED'
          ? 'اضافه‌کاری شروع شد'
          : 'خروج با موفقیت ثبت شد';
      toast.success(successMsg);

      dispatch(fetchWorkerStatus());
      dispatch(fetchMonthlyShifts());
    } catch (error) {
      toast.dismiss('clock-toast');
      const errorMessage = typeof error === 'string' ? error : error?.message || 'خطا در ثبت عملیات';
      toast.error(errorMessage);
    }
  };

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-white';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-slate-50';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  if (statusLoading && !statusData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-sky-400" />
      </div>
    );
  }

  if (!statusData) return null;

  if (!statusData.is_employee || !statusData.is_worker) {
    return (
      <div
        className={`relative p-5 m-3 max-w-xl mx-auto rounded-[2px] border text-center ${surfacePanel} ${borderHairline} ${textPrimary}`}
        dir="rtl"
      >
        <CornerBrackets accent="amber" isDark={isDark} />
        <FaHistory className="mx-auto text-3xl text-red-500 mb-3" />
        <h2 className="text-base font-bold mb-1.5">عدم دسترسی</h2>
        <p className={`text-xs ${textSecondary}`}>
          {statusData.detail || 'پروفایل کارمندی/کارگری برای شما ثبت نشده است.'}
        </p>
      </div>
    );
  }

  const {
    clocked_in,
    overtime_active,
    current_project_name,
    today_shifts = [],
    today_overtimes = [],
    has_active_contract,
  } = statusData;

  const isWorking = clocked_in;
  const isOvertime = overtime_active;
  const isIdle = !isWorking && !isOvertime;

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDark
          ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
          : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
      }`}
      dir="rtl"
    >
      <div className="max-w-7xl mx-auto px-2.5 sm:px-5 py-3.5 sm:py-5 space-y-4 overflow-x-hidden">

        {/* 🔹 بخش ۱: ترمینال کنترل تردد و ساعت زنده مرکزی */}
        <div className={`relative p-3.5 sm:p-5 rounded-[2px] border ${surfacePanel} ${borderHairline}`}>
          <CornerBrackets accent={isWorking ? 'emerald' : isOvertime ? 'amber' : 'cyan'} isDark={isDark} />

          <div className="grid grid-cols-1 lg:grid-cols-3 items-center mb-4 gap-3.5 sm:gap-5">
            {/* راست: عنوان و پروژه فعال */}
            <div className="text-center lg:text-right">
              <div className="flex items-center justify-center lg:justify-start gap-2">
                <div
                  className={`w-8 h-8 rounded-[2px] border flex items-center justify-center shrink-0 ${
                    isDark
                      ? 'bg-sky-400/10 border-sky-400/35 text-sky-400'
                      : 'bg-sky-50 border-sky-600/35 text-sky-700'
                  }`}
                >
                  <FaClock className="text-sm" />
                </div>
                <h1 className={`text-base sm:text-xl font-bold tracking-normal ${textPrimary}`}>
                  میز عملیات و کنترل تردد
                </h1>
              </div>
              <p className={`mt-1.5 text-xs flex items-center justify-center lg:justify-start gap-1.5 flex-wrap ${textSecondary}`}>
                <FaProjectDiagram className="shrink-0" />
                <span>پروژه فعال:</span>
                <span className={`font-bold ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                  {current_project_name || 'مشخص نشده'}
                </span>
              </p>
            </div>

            {/* مرکز: ساعت آنالوگ و دیجیتال زنده */}
            <div
              className={`w-full sm:w-auto max-w-full justify-self-center flex flex-col sm:flex-row items-center justify-center gap-3 px-4 py-2.5 rounded-[2px] border ${
                isDark
                  ? 'bg-tactical-canvas/90 border-sky-400/30 text-slate-100'
                  : 'bg-slate-50 border-sky-600/30 text-slate-900'
              }`}
            >
              <LiveAnalogClock time={currentTime} isDark={isDark} />

              <div className="flex flex-col items-center sm:items-start text-center sm:text-right gap-1 min-w-0">
                <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs sm:text-sm font-bold leading-tight">
                  <TimeIcon className={`${iconColor} text-sm shrink-0`} />
                  <span className="truncate">
                    امروز: {toPersianDigits(currentTime.format('dddd jD jMMMM'))}
                  </span>
                </div>
                <div
                  className="text-[11px] sm:text-xs font-mono font-bold flex flex-wrap items-center justify-center sm:justify-start gap-1.5 tabular-nums"
                  dir="ltr"
                >
                  <span className={textSecondary}>{toPersianDigits(currentTime.format('jYYYY/jMM/jDD'))}</span>
                  <span className="opacity-40">•</span>
                  <span className={`font-black text-xs sm:text-sm ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
                    {toPersianDigits(currentTime.format('HH:mm:ss'))}
                  </span>
                  <span className={`text-[10px] font-sans ${textSecondary}`} dir="rtl">
                    ({timeOfDay})
                  </span>
                </div>
              </div>
            </div>

            {/* چپ: وضعیت شیفت */}
            <div className="flex justify-center lg:justify-end">
              <span
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-[2px] text-xs font-bold border ${
                  isWorking
                    ? isDark
                      ? 'bg-emerald-500/15 border-emerald-400/45 text-emerald-300'
                      : 'bg-emerald-50 border-emerald-600/40 text-emerald-800'
                    : isOvertime
                    ? isDark
                      ? 'bg-amber-400/15 border-amber-400/45 text-amber-300'
                      : 'bg-amber-50 border-amber-600/40 text-amber-800'
                    : isDark
                    ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300'
                    : 'bg-slate-100 border-slate-900/15 text-slate-700'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isWorking
                      ? 'bg-emerald-400 animate-ping'
                      : isOvertime
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-slate-500'
                  }`}
                />
                وضعیت: {isWorking ? 'در حال کار (شیفت عادی)' : isOvertime ? 'در حال اضافه‌کاری' : 'خارج از شیفت'}
              </span>
            </div>
          </div>

          {/* دکمه‌های کنترل تردد */}
          <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3.5 border-t pt-4 ${borderHairline}`}>
            <button
              onClick={() => handleClockAction('IN')}
              disabled={!has_active_contract || isWorking || isOvertime || actionLoading}
              className={`flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 py-2.5 px-4 sm:p-3.5 rounded-[2px] transition-all border ${
                isIdle && has_active_contract
                  ? isDark
                    ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
                    : 'border-emerald-600 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                  : `${borderHairline} opacity-45 cursor-not-allowed text-slate-500`
              }`}
            >
              <FaPlay className="text-sm sm:text-xl shrink-0" />
              <div className="flex flex-col items-start sm:items-center">
                <span className="font-bold text-xs sm:text-sm">شروع شیفت</span>
                {!has_active_contract && <span className="text-[10px] text-red-400">قرارداد فعال ندارید</span>}
              </div>
            </button>

            <button
              onClick={() => handleClockAction('OUT')}
              disabled={isIdle || actionLoading}
              className={`flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 py-2.5 px-4 sm:p-3.5 rounded-[2px] transition-all border ${
                !isIdle
                  ? isDark
                    ? 'border-red-400/60 bg-red-500/10 text-red-300 hover:bg-red-500/20'
                    : 'border-red-600 bg-red-50 text-red-800 hover:bg-red-100'
                  : `${borderHairline} opacity-45 cursor-not-allowed text-slate-500`
              }`}
            >
              <FaStop className="text-sm sm:text-xl shrink-0" />
              <span className="font-bold text-xs sm:text-sm">پایان کار (خروج)</span>
            </button>

            <button
              onClick={() => handleClockAction('TO_OVERTIME')}
              disabled={!has_active_contract || isWorking || isOvertime || actionLoading}
              className={`flex flex-row sm:flex-col items-center justify-center gap-2 sm:gap-1 py-2.5 px-4 sm:p-3.5 rounded-[2px] transition-all border ${
                isIdle && has_active_contract
                  ? isDark
                    ? 'border-amber-400/60 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20'
                    : 'border-amber-600 bg-amber-50 text-amber-800 hover:bg-amber-100'
                  : `${borderHairline} opacity-45 cursor-not-allowed text-slate-500`
              }`}
            >
              <FaHistory className="text-sm sm:text-xl shrink-0" />
              <span className="font-bold text-xs sm:text-sm">شروع اضافه‌کاری</span>
            </button>
          </div>
        </div>

        {/* 🔹 بخش ۱.۵: بریفینگ و کارتابل عملیاتی امروز (ماموریت‌ها + روتین‌ها) */}
        <TodayOpsCartable isDark={isDark} />

        {/* 🔹 بخش ۲: کارت‌های آماری کارکرد */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3.5">
          {[
            { label: 'کل کارکرد ماه', value: monthlyData?.total_hours ?? 0, unit: 'ساعت', icon: FaCalendarAlt, color: isDark ? 'text-sky-400' : 'text-sky-700' },
            { label: '۷ روز گذشته', value: analytics.last7DaysHours, unit: 'ساعت', icon: FaChartBar, color: isDark ? 'text-indigo-400' : 'text-indigo-700' },
            { label: 'کارکرد دیروز', value: analytics.yesterdayHours, unit: 'ساعت', icon: FaClock, color: isDark ? 'text-amber-400' : 'text-amber-700' },
            { label: 'روزهای حضور ماه', value: monthlyData?.total_days_worked ?? 0, unit: 'روز', icon: FaCalendarCheck, color: isDark ? 'text-emerald-400' : 'text-emerald-700' },
          ].map((stat, idx) => {
            const StatIcon = stat.icon;
            return (
              <div key={idx} className={`p-3 sm:p-4 rounded-[2px] border ${surfacePanel} ${borderHairline}`}>
                <div className={`flex items-center justify-between text-[11px] mb-1.5 ${textSecondary}`}>
                  <span className="truncate font-medium">{stat.label}</span>
                  <StatIcon className={`${stat.color} text-sm shrink-0`} />
                </div>
                <p className={`text-lg sm:text-2xl font-bold tabular-nums ${stat.color}`}>
                  {toPersianDigits(stat.value)}{' '}
                  <span className={`text-[11px] font-normal ${textSecondary}`}>{stat.unit}</span>
                </p>
              </div>
            );
          })}
        </div>

        {/* 🔹 بخش ۳: نمودارهای تحلیلی */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-4">
          <div className={`p-3.5 sm:p-5 rounded-[2px] border ${surfacePanel} ${borderHairline}`}>
            <h3 className={`text-xs sm:text-sm font-bold mb-3 flex items-center gap-2 ${textPrimary}`}>
              <FaChartBar className={isDark ? 'text-sky-400' : 'text-sky-700'} />
              روند کارکرد ۷ روز اخیر
            </h3>
            <div className="h-52 sm:h-60">
              {analytics.last7DaysChart.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.last7DaysChart} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? '#334155' : '#E2E8F0'} />
                    <XAxis dataKey="name" tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#475569' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: isDark ? '#94A3B8' : '#475569' }} axisLine={false} tickLine={false} />
                    <Tooltip
                      cursor={{ fill: isDark ? '#1E293B' : '#F1F5F9' }}
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        borderRadius: '2px',
                        color: isDark ? '#F1F5F9' : '#0F172A',
                        fontSize: '12px',
                        direction: 'rtl',
                      }}
                    />
                    <Bar dataKey="hours" name="ساعات حضور" fill={isDark ? '#38BDF8' : '#0284C7'} radius={[2, 2, 0, 0]} barSize={22} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`flex h-full items-center justify-center text-xs ${textSecondary}`}>
                  داده‌ای برای ۷ روز گذشته ثبت نشده است.
                </div>
              )}
            </div>
          </div>

          <div className={`p-3.5 sm:p-5 rounded-[2px] border ${surfacePanel} ${borderHairline}`}>
            <h3 className={`text-xs sm:text-sm font-bold mb-3 flex items-center gap-2 ${textPrimary}`}>
              <FaProjectDiagram className={isDark ? 'text-amber-400' : 'text-amber-700'} />
              توزیع ساعت کاری روی پروژه‌ها
            </h3>
            <div className="h-52 sm:h-60 flex items-center justify-center">
              {analytics.projectRadarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="65%" data={analytics.projectRadarData}>
                    <PolarGrid stroke={isDark ? '#334155' : '#CBD5E1'} />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#CBD5E1' : '#334155', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} tick={false} axisLine={false} />
                    <Radar name="ساعت" dataKey="hours" stroke={isDark ? '#38BDF8' : '#0284C7'} fill={isDark ? '#38BDF8' : '#0284C7'} fillOpacity={0.3} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                        borderColor: isDark ? '#334155' : '#CBD5E1',
                        borderRadius: '2px',
                        fontSize: '12px',
                        direction: 'rtl',
                      }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className={`flex h-full items-center justify-center text-xs ${textSecondary}`}>
                  داده‌ای برای رسم نمودار راداری وجود ندارد.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 🔹 بخش ۴: جدول ترددهای ثبت‌شده امروز */}
        <div className={`relative rounded-[2px] border overflow-hidden ${surfacePanel} ${borderHairline}`}>
          <div className={`px-3.5 py-2.5 sm:px-5 sm:py-3 border-b flex items-center gap-2 ${borderHairline} ${surfaceHeader}`}>
            <FaHistory className={isDark ? 'text-sky-400' : 'text-sky-700'} />
            <h3 className={`text-xs sm:text-sm font-bold ${textPrimary}`}>ترددهای ثبت‌شده امروز</h3>
          </div>

          {today_shifts.length === 0 && today_overtimes.length === 0 ? (
            <p className={`text-center py-6 text-xs ${textSecondary}`}>امروز هیچ ترددی برای شما ثبت نشده است.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-right whitespace-nowrap border-collapse">
                <thead className={`text-[11px] font-bold border-b ${borderHairline} ${surfaceHeader} ${textSecondary}`}>
                  <tr>
                    <th className="px-3.5 py-2.5">نوع</th>
                    <th className="px-3.5 py-2.5">پروژه</th>
                    <th className="px-3.5 py-2.5">زمان ورود</th>
                    <th className="px-3.5 py-2.5">زمان خروج</th>
                    <th className="px-3.5 py-2.5">مدت (ساعت)</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-slate-400/15' : 'divide-slate-900/10'}`}>
                  {today_shifts.map((shift) => (
                    <tr key={`shift-${shift.id}`} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                      <td className={`px-3.5 py-2.5 font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>شیفت عادی</td>
                      <td className="px-3.5 py-2.5">{shift.project_name || '-'}</td>
                      <td className="px-3.5 py-2.5 tabular-nums">{new Date(shift.time_in).toLocaleTimeString('fa-IR')}</td>
                      <td className="px-3.5 py-2.5 tabular-nums">
                        {shift.time_out ? (
                          new Date(shift.time_out).toLocaleTimeString('fa-IR')
                        ) : (
                          <span className="text-amber-400 animate-pulse font-bold">در حال کار...</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold tabular-nums">{shift.hours > 0 ? toPersianDigits(shift.hours) : '-'}</td>
                    </tr>
                  ))}

                  {today_overtimes.map((ot) => (
                    <tr key={`ot-${ot.id}`} className={isDark ? 'hover:bg-tactical-hover' : 'hover:bg-slate-50'}>
                      <td className={`px-3.5 py-2.5 font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>اضافه‌کاری</td>
                      <td className="px-3.5 py-2.5">{ot.project_name || '-'}</td>
                      <td className="px-3.5 py-2.5 tabular-nums">{new Date(ot.time_in).toLocaleTimeString('fa-IR')}</td>
                      <td className="px-3.5 py-2.5 tabular-nums">
                        {ot.time_out ? (
                          new Date(ot.time_out).toLocaleTimeString('fa-IR')
                        ) : (
                          <span className="text-amber-400 animate-pulse font-bold">در حال کار...</span>
                        )}
                      </td>
                      <td className="px-3.5 py-2.5 font-bold tabular-nums">{ot.hours > 0 ? toPersianDigits(ot.hours) : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebAttendanceScreen;