// src/components/TimesheetByWorker.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  ChevronDownIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { fetchWorkerLocationStats } from '../features/attendance/attendanceSlice';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const formatMinutes = (minutes) => {
  if (minutes === null || minutes === undefined || isNaN(minutes)) return '-';
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

const decimalHoursToHHMM = (hours) => {
  if (hours === null || hours === undefined || isNaN(hours)) return '-';
  const totalMinutes = Math.round(hours * 60);
  return formatMinutes(totalMinutes);
};

const getStatusInfo = (status, isDark) => {
  const STATUS_MAP = {
    PRESENT: {
      label: 'حاضر',
      color: isDark
        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40'
        : 'text-emerald-800 bg-emerald-50 border-emerald-600/35',
    },
    ABSENT: {
      label: 'غایب',
      color: isDark
        ? 'text-red-300 bg-red-500/15 border-red-500/40'
        : 'text-red-700 bg-red-50 border-red-600/35',
    },
    LEAVE: {
      label: 'مرخصی',
      color: isDark
        ? 'text-sky-300 bg-sky-400/15 border-sky-400/40'
        : 'text-sky-800 bg-sky-50 border-sky-600/35',
    },
    APPROVED: {
      label: 'تایید شده',
      color: isDark
        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40'
        : 'text-emerald-800 bg-emerald-50 border-emerald-600/35',
    },
    PENDING: {
      label: 'در انتظار',
      color: isDark
        ? 'text-amber-300 bg-amber-500/15 border-amber-500/40'
        : 'text-amber-800 bg-amber-50 border-amber-600/35',
    },
    REJECTED: {
      label: 'رد شده',
      color: isDark
        ? 'text-red-300 bg-red-500/15 border-red-500/40'
        : 'text-red-700 bg-red-50 border-red-600/35',
    },
    RETURNED: {
      label: 'برگشتی',
      color: isDark
        ? 'text-purple-300 bg-purple-500/15 border-purple-500/40'
        : 'text-purple-800 bg-purple-50 border-purple-600/35',
    },
    SKIPPED: {
      label: 'رد مرحله',
      color: isDark
        ? 'text-slate-400 bg-slate-500/15 border-slate-500/35'
        : 'text-slate-600 bg-slate-100 border-slate-400/40',
    },
    NO_CONTRACT: {
      label: 'بدون قرارداد',
      color: isDark
        ? 'text-slate-300 bg-slate-600/20 border-slate-500/40'
        : 'text-slate-700 bg-slate-100 border-slate-400/40',
    },
  };

  return (
    STATUS_MAP[status] || {
      label: status || 'نامشخص',
      color: isDark
        ? 'text-slate-400 bg-tactical-surface2 border-slate-400/20'
        : 'text-slate-600 bg-slate-100 border-slate-300',
    }
  );
};

const StatusBadge = ({ status }) => {
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';
  const { label, color } = getStatusInfo(status, isDark);
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold border tracking-normal whitespace-nowrap ${color}`}
    >
      {label}
    </span>
  );
};

const ApprovalStepsMiniTable = ({ steps }) => {
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  if (!steps || steps.length === 0) {
    return <span className="text-[10px] opacity-35">-</span>;
  }

  return (
    <table
      className={`min-w-[180px] w-full text-[10px] border rounded-[2px] overflow-hidden ${
        isDark ? 'border-slate-400/20' : 'border-slate-900/15'
      }`}
    >
      <thead>
        <tr className={isDark ? 'bg-tactical-surface2' : 'bg-slate-100'}>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300' : 'border-slate-900/10 text-slate-700'}`}>
            مرحله
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300' : 'border-slate-900/10 text-slate-700'}`}>
            وضعیت
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300' : 'border-slate-900/10 text-slate-700'}`}>
            تأییدکننده
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300' : 'border-slate-900/10 text-slate-700'}`}>
            سمت
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300' : 'border-slate-900/10 text-slate-700'}`}>
            یادداشت
          </th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step, idx) => (
          <tr
            key={idx}
            className={`border-t ${
              isDark
                ? 'border-slate-400/15 even:bg-tactical-canvas/50'
                : 'border-slate-900/10 even:bg-slate-50'
            }`}
          >
            <td className="px-1 py-0.5 text-center tabular-nums">
              {step.step_order !== null && step.step_order !== undefined
                ? toPersianDigits(step.step_order)
                : '-'}
            </td>
            <td className="px-1 py-0.5 text-center">
              <StatusBadge status={step.status} />
            </td>
            <td className="px-1 py-0.5 text-center whitespace-nowrap tracking-normal">
              {step.approver_name || '---'}
            </td>
            <td className="px-1 py-0.5 text-center whitespace-nowrap tracking-normal">
              {step.approver_position || '---'}
            </td>
            <td
              className="px-1 py-0.5 text-center max-w-[90px] truncate tracking-normal"
              title={step.note}
            >
              {step.note || '---'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const TimesheetByWorker = ({ workers, byWorker }) => {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const {
    filters,
    locationStatsByWorker = {},
    locationStatsLoadingByWorker = {},
    locationStatsErrorByWorker = {},
  } = useSelector((state) => state.attendance);

  const [openedGpsWorkers, setOpenedGpsWorkers] = useState({});

  if (!workers || workers.length === 0) {
    return (
      <div
        className={`p-6 text-center text-xs rounded-[2px] border border-dashed tracking-normal ${
          isDark
            ? 'bg-tactical-surface1 border-slate-400/20 text-slate-400'
            : 'bg-white border-slate-900/15 text-slate-500'
        }`}
      >
        داده‌ای برای نمایش وجود ندارد.
      </div>
    );
  }

  const getDayType = (day) => {
    if (day.is_official_holiday) return 'تعطیل رسمی';
    if (day.is_friday) return 'جمعه';
    return 'عادی';
  };

  const handleToggleGps = (workerId) => {
    const key = String(workerId);
    const willOpen = !openedGpsWorkers[key];
    setOpenedGpsWorkers((prev) => ({ ...prev, [key]: willOpen }));

    if (willOpen && !locationStatsByWorker[key]) {
      dispatch(
        fetchWorkerLocationStats({
          worker_id: workerId,
          start_date: filters.start_date,
          end_date: filters.end_date,
          project_id: filters.projectId,
        })
      );
    }
  };

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const textPrimary = isDark ? 'text-slate-100' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400' : 'text-slate-600';

  return (
    <div className="space-y-5 mt-2">
      {workers.map((w, index) => {
        const wData = byWorker[w.worker_id];
        if (!wData) return null;

        const days = wData.days || [];
        const summary = wData.summary || {};
        const wid = String(w.worker_id);
        const isGpsOpen = Boolean(openedGpsWorkers[wid]);
        const gps = locationStatsByWorker[wid];
        const gpsLoading = Boolean(locationStatsLoadingByWorker[wid]);
        const gpsError = locationStatsErrorByWorker[wid];

        // محاسبه پویا برای تعداد ستون‌های ورود/خروج و اضافه‌کاری همین کارگر (حداقل ۱، حداکثر ۳ جفت)
        const maxAttCount = Math.min(
          3,
          Math.max(1, ...days.map((d) => d.attendance_logs?.length || 0))
        );
        const maxOtCount = Math.min(
          2,
          Math.max(1, ...days.map((d) => d.overtime_logs?.length || 0))
        );

        return (
          <div
            key={w.worker_id}
            className={`overflow-hidden rounded-[2px] border ${
              isDark
                ? 'bg-tactical-surface1 border-slate-400/20 print:bg-white print:border-slate-400'
                : 'bg-white border-slate-900/20'
            }`}
          >
            {/* هدر کارگر */}
            <div
              className={`px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 ${borderHairline} ${
                isDark
                  ? 'bg-tactical-surface2 print:bg-slate-200'
                  : 'bg-tactical-lightElevated'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={`inline-flex items-center justify-center min-w-[22px] h-6 px-1.5 rounded-[2px] border text-[11px] font-bold tabular-nums ${
                    isDark
                      ? 'bg-tactical-canvas border-sky-400/35 text-sky-300'
                      : 'bg-white border-sky-600/35 text-sky-800'
                  }`}
                >
                  {toPersianDigits(index + 1)}
                </span>
                <div className="leading-tight">
                  <h3 className={`font-bold text-xs sm:text-sm tracking-normal ${textPrimary}`}>
                    {w.worker_name}
                  </h3>
                  <div className={`text-[10px] mt-0.5 tabular-nums tracking-normal ${textSecondary}`}>
                    کد پرسنلی: {toPersianDigits(w.worker_code || '-')}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div
                  className={`text-[11px] px-2.5 py-1 rounded-[2px] border tabular-nums tracking-normal ${
                    isDark
                      ? 'bg-tactical-canvas border-slate-400/20 text-slate-200'
                      : 'bg-white border-slate-900/15 text-slate-800'
                  }`}
                >
                  حضور: <strong>{toPersianDigits(summary.total_present_days ?? 0)}</strong> روز
                </div>

                <div
                  className={`text-[11px] px-2.5 py-1 rounded-[2px] border tabular-nums tracking-normal ${
                    isDark
                      ? 'bg-tactical-canvas border-sky-400/30 text-sky-300'
                      : 'bg-sky-50 border-sky-600/30 text-sky-800'
                  }`}
                >
                  کل کارکرد:{' '}
                  <strong dir="ltr">{toPersianDigits(decimalHoursToHHMM(summary.total_hours ?? 0))}</strong>
                </div>

                <button
                  type="button"
                  onClick={() => handleToggleGps(w.worker_id)}
                  className={`h-7 px-2.5 rounded-[2px] text-[11px] font-semibold inline-flex items-center gap-1.5 border tracking-normal transition-colors no-print ${
                    isGpsOpen
                      ? isDark
                        ? 'bg-sky-400 text-slate-950 border-sky-400'
                        : 'bg-sky-600 text-white border-sky-600'
                      : isDark
                      ? 'bg-tactical-canvas text-sky-300 border-sky-400/35 hover:bg-tactical-hover'
                      : 'bg-white text-sky-700 border-sky-600/35 hover:bg-sky-50'
                  }`}
                >
                  <MapPinIcon className="w-3.5 h-3.5" />
                  <span>آمار موقعیت مکانی</span>
                  <ChevronDownIcon
                    className={`w-3 h-3 transition-transform ${isGpsOpen ? 'rotate-180' : ''}`}
                  />
                </button>
              </div>
            </div>

            {/* جدول ستونی تحلیل موقعیت مکانی + دایره در آخرین ستون */}
            {(isGpsOpen || gps) && (
              <div
                className={`border-b p-3 ${borderHairline} ${
                  isDark ? 'bg-tactical-canvas/70 print:bg-slate-50' : 'bg-slate-50/75'
                }`}
              >
                {gpsLoading ? (
                  <div className="flex items-center gap-2 text-xs text-sky-400 tracking-normal">
                    <ArrowPathIcon className="w-4 h-4 animate-spin" />
                    <span>در حال دریافت و تحلیل نقاط مکانی...</span>
                  </div>
                ) : gpsError ? (
                  <div className="text-xs text-red-400 tracking-normal">{gpsError}</div>
                ) : gps ? (
                  gps.total_logs === 0 ? (
                    <div className={`text-xs text-center py-2 tracking-normal ${textSecondary}`}>
                      اطلاعات موقعیت مکانی در ساعات موظفی این بازه ثبت نشده است.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table
                        className={`w-full text-[11px] border rounded-[2px] border-collapse ${
                          isDark ? 'border-slate-400/20' : 'border-slate-900/15'
                        }`}
                      >
                        <thead>
                          <tr
                            className={`border-b tracking-normal ${
                              isDark
                                ? 'bg-tactical-surface2 border-slate-400/20 text-slate-300'
                                : 'bg-white border-slate-900/15 text-slate-700'
                            }`}
                          >
                            <th className={`px-3 py-1.5 text-center border-e ${borderHairline}`}>
                              مسافت طی‌شده (کیلومتر)
                            </th>
                            <th className={`px-3 py-1.5 text-center border-e ${borderHairline}`}>
                              کل نقاط ثبت‌شده
                            </th>
                            <th className={`px-3 py-1.5 text-center border-e ${borderHairline} ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              داخل محدوده
                            </th>
                            <th className={`px-3 py-1.5 text-center border-e ${borderHairline} ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                              خارج محدوده
                            </th>
                            <th className={`px-3 py-1.5 text-center border-e ${borderHairline} ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                              خاموش / خطا
                            </th>
                            <th className="px-3 py-1.5 text-center">نمودار دایره‌ای</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className={isDark ? 'bg-tactical-surface1' : 'bg-white'}>
                            <td className={`px-3 py-2 text-center font-bold tabular-nums border-e ${borderHairline} ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                              {toPersianDigits(gps.distance_kilometers)}
                            </td>
                            <td className={`px-3 py-2 text-center font-bold tabular-nums border-e ${borderHairline} ${textPrimary}`}>
                              {toPersianDigits(gps.total_logs)}
                            </td>
                            <td className={`px-3 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                              <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                {toPersianDigits(gps.chart_data?.inside_project_percent ?? 0)}٪
                              </span>{' '}
                              <span className={`text-[10px] ${textSecondary}`}>
                                ({toPersianDigits(gps.raw_counts?.inside ?? 0)} نقطه)
                              </span>
                            </td>
                            <td className={`px-3 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                              <span className={`font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                                {toPersianDigits(gps.chart_data?.outside_project_percent ?? 0)}٪
                              </span>{' '}
                              <span className={`text-[10px] ${textSecondary}`}>
                                ({toPersianDigits(gps.raw_counts?.outside ?? 0)} نقطه)
                              </span>
                            </td>
                            <td className={`px-3 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                              <span className={`font-bold ${isDark ? 'text-red-400' : 'text-red-700'}`}>
                                {toPersianDigits(gps.chart_data?.gps_off_percent ?? 0)}٪
                              </span>{' '}
                              <span className={`text-[10px] ${textSecondary}`}>
                                ({toPersianDigits(gps.raw_counts?.off ?? 0)} نقطه)
                              </span>
                            </td>
                            <td className="px-3 py-1.5 text-center align-middle">
                              <div
                                className="relative w-11 h-11 rounded-full mx-auto"
                                style={{
                                  background: `conic-gradient(
                                    #10b981 0% ${gps.chart_data?.inside_project_percent ?? 0}%,
                                    #f59e0b ${gps.chart_data?.inside_project_percent ?? 0}% ${
                                      (gps.chart_data?.inside_project_percent ?? 0) +
                                      (gps.chart_data?.outside_project_percent ?? 0)
                                    }%,
                                    #ef4444 ${
                                      (gps.chart_data?.inside_project_percent ?? 0) +
                                      (gps.chart_data?.outside_project_percent ?? 0)
                                    }% 100%
                                  )`,
                                }}
                              >
                                <div
                                  className={`absolute inset-[4px] rounded-full flex items-center justify-center ${
                                    isDark ? 'bg-tactical-surface1 print:bg-white' : 'bg-white'
                                  }`}
                                >
                                  <span className="text-[9px] font-bold tabular-nums">
                                    {toPersianDigits(
                                      Math.round(gps.chart_data?.inside_project_percent ?? 0)
                                    )}
                                    ٪
                                  </span>
                                </div>
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  )
                ) : null}
              </div>
            )}

            {/* جدول روزهای کارگر با ستون‌های تفکیک‌شده ورود ۱ / خروج ۱ / ورود ۲ / خروج ۲ ... */}
            <div className="overflow-x-auto print:overflow-visible">
              <table className="min-w-full text-[11px] border-collapse">
                <thead
                  className={`border-b-2 tracking-normal ${
                    isDark
                      ? 'bg-tactical-surface2/90 text-slate-200 border-slate-400/25 print:bg-slate-200 print:text-slate-900'
                      : 'bg-tactical-lightElevated text-slate-800 border-slate-900/20'
                  }`}
                >
                  <tr>
                    <th className={`px-2.5 py-2 text-right font-bold border-e ${borderHairline}`}>
                      روز و تاریخ
                    </th>
                    <th className={`px-2 py-2 text-center font-bold border-e ${borderHairline}`}>
                      نوع روز
                    </th>
                    <th className={`px-2 py-2 text-center font-bold border-e ${borderHairline}`}>
                      وضعیت
                    </th>

                    {/* ستون‌های پویای ورود و خروج */}
                    {Array.from({ length: maxAttCount }).map((_, idx) => (
                      <React.Fragment key={`att-h-${idx}`}>
                        <th
                          className={`px-2 py-2 text-center font-bold border-e ${borderHairline} ${
                            isDark ? 'bg-emerald-500/10 text-emerald-300 print:text-slate-900' : 'bg-emerald-50/70 text-emerald-800'
                          }`}
                        >
                          ورود {toPersianDigits(idx + 1)}
                        </th>
                        <th
                          className={`px-2 py-2 text-center font-bold border-e ${borderHairline} ${
                            isDark ? 'bg-red-500/10 text-red-300 print:text-slate-900' : 'bg-red-50/70 text-red-800'
                          }`}
                        >
                          خروج {toPersianDigits(idx + 1)}
                        </th>
                      </React.Fragment>
                    ))}

                    <th className={`px-2 py-2 text-center font-bold border-e ${borderHairline}`}>
                      کارکرد
                    </th>

                    {/* ستون‌های پویای اضافه‌کاری */}
                    {Array.from({ length: maxOtCount }).map((_, idx) => (
                      <React.Fragment key={`ot-h-${idx}`}>
                        <th
                          className={`px-2 py-2 text-center font-bold border-e ${borderHairline} ${
                            isDark ? 'bg-amber-500/10 text-amber-300 print:text-slate-900' : 'bg-amber-50/70 text-amber-800'
                          }`}
                        >
                          اضافه‌کار از {maxOtCount > 1 ? toPersianDigits(idx + 1) : ''}
                        </th>
                        <th
                          className={`px-2 py-2 text-center font-bold border-e ${borderHairline} ${
                            isDark ? 'bg-amber-500/10 text-amber-300 print:text-slate-900' : 'bg-amber-50/70 text-amber-800'
                          }`}
                        >
                          اضافه‌کار تا {maxOtCount > 1 ? toPersianDigits(idx + 1) : ''}
                        </th>
                      </React.Fragment>
                    ))}

                    <th className={`px-2 py-2 text-center font-bold border-e ${borderHairline}`}>
                      تاییدشده اضافه‌کار
                    </th>
                    <th className="px-2 py-2 text-center font-bold">مراحل تأیید اضافه‌کاری</th>
                  </tr>
                </thead>

                <tbody>
                  {days.map((day, dayIndex) => {
                    const attLogs = day.attendance_logs || [];
                    const otLogs = day.overtime_logs || [];
                    const extraAttLogs = attLogs.slice(3);
                    const isEven = dayIndex % 2 === 0;

                    const otMap = {};
                    (day.overtime_approvals || []).forEach((app) => {
                      otMap[app.overtime_id] = app.steps || [];
                    });

                    let rowBg = isEven
                      ? isDark
                        ? 'bg-tactical-surface1 hover:bg-tactical-hover border-b-2 border-tactical-canvas print:bg-white'
                        : 'bg-white hover:bg-sky-50/45 border-b-2 border-slate-200'
                      : isDark
                      ? 'bg-tactical-surface2/80 hover:bg-tactical-hover border-b-2 border-tactical-canvas print:bg-slate-50'
                      : 'bg-slate-100/75 hover:bg-sky-50/45 border-b-2 border-slate-200';

                    if (day.is_official_holiday) {
                      rowBg = isDark
                        ? 'bg-red-950/25 hover:bg-red-950/40 border-b-2 border-tactical-canvas'
                        : 'bg-red-50/70 hover:bg-red-50 border-b-2 border-red-200';
                    } else if (day.is_friday) {
                      rowBg = isDark
                        ? 'bg-amber-950/20 hover:bg-amber-950/35 border-b-2 border-tactical-canvas'
                        : 'bg-amber-50/60 hover:bg-amber-50 border-b-2 border-amber-200';
                    }

                    return (
                      <tr
                        key={`${w.worker_id}-${day.gregorian_date}`}
                        className={`transition-colors duration-150 print-row-avoid-break ${rowBg}`}
                      >
                        <td
                          className={`px-2.5 py-2 text-right border-e border-s-[3px] whitespace-nowrap ${borderHairline} ${
                            day.is_official_holiday
                              ? 'border-s-red-500/70'
                              : day.is_friday
                              ? 'border-s-amber-500/70'
                              : isEven
                              ? isDark
                                ? 'border-s-sky-400/40'
                                : 'border-s-sky-600/40'
                              : isDark
                              ? 'border-s-slate-400/35'
                              : 'border-s-slate-500/35'
                          }`}
                        >
                          <div className={`font-bold tracking-normal ${textPrimary}`}>
                            {day.weekday_name}
                          </div>
                          <div className={`text-[10px] mt-0.5 tabular-nums ${textSecondary}`}>
                            {toPersianDigits(day.jalali_date)}
                          </div>
                          {day.holiday_title && (
                            <div
                              className={`text-[9px] mt-0.5 font-semibold tracking-normal ${
                                isDark ? 'text-red-400' : 'text-red-600'
                              }`}
                            >
                              {day.holiday_title}
                            </div>
                          )}
                        </td>

                        <td className={`px-2 py-2 text-center border-e whitespace-nowrap ${borderHairline}`}>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded-[2px] text-[10px] font-semibold border tracking-normal ${
                              day.is_official_holiday
                                ? isDark
                                  ? 'bg-red-500/15 text-red-300 border-red-500/35'
                                  : 'bg-red-50 text-red-700 border-red-600/30'
                                : day.is_friday
                                ? isDark
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                                  : 'bg-amber-50 text-amber-800 border-amber-600/30'
                                : isDark
                                ? 'bg-tactical-canvas text-slate-300 border-slate-400/20'
                                : 'bg-slate-100 text-slate-700 border-slate-900/15'
                            }`}
                          >
                            {getDayType(day)}
                          </span>
                        </td>

                        <td className={`px-2 py-2 text-center border-e whitespace-nowrap ${borderHairline}`}>
                          <StatusBadge status={day.status} />
                        </td>

                        {/* ستون‌های ورود ۱ / خروج ۱ / ورود ۲ / خروج ۲ ... */}
                        {Array.from({ length: maxAttCount }).map((_, idx) => {
                          const log = attLogs[idx];
                          const nextDay =
                            log?.time_in && log?.time_out && log.time_out < log.time_in;
                          const isLastCol = idx === maxAttCount - 1;

                          return (
                            <React.Fragment key={`att-c-${idx}`}>
                              <td
                                dir="ltr"
                                className={`px-2 py-2 text-center border-e tabular-nums whitespace-nowrap ${borderHairline}`}
                              >
                                {log?.time_in ? (
                                  <span
                                    className={`font-bold ${
                                      isDark ? 'text-emerald-400 print:text-slate-900' : 'text-emerald-700'
                                    }`}
                                  >
                                    {toPersianDigits(log.time_in)}
                                  </span>
                                ) : (
                                  <span className="opacity-30">-</span>
                                )}
                                {isLastCol && extraAttLogs.length > 0 && (
                                  <div className="text-[9px] text-sky-400 mt-0.5">
                                    +{toPersianDigits(extraAttLogs.length)} ورود
                                  </div>
                                )}
                              </td>

                              <td
                                dir="ltr"
                                className={`px-2 py-2 text-center border-e tabular-nums whitespace-nowrap ${borderHairline}`}
                              >
                                {log?.time_out ? (
                                  <span
                                    className={`font-bold ${
                                      isDark ? 'text-red-400 print:text-slate-900' : 'text-red-600'
                                    }`}
                                  >
                                    {toPersianDigits(log.time_out)}
                                    {nextDay && (
                                      <span className="text-[9px] ms-0.5 text-amber-400">(+۱)</span>
                                    )}
                                  </span>
                                ) : log?.time_in ? (
                                  <span className="text-[10px] text-amber-400 font-semibold">باز</span>
                                ) : (
                                  <span className="opacity-30">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td
                          dir="ltr"
                          className={`px-2 py-2 text-center border-e tabular-nums font-bold whitespace-nowrap ${borderHairline} ${
                            isDark ? 'text-sky-300 print:text-slate-900' : 'text-sky-800'
                          }`}
                        >
                          {day.hours_worked > 0
                            ? toPersianDigits(decimalHoursToHHMM(day.hours_worked))
                            : '-'}
                        </td>

                        {/* ستون‌های اضافه‌کاری */}
                        {Array.from({ length: maxOtCount }).map((_, idx) => {
                          const ot = otLogs[idx];
                          return (
                            <React.Fragment key={`ot-c-${idx}`}>
                              <td
                                dir="ltr"
                                className={`px-2 py-2 text-center border-e tabular-nums whitespace-nowrap ${borderHairline}`}
                              >
                                {ot?.time_in ? (
                                  <span
                                    className={`font-bold ${
                                      isDark ? 'text-sky-300 print:text-slate-900' : 'text-sky-700'
                                    }`}
                                  >
                                    {toPersianDigits(ot.time_in)}
                                  </span>
                                ) : (
                                  <span className="opacity-30">-</span>
                                )}
                              </td>
                              <td
                                dir="ltr"
                                className={`px-2 py-2 text-center border-e tabular-nums whitespace-nowrap ${borderHairline}`}
                              >
                                {ot?.time_out ? (
                                  <span
                                    className={`font-bold ${
                                      isDark ? 'text-purple-300 print:text-slate-900' : 'text-purple-700'
                                    }`}
                                  >
                                    {toPersianDigits(ot.time_out)}
                                  </span>
                                ) : (
                                  <span className="opacity-30">-</span>
                                )}
                              </td>
                            </React.Fragment>
                          );
                        })}

                        <td
                          dir="ltr"
                          className={`px-2 py-2 text-center border-e tabular-nums font-bold whitespace-nowrap ${borderHairline} ${
                            day.overtime_hours > 0
                              ? isDark
                                ? 'text-amber-300 print:text-slate-900'
                                : 'text-amber-800'
                              : 'opacity-35'
                          }`}
                        >
                          {day.overtime_hours > 0
                            ? toPersianDigits(decimalHoursToHHMM(day.overtime_hours))
                            : '-'}
                        </td>

                        <td className="px-2 py-1.5 text-center align-middle">
                          {otLogs.length > 0 ? (
                            <div className="flex flex-col gap-1">
                              {otLogs.map((ot) => (
                                <ApprovalStepsMiniTable
                                  key={ot.id}
                                  steps={otMap[ot.id] || []}
                                />
                              ))}
                            </div>
                          ) : (
                            <span className="opacity-30">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
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