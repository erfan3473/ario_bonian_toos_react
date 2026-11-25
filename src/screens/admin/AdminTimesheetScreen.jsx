// src/screens/admin/AdminTimesheetScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useReactToPrint } from 'react-to-print';
import {
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CalendarDaysIcon,
  ChevronLeftIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  ExclamationTriangleIcon,
  MagnifyingGlassIcon,
  PrinterIcon,
  SignalIcon,
  StopCircleIcon,
} from '@heroicons/react/24/outline';
import {
  fetchTimesheetByRange,
  fetchDailyBulkWorkerLocationStats,
  setTimesheetFilters,
} from '../../features/attendance/attendanceSlice';
import { fetchProjects } from '../../features/projects/projectSlice';

import JalaliDatePicker from '../../components/JalaliDatePicker';
import TimesheetByDay from '../../components/TimesheetByDay';
import TimesheetSummary from '../../components/TimesheetSummary';
import PersianCalendarFrame from '../../components/PersianCalendarFrame';
import { formatJalaliDateLong } from '../../utils/dateUtils';
import { exportTimesheetToExcel } from '../../utils/timesheetExcelExport';
import logo from '../../assets/ario.png';

import moment from 'moment-jalaali';
moment.loadPersian({ usePersianDigits: false });

const STORAGE_KEY = 'admin_timesheet_state_v1';
const GPS_CHUNK_DAYS = 5;

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const readSavedState = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
};

const writeSavedState = (stateObj) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateObj));
  } catch {
    // نادیده گرفتن خطای حافظه مرورگر
  }
};

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

const AdminTimesheetScreen = () => {
  const dispatch = useDispatch();
  const mode = useSelector((state) => state.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const {
    loading,
    error,
    meta,
    workers,
    byWorker,
    byDay,
    filters,
    dailyLocationStats = {},
    dailyLocationError,
    locationStatsByWorker = {},
  } = useSelector((state) => state.attendance);

  const { list: projects = [] } = useSelector((state) => state.projects);

  const todayGregorian = new Date().toISOString().split('T')[0];

  const savedRef = useRef(readSavedState());
  const saved = savedRef.current;

  const [startDate, setStartDate] = useState(saved?.startDate || todayGregorian);
  const [endDate, setEndDate] = useState(saved?.endDate || todayGregorian);
  const [nightStart, setNightStart] = useState(saved?.nightStart || '22:00');
  const [nightEnd, setNightEnd] = useState(saved?.nightEnd || '06:00');
  const [projectId, setProjectId] = useState(saved?.projectId || '');
  const [searchText, setSearchText] = useState(saved?.search || '');
  const [hasLoadedOnce, setHasLoadedOnce] = useState(Boolean(saved?.hasLoaded));

  // وضعیت دریافت تکه‌ای (۵ روزه) آمار مکانی
  const [isBulkGpsRunning, setIsBulkGpsRunning] = useState(false);
  const [gpsProgress, setGpsProgress] = useState({ doneDays: 0, totalDays: 0 });
  const [loadingGpsKey, setLoadingGpsKey] = useState(null);
  const cancelGpsRef = useRef(false);

  const printRef = useRef(null);
  const didInitRef = useRef(false);

  const selectedProjectName =
    projects.find((p) => String(p.id) === String(projectId))?.name ||
    'همه پروژه‌ها';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `تایم‌شیت-${startDate}-تا-${endDate}`,
    pageStyle: `
      @page { size: A3 landscape; margin: 8mm; }
      html, body {
        direction: rtl !important;
        text-align: right !important;
        background: #ffffff !important;
        color: #0f172a !important;
        font-family: 'Vazirmatn', 'Tahoma', sans-serif !important;
      }
      * {
        direction: rtl !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      @media print {
        table { font-size: 8.5px !important; width: 100% !important; border-collapse: collapse !important; }
        th, td { border-color: #94a3b8 !important; }
        .no-print { display: none !important; }
        .print-row-avoid-break { break-inside: avoid; page-break-inside: avoid; }
      }
    `,
  });

  useEffect(() => {
    dispatch(fetchProjects());
    return () => {
      cancelGpsRef.current = true;
    };
  }, [dispatch]);

  // بازیابی فیلترها و بارگذاری خودکار گزارش پس از رفرش صفحه
  useEffect(() => {
    if (didInitRef.current) return;
    didInitRef.current = true;

    const restoredFilters = {
      start_date: startDate,
      end_date: endDate,
      projectId: projectId || null,
      positionId: filters.positionId || null,
      workerId: filters.workerId || null,
      search: searchText || '',
      night_start: nightStart,
      night_end: nightEnd,
    };

    dispatch(setTimesheetFilters(restoredFilters));

    if (saved?.hasLoaded && startDate && endDate && !moment(endDate).isBefore(startDate)) {
      dispatch(
        fetchTimesheetByRange({
          start_date: startDate,
          end_date: endDate,
          project_id: projectId || null,
          position_id: filters.positionId || null,
          worker_id: filters.workerId || null,
          search: searchText || '',
          night_start: nightStart,
          night_end: nightEnd,
        })
      );
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ذخیره مداوم فیلترها در localStorage تا با رفرش نپرند
  useEffect(() => {
    writeSavedState({
      startDate,
      endDate,
      nightStart,
      nightEnd,
      projectId,
      search: searchText,
      hasLoaded: hasLoadedOnce,
    });
  }, [startDate, endDate, nightStart, nightEnd, projectId, searchText, hasLoadedOnce]);

  const handleStartDateChange = (e) => {
    const gDate = e.target.value;
    setStartDate(gDate || todayGregorian);
  };

  const handleEndDateChange = (e) => {
    const gDate = e.target.value;
    setEndDate(gDate || todayGregorian);
  };

  const handleSearch = () => {
    if (!startDate || !endDate) return;

    if (moment(endDate).isBefore(startDate)) {
      alert('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد');
      return;
    }

    // توقف هر محاسبه مکانی نیمه‌تمام قبلی
    cancelGpsRef.current = true;
    setIsBulkGpsRunning(false);
    setGpsProgress({ doneDays: 0, totalDays: 0 });

    setHasLoadedOnce(true);

    dispatch(
      setTimesheetFilters({
        start_date: startDate,
        end_date: endDate,
        projectId: projectId || null,
        positionId: filters.positionId || null,
        workerId: filters.workerId || null,
        search: searchText || '',
        night_start: nightStart,
        night_end: nightEnd,
      })
    );

    dispatch(
      fetchTimesheetByRange({
        start_date: startDate,
        end_date: endDate,
        project_id: projectId || null,
        position_id: filters.positionId || null,
        worker_id: filters.workerId || null,
        search: searchText || '',
        night_start: nightStart,
        night_end: nightEnd,
      })
    );
  };

  const handleQuickRange = (days) => {
    const end = new Date().toISOString().split('T')[0];
    const start = moment(end).subtract(days, 'days').format('YYYY-MM-DD');

    setStartDate(start);
    setEndDate(end);

    dispatch(
      setTimesheetFilters({
        start_date: start,
        end_date: end,
      })
    );
  };

  // دریافت تکه‌ای آمار مکانی همه روزها (بسته‌های ۵ روزه برای حفظ پایداری سرور)
  const handleRunChunkedGps = async () => {
    if (!meta?.days?.length || !workers?.length) return;

    cancelGpsRef.current = false;
    setIsBulkGpsRunning(true);

    const allDays = meta.days;
    const workerIds = workers.map((w) => w.worker_id);
    setGpsProgress({ doneDays: 0, totalDays: allDays.length });

    try {
      for (let i = 0; i < allDays.length; i += GPS_CHUNK_DAYS) {
        if (cancelGpsRef.current) break;

        const slice = allDays.slice(i, i + GPS_CHUNK_DAYS);
        const chunkStart = slice[0].gregorian_date;
        const chunkEnd = slice[slice.length - 1].gregorian_date;

        await dispatch(
          fetchDailyBulkWorkerLocationStats({
            worker_ids: workerIds,
            start_date: chunkStart,
            end_date: chunkEnd,
            project_id: filters.projectId || null,
          })
        ).unwrap();

        if (!cancelGpsRef.current) {
          setGpsProgress({
            doneDays: Math.min(i + slice.length, allDays.length),
            totalDays: allDays.length,
          });
        }
      }
    } catch {
      // خطا در state.dailyLocationError نمایش داده می‌شود
    } finally {
      setIsBulkGpsRunning(false);
    }
  };

  const handleCancelChunkedGps = () => {
    cancelGpsRef.current = true;
    setIsBulkGpsRunning(false);
  };

  // محاسبه آمار مکانی فقط برای یک روز خاص
  const handleFetchDayGps = async (dateStr) => {
    if (!workers?.length) return;
    const workerIds = workers.map((w) => w.worker_id);
    setLoadingGpsKey(`day:${dateStr}`);
    try {
      await dispatch(
        fetchDailyBulkWorkerLocationStats({
          worker_ids: workerIds,
          start_date: dateStr,
          end_date: dateStr,
          project_id: filters.projectId || null,
        })
      ).unwrap();
    } catch {
      // خطا در استیت ثبت می‌شود
    } finally {
      setLoadingGpsKey(null);
    }
  };

  // محاسبه آمار مکانی فقط برای یک فرد در یک روز خاص
  const handleFetchSingleWorkerDayGps = async (workerId, dateStr) => {
    setLoadingGpsKey(`row:${workerId}:${dateStr}`);
    try {
      await dispatch(
        fetchDailyBulkWorkerLocationStats({
          worker_ids: [workerId],
          start_date: dateStr,
          end_date: dateStr,
          project_id: filters.projectId || null,
        })
      ).unwrap();
    } catch {
      // خطا در استیت ثبت می‌شود
    } finally {
      setLoadingGpsKey(null);
    }
  };

  const handleExportExcel = () => {
    exportTimesheetToExcel({
      meta,
      workers,
      byWorker,
      byDay,
      dailyLocationStats,
      locationStatsByWorker,
      startDate,
      endDate,
      projectName: selectedProjectName,
    });
  };

  const daysCount =
    startDate && endDate ? moment(endDate).diff(moment(startDate), 'days') + 1 : 0;

  const progressPercent =
    gpsProgress.totalDays > 0
      ? Math.round((gpsProgress.doneDays / gpsProgress.totalDays) * 100)
      : 0;

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const surfacePanel = isDark ? 'bg-tactical-surface1' : 'bg-tactical-lightSurface';
  const surfaceHeader = isDark ? 'bg-tactical-surface2' : 'bg-tactical-lightElevated';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  const inputBase = `w-full h-9 px-2.5 rounded-[2px] border focus:outline-none text-xs font-semibold transition-colors tracking-normal ${
    isDark
      ? 'bg-tactical-canvas text-slate-100 border-slate-400/25 placeholder-slate-500 focus:border-sky-400'
      : 'bg-slate-50 text-slate-900 border-slate-900/20 placeholder-slate-400 focus:border-sky-600'
  }`;

  return (
    <div
      className={`relative min-h-screen transition-colors duration-200 ${
        isDark
          ? 'bg-tactical-canvas text-slate-200 tactical-grid-dark'
          : 'bg-tactical-lightCanvas text-slate-900 tactical-grid-light'
      }`}
    >
      {isDark && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 z-0 tactical-scanlines no-print"
        />
      )}

      {/* نوار مسیر و وضعیت */}
      <div
        className={`relative z-10 border-b ${borderHairline} ${
          isDark ? 'bg-tactical-surface1/95' : 'bg-white/95'
        } backdrop-blur-sm no-print`}
      >
        <div className="max-w-[1440px] mx-auto px-3 sm:px-5 h-10 flex items-center justify-between gap-3 text-[11px] tracking-normal">
          <nav aria-label="مسیر صفحه" className="flex items-center gap-1.5 min-w-0 font-medium">
            <Link
              to="/"
              className={`transition-colors ${
                isDark ? 'text-sky-400 hover:text-sky-300' : 'text-sky-700 hover:text-sky-800'
              }`}
            >
              پایگاه اصلی
            </Link>
            <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
            <span className={textSecondary}>مدیریت منابع انسانی</span>
            <ChevronLeftIcon className="w-3 h-3 text-slate-500 shrink-0" />
            <span className={`font-semibold truncate ${textPrimary}`}>
              گزارش یکپارچه حضور، اضافه‌کاری و پایش مکانی
            </span>
          </nav>

          <span className={`hidden sm:inline tabular-nums font-medium ${textSecondary}`}>
            امروز: <strong className={textPrimary}>{formatJalaliDateLong(todayGregorian)}</strong>
          </span>
        </div>
      </div>

      <div className="relative z-10 max-w-[1440px] mx-auto px-3 sm:px-5 py-4 sm:py-6 space-y-4">
        {/* ═══════════════════════════════════════════════════════════ */}
        {/* کنسول تنظیم بازه، تقویم و فیلترها */}
        {/* ═══════════════════════════════════════════════════════════ */}
        <section className="no-print" aria-label="تنظیمات و فیلترهای گزارش حضور">
          <div className={`relative border rounded-[2px] ${surfacePanel} ${borderHairline}`}>
            <CornerBrackets accent="cyan" isDark={isDark} />

            <div
              className={`px-4 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${borderHairline} ${surfaceHeader}`}
            >
              <div className="flex items-center gap-2">
                <ClipboardDocumentCheckIcon
                  className={`w-4 h-4 ${isDark ? 'text-sky-400' : 'text-sky-700'}`}
                />
                <h1 className={`text-xs sm:text-sm font-bold tracking-normal ${textPrimary}`}>
                  سامانه گزارش‌گیری یکپارچه حضور و غیاب، اضافه‌کاری و پایش مکانی
                </h1>
              </div>
              <span className={`text-[11px] font-medium tracking-normal ${textSecondary}`}>
                ذخیره خودکار فیلترها | چاپ رسمی A3 | خروجی اکسل
              </span>
            </div>

            <div className="p-4 sm:p-5 flex flex-col lg:flex-row items-center lg:items-stretch justify-between gap-5">
              <div className="flex items-center justify-center">
                <PersianCalendarFrame startDate={startDate} endDate={endDate} />
              </div>

              <div className="flex-1 w-full flex flex-col justify-between gap-4">
                <div className="space-y-3.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={`text-[11px] font-semibold me-1 tracking-normal ${textSecondary}`}>
                      بازه سریع:
                    </span>
                    {[
                      {
                        label: 'فقط امروز',
                        onClick: () => {
                          setStartDate(todayGregorian);
                          setEndDate(todayGregorian);
                        },
                      },
                      { label: 'هفته گذشته', onClick: () => handleQuickRange(7) },
                      { label: 'ماه گذشته', onClick: () => handleQuickRange(30) },
                      { label: '۳ ماه گذشته', onClick: () => handleQuickRange(90) },
                    ].map((btn) => (
                      <button
                        key={btn.label}
                        type="button"
                        onClick={btn.onClick}
                        className={`h-7 px-2.5 rounded-[2px] border text-[11px] font-semibold tracking-normal transition-colors ${
                          isDark
                            ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300 hover:border-sky-400/50 hover:text-sky-300'
                            : 'bg-slate-50 border-slate-900/15 text-slate-700 hover:border-sky-600/50 hover:text-sky-800'
                        }`}
                      >
                        {btn.label}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 items-end">
                    <div>
                      <JalaliDatePicker
                        name="start_date"
                        label="تاریخ شروع"
                        value={startDate}
                        onChange={handleStartDateChange}
                        modal
                      />
                    </div>
                    <div>
                      <JalaliDatePicker
                        name="end_date"
                        label="تاریخ پایان"
                        value={endDate}
                        onChange={handleEndDateChange}
                        modal
                      />
                    </div>
                    <div>
                      <label className={`text-[11px] mb-1 block font-semibold tracking-normal ${textSecondary}`}>
                        شروع شب‌کاری
                      </label>
                      <input
                        type="time"
                        value={nightStart}
                        onChange={(e) => setNightStart(e.target.value)}
                        className={`${inputBase} dir-ltr text-center tabular-nums`}
                      />
                    </div>
                    <div>
                      <label className={`text-[11px] mb-1 block font-semibold tracking-normal ${textSecondary}`}>
                        پایان شب‌کاری
                      </label>
                      <input
                        type="time"
                        value={nightEnd}
                        onChange={(e) => setNightEnd(e.target.value)}
                        className={`${inputBase} dir-ltr text-center tabular-nums`}
                      />
                    </div>
                    <div>
                      <label className={`text-[11px] mb-1 block font-semibold tracking-normal ${textSecondary}`}>
                        پروژه
                      </label>
                      <select
                        value={projectId}
                        onChange={(e) => {
                          setProjectId(e.target.value);
                          dispatch(setTimesheetFilters({ projectId: e.target.value || null }));
                        }}
                        className={inputBase}
                      >
                        <option value="">همه پروژه‌ها</option>
                        {projects.map((project) => (
                          <option key={project.id} value={project.id}>
                            {project.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={`text-[11px] mb-1 block font-semibold tracking-normal ${textSecondary}`}>
                        جستجوی پرسنل
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchText}
                          onChange={(e) => {
                            setSearchText(e.target.value);
                            dispatch(setTimesheetFilters({ search: e.target.value }));
                          }}
                          placeholder="نام یا نام خانوادگی..."
                          className={`${inputBase} pe-8`}
                        />
                        <MagnifyingGlassIcon className="w-3.5 h-3.5 absolute end-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  className={`pt-3 border-t ${borderHairline} flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3`}
                >
                  {startDate && endDate && (
                    <div
                      className={`text-xs flex flex-wrap items-center gap-2 tracking-normal ${textSecondary}`}
                    >
                      <span>
                        بازه:{' '}
                        <strong className={textPrimary}>
                          {formatJalaliDateLong(startDate)} تا {formatJalaliDateLong(endDate)}
                        </strong>
                      </span>
                      <span className="opacity-40">|</span>
                      <span className="font-semibold tabular-nums">
                        {toPersianDigits(daysCount)} روز
                      </span>
                      <span className="opacity-40">|</span>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] border text-[11px] font-semibold tabular-nums ${
                          isDark
                            ? 'bg-indigo-500/15 border-indigo-400/35 text-indigo-300'
                            : 'bg-indigo-50 border-indigo-600/30 text-indigo-800'
                        }`}
                      >
                        <ClockIcon className="w-3.5 h-3.5" />
                        شب‌کاری: {toPersianDigits(nightStart)} تا {toPersianDigits(nightEnd)}
                      </span>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleSearch}
                    disabled={!startDate || !endDate || loading}
                    className={`h-10 px-6 rounded-[2px] font-semibold text-xs sm:text-sm inline-flex items-center justify-center gap-2 tracking-normal transition-colors disabled:opacity-50 shrink-0 ${
                      isDark
                        ? 'bg-sky-400 hover:bg-sky-300 text-slate-950'
                        : 'bg-sky-600 hover:bg-sky-700 text-white'
                    }`}
                  >
                    <MagnifyingGlassIcon className="w-4 h-4 shrink-0" />
                    <span>{loading ? 'در حال دریافت اطلاعات...' : 'نمایش گزارش حضور'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* نمایش خطا */}
        {(error || dailyLocationError) && (
          <div
            className={`p-3.5 rounded-[2px] border text-xs font-semibold flex items-center gap-2 tracking-normal no-print ${
              isDark
                ? 'bg-red-500/10 text-red-300 border-red-500/40'
                : 'bg-red-50 text-red-700 border-red-600/35'
            }`}
          >
            <ExclamationTriangleIcon className="w-5 h-5 shrink-0" />
            <span>{error || dailyLocationError}</span>
          </div>
        )}

        {/* وضعیت بارگذاری */}
        {loading && (
          <div className={`border rounded-[2px] overflow-hidden no-print ${surfacePanel} ${borderHairline}`}>
            <div className={`h-0.5 w-full ${isDark ? 'bg-sky-400/20' : 'bg-sky-600/20'} overflow-hidden`}>
              <div
                className={`h-full w-1/2 animate-shimmer ${
                  isDark
                    ? 'bg-gradient-to-r from-transparent via-sky-400 to-transparent'
                    : 'bg-gradient-to-r from-transparent via-sky-600 to-transparent'
                }`}
                style={{ backgroundSize: '200% 100%' }}
              />
            </div>
            <div className="p-6 text-center text-xs font-semibold tracking-normal text-sky-400">
              در حال دریافت و محاسبه گزارش حضور و غیاب، لطفاً شکیبا باشید...
            </div>
          </div>
        )}

        {/* نوار ابزار گزارش: محاسبه مکانی تکه‌ای (۵ روزه) + اکسل + چاپ رسمی */}
        {!loading && meta && (
          <div
            className={`p-3 rounded-[2px] border space-y-2.5 no-print ${surfacePanel} ${borderHairline}`}
          >
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5">
              {/* کنترل محاسبه مکانی تکه‌ای */}
              <div className="flex flex-wrap items-center gap-2">
                {!isBulkGpsRunning ? (
                  <button
                    type="button"
                    onClick={handleRunChunkedGps}
                    className={`h-9 px-3.5 rounded-[2px] border text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                      isDark
                        ? 'bg-emerald-500/15 border-emerald-400/50 text-emerald-300 hover:bg-emerald-500/25'
                        : 'bg-emerald-50 border-emerald-600/40 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <SignalIcon className="w-4 h-4 shrink-0" />
                    <span>محاسبه آمار مکانی همه روزها (بسته‌های ۵ روزه)</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleCancelChunkedGps}
                    className={`h-9 px-3.5 rounded-[2px] border text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                      isDark
                        ? 'bg-red-500/15 border-red-400/50 text-red-300 hover:bg-red-500/25'
                        : 'bg-red-50 border-red-600/40 text-red-700 hover:bg-red-100'
                    }`}
                  >
                    <StopCircleIcon className="w-4 h-4 shrink-0" />
                    <span>توقف محاسبه مکانی</span>
                  </button>
                )}

                {gpsProgress.totalDays > 0 && (
                  <span
                    className={`text-[11px] font-semibold tabular-nums inline-flex items-center gap-1.5 tracking-normal ${textSecondary}`}
                  >
                    {isBulkGpsRunning && <ArrowPathIcon className="w-3.5 h-3.5 animate-spin text-emerald-400" />}
                    پیشرفت پایش مکانی: {toPersianDigits(gpsProgress.doneDays)} از{' '}
                    {toPersianDigits(gpsProgress.totalDays)} روز ({toPersianDigits(progressPercent)}٪)
                  </span>
                )}
              </div>

              {/* اکسل و چاپ */}
              <div className="flex items-center gap-2 justify-end">
                <button
                  type="button"
                  onClick={handleExportExcel}
                  className={`flex-1 md:flex-none h-9 px-3.5 rounded-[2px] border text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                    isDark
                      ? 'bg-sky-400/15 border-sky-400/50 text-sky-300 hover:bg-sky-400/25'
                      : 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700'
                  }`}
                >
                  <ArrowDownTrayIcon className="w-4 h-4 shrink-0" />
                  <span>خروجی اکسل</span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePrint()}
                  className={`flex-1 md:flex-none h-9 px-4 rounded-[2px] border text-xs font-semibold inline-flex items-center justify-center gap-1.5 tracking-normal transition-colors ${
                    isDark
                      ? 'bg-tactical-surface2 border-slate-400/25 text-slate-100 hover:border-sky-400/50 hover:bg-tactical-hover'
                      : 'bg-slate-800 border-slate-900 text-white hover:bg-slate-900'
                  }`}
                >
                  <PrinterIcon className="w-4 h-4 shrink-0" />
                  <span>چاپ رسمی (A3)</span>
                </button>
              </div>
            </div>

            {/* نوار پیشرفت باریک در حین پردازش تکه‌ای */}
            {gpsProgress.totalDays > 0 && (
              <div
                className={`h-1.5 w-full rounded-[1px] overflow-hidden ${
                  isDark ? 'bg-tactical-canvas' : 'bg-slate-200'
                }`}
              >
                <div
                  className="h-full bg-emerald-500 transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}
          </div>
        )}

        {/* محتوای یکپارچه: جدول روزانه در بالا + خلاصه کارنامه همیشه در پایین */}
        {!loading && meta && (
          <div ref={printRef} dir="rtl" lang="fa" className="pb-10 print:pb-0">
            {/* سربرگ رسمی صرفاً در حالت چاپ */}
            <div className="hidden print:block mb-4 pb-3 border-b-2 border-slate-800">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <img src={logo} alt="آریو بنیان توس" className="h-12 w-auto object-contain" />
                  <div>
                    <h2 className="text-base font-bold text-slate-900">
                      شرکت آریو بنیان توس — گزارش رسمی و یکپارچه حضور و غیاب پرسنل
                    </h2>
                    <p className="text-xs text-slate-700 mt-0.5">
                      پروژه: {selectedProjectName} | شامل جدول تفکیکی روزانه و کارنامه خلاصه
                    </p>
                  </div>
                </div>
                <div className="text-left text-[11px] text-slate-800 space-y-0.5 tabular-nums">
                  <div>
                    بازه گزارش: {formatJalaliDateLong(startDate)} تا {formatJalaliDateLong(endDate)} (
                    {toPersianDigits(daysCount)} روز)
                  </div>
                  <div>
                    بازه شب‌کاری: {toPersianDigits(nightStart)} تا {toPersianDigits(nightEnd)} | تعداد
                    پرسنل: {toPersianDigits(workers.length)} نفر
                  </div>
                  <div>تاریخ چاپ: {formatJalaliDateLong(todayGregorian)}</div>
                </div>
              </div>
            </div>

            {/* جدول اصلی (بر اساس روز) */}
            <TimesheetByDay
              meta={meta}
              byDay={byDay}
              onFetchDayGps={handleFetchDayGps}
              onFetchSingleWorkerDayGps={handleFetchSingleWorkerDayGps}
              loadingGpsKey={loadingGpsKey}
              isBulkGpsRunning={isBulkGpsRunning}
            />

            {/* جدول خلاصه (همیشه پایین جدول روزانه) */}
            <TimesheetSummary
              meta={meta}
              workers={workers}
              byWorker={byWorker}
              loading={loading}
            />

            {/* کادر امضا صرفاً در حالت چاپ */}
            <div className="hidden print:grid grid-cols-4 gap-6 mt-8 pt-4 border-t border-slate-400 text-center text-xs text-slate-800 print-row-avoid-break">
              <div className="space-y-8">
                <div className="font-bold">تنظیم‌کننده گزارش</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px]">
                  نام و امضا
                </div>
              </div>
              <div className="space-y-8">
                <div className="font-bold">سرپرست کارگاه / پروژه</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px]">
                  نام و امضا
                </div>
              </div>
              <div className="space-y-8">
                <div className="font-bold">امور اداری و منابع انسانی</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px]">
                  نام و امضا
                </div>
              </div>
              <div className="space-y-8">
                <div className="font-bold">تایید مدیریت عامل</div>
                <div className="border-t border-dashed border-slate-400 pt-1 text-[10px]">
                  مهر و امضا
                </div>
              </div>
            </div>
          </div>
        )}

        {/* وضعیت اولیه قبل از جستجو */}
        {!loading && !meta && (
          <div
            className={`relative text-center py-12 px-4 border border-dashed rounded-[2px] transition-colors ${surfacePanel} ${borderHairline}`}
          >
            <CornerBrackets accent="cyan" isDark={isDark} />
            <CalendarDaysIcon className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className={`text-sm font-bold tracking-normal ${textPrimary}`}>
              بازه زمانی و فیلترهای مورد نظر را انتخاب کرده و روی «نمایش گزارش حضور» کلیک نمایید.
            </p>
            <p className={`text-xs mt-1 tracking-normal ${textSecondary}`}>
              جدول تفکیکی روزانه همراه با ستون‌های پایش مکانی و کارنامه خلاصه پرسنل در یک صفحه واحد نمایش داده می‌شوند.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTimesheetScreen;