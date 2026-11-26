// src/components/TimesheetByDay.jsx
import React, { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  ArrowPathIcon,
  CheckIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaperAirplaneIcon,
  SignalIcon,
} from '@heroicons/react/24/outline';
import { decimalHoursToHHMM } from '../utils/dateUtils';
import {
  sendAttendanceSms,
  refreshAttendanceSmsStatus,
  fetchAttendanceSmsLogs,
} from '../features/attendance/attendanceSlice';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const JALALI_MONTH_NAMES = [
  '',
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

const formatDayJalaliTitle = (day) => {
  const monthName = JALALI_MONTH_NAMES[Number(day.month)] || toPersianDigits(day.month);
  const y = toPersianDigits(day.year);
  const m = toPersianDigits(String(day.month).padStart(2, '0'));
  const d = toPersianDigits(String(day.day).padStart(2, '0'));
  return `${day.weekday_name} ${toPersianDigits(day.day)} ${monthName} ${y} (${y}/${m}/${d})`;
};

const getStatusInfo = (status, isDark) => {
  const STATUS_MAP = {
    PRESENT: {
      label: 'حاضر',
      color: isDark
        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40 print:text-slate-900 print:bg-emerald-50 print:border-emerald-400'
        : 'text-emerald-800 bg-emerald-50 border-emerald-600/35',
    },
    ABSENT: {
      label: 'غایب',
      color: isDark
        ? 'text-red-300 bg-red-500/15 border-red-500/40 print:text-red-800 print:bg-red-50 print:border-red-400'
        : 'text-red-700 bg-red-50 border-red-600/35',
    },
    LEAVE: {
      label: 'مرخصی',
      color: isDark
        ? 'text-sky-300 bg-sky-400/15 border-sky-400/40 print:text-sky-900 print:bg-sky-50 print:border-sky-400'
        : 'text-sky-800 bg-sky-50 border-sky-600/35',
    },
    APPROVED: {
      label: 'تایید شده',
      color: isDark
        ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/40 print:text-slate-900 print:bg-emerald-50'
        : 'text-emerald-800 bg-emerald-50 border-emerald-600/35',
    },
    PENDING: {
      label: 'در انتظار',
      color: isDark
        ? 'text-amber-300 bg-amber-500/15 border-amber-500/40 print:text-amber-900 print:bg-amber-50'
        : 'text-amber-800 bg-amber-50 border-amber-600/35',
    },
    REJECTED: {
      label: 'رد شده',
      color: isDark
        ? 'text-red-300 bg-red-500/15 border-red-500/40 print:text-red-800 print:bg-red-50'
        : 'text-red-700 bg-red-50 border-red-600/35',
    },
    RETURNED: {
      label: 'برگشتی',
      color: isDark
        ? 'text-purple-300 bg-purple-500/15 border-purple-500/40 print:text-purple-900 print:bg-purple-50'
        : 'text-purple-800 bg-purple-50 border-purple-600/35',
    },
    SKIPPED: {
      label: 'رد مرحله',
      color: isDark
        ? 'text-slate-400 bg-slate-500/15 border-slate-500/35 print:text-slate-700 print:bg-slate-100'
        : 'text-slate-600 bg-slate-100 border-slate-400/40',
    },
    NO_CONTRACT: {
      label: 'بدون قرارداد',
      color: isDark
        ? 'text-slate-300 bg-slate-600/20 border-slate-500/40 print:text-slate-700 print:bg-slate-100'
        : 'text-slate-700 bg-slate-100 border-slate-400/40',
    },
    'خروج نخورده': {
      label: 'خروج نخورده',
      color: isDark
        ? 'text-amber-300 bg-amber-500/15 border-amber-500/45 print:text-amber-900 print:bg-amber-50'
        : 'text-amber-800 bg-amber-50 border-amber-600/40',
    },
  };

  return (
    STATUS_MAP[status] || {
      label: status || 'نامشخص',
      color: isDark
        ? 'text-slate-400 bg-tactical-surface2 border-slate-400/20 print:text-slate-700 print:bg-slate-100'
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
      className={`inline-block px-1.5 py-0.5 print:px-1 print:py-0 rounded-[2px] text-[10px] print:text-[7px] font-semibold border tracking-normal whitespace-nowrap ${color}`}
    >
      {label}
    </span>
  );
};

const DailyGpsMiniDonut = ({ stats, isDark }) => {
  if (!stats || stats.total_logs === 0) {
    return (
      <span className={`text-[10px] print:text-[7px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
        ---
      </span>
    );
  }

  const inside = stats.chart_data?.inside_project_percent ?? 0;
  const outside = stats.chart_data?.outside_project_percent ?? 0;
  const stop1 = inside;
  const stop2 = Math.min(100, inside + outside);

  return (
    <div
      className="relative w-9 h-9 rounded-full mx-auto shrink-0 print:w-3.5 print:h-3.5"
      title={`داخل محدوده: ${inside}% | خارج محدوده: ${outside}% | خاموش: ${
        stats.chart_data?.gps_off_percent ?? 0
      }%`}
      style={{
        background: `conic-gradient(
          #10b981 0% ${stop1}%,
          #f59e0b ${stop1}% ${stop2}%,
          #ef4444 ${stop2}% 100%
        )`,
      }}
    >
      <div
        className={`absolute inset-[3.5px] rounded-full flex items-center justify-center print:hidden ${
          isDark ? 'bg-tactical-surface1' : 'bg-white'
        }`}
      >
        <span
          className={`text-[8.5px] font-bold tabular-nums leading-none ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          {toPersianDigits(Math.round(inside))}٪
        </span>
      </div>
    </div>
  );
};

const AttendanceSmsMiniList = ({ logs = [], onRefresh, refreshingId, isLoading }) => {
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  if (isLoading) {
    return (
      <div className={`text-[10px] mt-1 w-full flex items-center justify-center gap-1 tracking-normal no-print ${isDark ? 'text-sky-400' : 'text-sky-700'}`}>
        <ArrowPathIcon className="w-3 h-3 animate-spin" />
        در حال دریافت لاگ...
      </div>
    );
  }

  if (!logs.length) {
    return (
      <div className="text-[10px] mt-1 w-full text-center text-slate-500 tracking-normal no-print">
        لاگی ثبت نشده
      </div>
    );
  }

  return (
    <div className="flex flex-wrap justify-center gap-1 mt-1 w-full no-print">
      {logs.map((log) => {
        const statusLabel =
          log.delivery_status === 'DELIVERED'
            ? 'تحویل شد'
            : log.delivery_status === 'FAILED'
            ? 'ناموفق'
            : log.delivery_status === 'SENT'
            ? 'ارسال شده'
            : 'نامشخص';

        const statusColor =
          log.delivery_status === 'DELIVERED'
            ? isDark
              ? 'text-emerald-300 border-emerald-500/40 bg-emerald-500/15'
              : 'text-emerald-800 border-emerald-600/35 bg-emerald-50'
            : log.delivery_status === 'FAILED'
            ? isDark
              ? 'text-red-300 border-red-500/40 bg-red-500/15'
              : 'text-red-700 border-red-600/35 bg-red-50'
            : log.delivery_status === 'SENT'
            ? isDark
              ? 'text-amber-300 border-amber-500/40 bg-amber-500/15'
              : 'text-amber-800 border-amber-600/35 bg-amber-50'
            : isDark
            ? 'text-slate-400 border-slate-400/20 bg-tactical-surface2'
            : 'text-slate-600 border-slate-300 bg-slate-50';

        const canRefresh = !['DELIVERED', 'FAILED'].includes(log.delivery_status);

        return (
          <div
            key={log.id}
            className={`flex items-center gap-1 text-[10px] border rounded-[2px] px-1.5 py-0.5 tracking-normal ${statusColor}`}
          >
            <span className="font-semibold">{statusLabel}</span>
            {canRefresh && (
              <button
                type="button"
                onClick={() => onRefresh(log.id)}
                disabled={refreshingId === log.id}
                title="استعلام وضعیت از مخابرات"
                className={`flex items-center justify-center p-0.5 rounded-[2px] disabled:opacity-50 transition-colors ${
                  isDark ? 'bg-tactical-canvas hover:bg-tactical-hover' : 'bg-white hover:bg-slate-100'
                }`}
              >
                {refreshingId === log.id ? (
                  <ArrowPathIcon className="w-2.5 h-2.5 animate-spin" />
                ) : (
                  <MagnifyingGlassIcon className="w-2.5 h-2.5" />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
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
      className={`print-mini-table w-full text-[10px] border rounded-[2px] overflow-hidden ${
        isDark ? 'border-slate-400/20 print:border-slate-300' : 'border-slate-900/15'
      }`}
    >
      <thead>
        <tr className={isDark ? 'bg-tactical-surface2 print:bg-slate-100' : 'bg-slate-100'}>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300 print:text-slate-800' : 'border-slate-900/10 text-slate-700'}`}>
            مرحله
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300 print:text-slate-800' : 'border-slate-900/10 text-slate-700'}`}>
            وضعیت
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300 print:text-slate-800' : 'border-slate-900/10 text-slate-700'}`}>
            تأییدکننده
          </th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'border-slate-400/15 text-slate-300 print:text-slate-800' : 'border-slate-900/10 text-slate-700'}`}>
            دقیقه
          </th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step, idx) => (
          <tr
            key={idx}
            className={`border-t ${
              isDark
                ? 'border-slate-400/15 even:bg-tactical-canvas/50 print:even:bg-slate-50'
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
            <td
              className="px-1 py-0.5 text-center truncate max-w-[85px] tracking-normal"
              title={step.approver_name}
            >
              {step.approver_name || '---'}
            </td>
            <td className="px-1 py-0.5 text-center tabular-nums" title="دقیقه تایید شده">
              {toPersianDigits(step.approved_minutes_after ?? 0)}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

const TimesheetByDay = ({
  meta,
  byDay,
  onFetchDayGps,
  onFetchSingleWorkerDayGps,
  loadingGpsKey,
  isBulkGpsRunning,
}) => {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const smsSendingKey = useSelector((s) => s.attendance.smsSendingKey);
  const smsRefreshingId = useSelector((s) => s.attendance.smsRefreshingId);
  const smsLogsByKey = useSelector((s) => s.attendance.smsLogsByKey || {});
  const smsLogsLoadingKey = useSelector((s) => s.attendance.smsLogsLoadingKey);
  const dailyLocationStats = useSelector((s) => s.attendance.dailyLocationStats || {});

  const [openedSmsKey, setOpenedSmsKey] = useState({});

  const { maxAttCount, maxOtCount } = useMemo(() => {
    let maxA = 1;
    let maxO = 1;
    (meta?.days || []).forEach((d) => {
      const dayWorkers = byDay?.[d.gregorian_date]?.workers || [];
      dayWorkers.forEach((w) => {
        if ((w.attendance_logs?.length || 0) > maxA) maxA = w.attendance_logs.length;
        if ((w.overtime_logs?.length || 0) > maxO) maxO = w.overtime_logs.length;
      });
    });
    return {
      maxAttCount: Math.min(3, maxA),
      maxOtCount: Math.min(2, maxO),
    };
  }, [meta, byDay]);

  if (!meta?.days?.length) {
    return (
      <div
        className={`mt-3 p-6 text-center border border-dashed rounded-[2px] tracking-normal ${
          isDark
            ? 'bg-tactical-surface1 border-slate-400/20 text-slate-400'
            : 'bg-white border-slate-900/15 text-slate-500'
        }`}
      >
        داده‌ای برای نمایش وجود ندارد.
      </div>
    );
  }

  const handleSendAttendanceSms = (workerId, dateStr) => {
    const key = `${workerId}-${dateStr}`;
    setOpenedSmsKey((prev) => ({ ...prev, [key]: true }));
    dispatch(sendAttendanceSms({ worker_id: workerId, date: dateStr }));
  };

  const handleToggleSmsLogs = (workerId, dateStr) => {
    const key = `${workerId}-${dateStr}`;
    const isOpen = !!openedSmsKey[key];
    setOpenedSmsKey((prev) => ({ ...prev, [key]: !isOpen }));
    if (!isOpen && !smsLogsByKey[key]) {
      dispatch(fetchAttendanceSmsLogs({ worker_id: workerId, date: dateStr }));
    }
  };

  const handleRefreshAttendanceSms = (logId, workerId, dateStr) => {
    dispatch(refreshAttendanceSmsStatus({ log_id: logId, worker_id: workerId, date: dateStr }));
  };

  const rows = [];
  meta.days.forEach((day, dayIndex) => {
    const dayKey = day.gregorian_date;
    const dayData = byDay[dayKey] || { workers: [] };
    const dayWorkers = dayData.workers;

    rows.push({ type: 'dayHeader', day, dayIndex, totalWorkers: dayWorkers.length });

    if (dayWorkers.length === 0) {
      rows.push({ type: 'empty', day, dayIndex });
    } else {
      dayWorkers.forEach((worker, wIndex) => {
        rows.push({ type: 'worker', day, dayIndex, worker, workerIndex: wIndex + 1 });
      });
    }
  });

  const totalColSpan = 12 + maxAttCount * 2 + maxOtCount * 2;
  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const textPrimary = isDark ? 'text-slate-100 print:text-slate-900' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400 print:text-slate-600' : 'text-slate-600';

  return (
    <div className="space-y-2 print:space-y-1">
      <div className="flex items-center justify-between gap-2 print:mb-0.5">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-4 rounded-[1px] print:hidden ${isDark ? 'bg-sky-400' : 'bg-sky-600'}`} />
          <h3 className={`text-sm font-bold tracking-normal print:text-[9px] ${textPrimary}`}>
            جدول تفکیکی تردد، اضافه‌کاری و پایش مکانی روزانه
          </h3>
        </div>
        <span className={`text-[11px] tabular-nums tracking-normal print:text-[8px] ${textSecondary}`}>
          {toPersianDigits(meta.days.length)} روز کاری / تقویمی
        </span>
      </div>

      <div
        className={`overflow-x-auto rounded-[2px] border max-h-[75vh] overflow-y-auto print:max-h-none print:overflow-visible ${
          isDark
            ? 'border-slate-400/20 bg-tactical-surface1 print:bg-white print:border-slate-400'
            : 'border-slate-900/20 bg-white'
        }`}
      >
        <table className="print-compact-table w-full text-[11px] border-collapse">
          <thead className="sticky top-0 z-20 print:static">
            <tr
              className={`border-b-2 tracking-normal ${
                isDark
                  ? 'bg-tactical-surface2 border-slate-400/25 text-slate-200 print:bg-slate-200 print:text-slate-900'
                  : 'bg-tactical-lightElevated border-slate-900/20 text-slate-800'
              }`}
            >
              <th
                className={`px-2.5 py-2.5 text-right font-bold min-w-[155px] print:min-w-0 sticky right-0 z-30 border-e print:static ${
                  isDark
                    ? 'bg-tactical-surface2 border-slate-400/20 print:bg-slate-200'
                    : 'bg-tactical-lightElevated border-slate-900/15'
                }`}
              >
                ردیف و نام پرسنل
              </th>
              <th className={`px-2 py-2.5 text-center font-bold min-w-[170px] print:min-w-0 border-e ${borderHairline}`}>
                وضعیت <span className="no-print">/ پیامک</span>
              </th>

              {Array.from({ length: maxAttCount }).map((_, idx) => (
                <React.Fragment key={`d-att-h-${idx}`}>
                  <th
                    className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                      isDark ? 'bg-emerald-500/10 text-emerald-300 print:bg-slate-200 print:text-slate-900' : 'bg-emerald-50/70 text-emerald-800'
                    }`}
                  >
                    ورود {toPersianDigits(idx + 1)}
                  </th>
                  <th
                    className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                      isDark ? 'bg-red-500/10 text-red-300 print:bg-slate-200 print:text-slate-900' : 'bg-red-50/70 text-red-800'
                    }`}
                  >
                    خروج {toPersianDigits(idx + 1)}
                  </th>
                </React.Fragment>
              ))}

              {Array.from({ length: maxOtCount }).map((_, idx) => (
                <React.Fragment key={`d-ot-h-${idx}`}>
                  <th
                    className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                      isDark ? 'bg-amber-500/10 text-amber-300 print:bg-slate-200 print:text-slate-900' : 'bg-amber-50/70 text-amber-800'
                    }`}
                  >
                    اضافه‌کار از {maxOtCount > 1 ? toPersianDigits(idx + 1) : ''}
                  </th>
                  <th
                    className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                      isDark ? 'bg-amber-500/10 text-amber-300 print:bg-slate-200 print:text-slate-900' : 'bg-amber-50/70 text-amber-800'
                    }`}
                  >
                    اضافه‌کار تا {maxOtCount > 1 ? toPersianDigits(idx + 1) : ''}
                  </th>
                </React.Fragment>
              ))}

              <th className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline}`}>
                جمع اضافه‌کار
                <br />
                (سیستم)
              </th>
              <th
                className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                  isDark ? 'text-emerald-300 print:text-slate-900' : 'text-emerald-800'
                }`}
              >
                تاییدشده
                <br />
                اضافه‌کار
              </th>
              <th className={`px-2 py-2.5 text-center font-bold min-w-[185px] print:min-w-0 border-e ${borderHairline}`}>
                مراحل تأیید
              </th>
              <th
                className={`px-2 py-2.5 text-center font-bold min-w-[140px] print:min-w-0 border-e-2 ${
                  isDark ? 'border-slate-400/30' : 'border-slate-900/25'
                }`}
              >
                کارکرد
                <br />
                (کل / شب / جمعه)
              </th>

              {/* ۶ ستون آمار مکانی همان روز */}
              <th className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline}`}>
                مسافت
                <br />
                (کیلومتر)
              </th>
              <th className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline}`}>
                تعداد
                <br />
                نقاط
              </th>
              <th
                className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                  isDark ? 'text-emerald-400 print:text-slate-900' : 'text-emerald-700'
                }`}
              >
                داخل
                <br />
                محدوده
              </th>
              <th
                className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                  isDark ? 'text-amber-400 print:text-slate-900' : 'text-amber-700'
                }`}
              >
                خارج
                <br />
                محدوده
              </th>
              <th
                className={`px-2 py-2.5 text-center font-bold border-e whitespace-nowrap ${borderHairline} ${
                  isDark ? 'text-red-400 print:text-slate-900' : 'text-red-700'
                }`}
              >
                خاموش /
                <br />
                خطا
              </th>
              <th className="px-2 py-2.5 text-center font-bold whitespace-nowrap">
                نمودار
                <br />
                مکانی
              </th>
            </tr>
          </thead>

          <tbody>
            {rows.map((row) => {
              if (row.type === 'dayHeader') {
                const { day, totalWorkers } = row;
                const isHoliday = day.is_official_holiday;
                const isFriday = day.is_friday;
                const isThisDayLoading = loadingGpsKey === `day:${day.gregorian_date}`;

                return (
                  <tr
                    key={`header-${day.gregorian_date}`}
                    className={`print-day-header border-t-2 border-b ${
                      isDark
                        ? 'border-t-sky-400/45 border-b-slate-400/20 bg-tactical-canvas print:bg-slate-200'
                        : 'border-t-sky-600/45 border-b-slate-900/15 bg-slate-200/85'
                    }`}
                  >
                    <td colSpan={totalColSpan} className="px-3 py-2">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 flex-wrap">
                          <span
                            className={`font-bold text-xs sm:text-sm print:text-[8.5px] tracking-normal tabular-nums ${
                              isDark ? 'text-sky-300 print:text-slate-900' : 'text-slate-900'
                            }`}
                          >
                            {formatDayJalaliTitle(day)}
                          </span>
                          <span
                            className={`px-2 py-0.5 print:px-1.5 print:py-0 rounded-[2px] text-[10px] print:text-[7px] font-semibold border tracking-normal ${
                              isHoliday
                                ? isDark
                                  ? 'bg-red-500/15 text-red-300 border-red-500/40 print:bg-red-50 print:text-red-800'
                                  : 'bg-red-50 text-red-700 border-red-600/35'
                                : isFriday
                                ? isDark
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/40 print:bg-amber-50 print:text-amber-800'
                                  : 'bg-amber-50 text-amber-800 border-amber-600/35'
                                : isDark
                                ? 'bg-tactical-surface2 text-slate-300 border-slate-400/20 print:bg-white print:text-slate-800'
                                : 'bg-white text-slate-700 border-slate-900/15'
                            }`}
                          >
                            {isHoliday ? day.holiday_title || 'تعطیل رسمی' : isFriday ? 'جمعه' : 'روز عادی'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[11px] print:text-[7.5px] font-semibold px-2 py-0.5 print:px-1.5 print:py-0 rounded-[2px] border tabular-nums tracking-normal ${
                              isDark
                                ? 'text-slate-200 bg-tactical-surface2 border-slate-400/20 print:bg-white print:text-slate-900'
                                : 'text-slate-800 bg-white border-slate-900/15'
                            }`}
                          >
                            تعداد افراد: {toPersianDigits(totalWorkers)}
                          </span>

                          {totalWorkers > 0 && onFetchDayGps && (
                            <button
                              type="button"
                              disabled={isBulkGpsRunning || isThisDayLoading}
                              onClick={() => onFetchDayGps(day.gregorian_date)}
                              className={`h-6 px-2 rounded-[2px] border text-[10px] font-semibold inline-flex items-center gap-1 tracking-normal transition-colors disabled:opacity-50 no-print ${
                                isDark
                                  ? 'bg-emerald-500/10 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/20'
                                  : 'bg-white border-emerald-600/40 text-emerald-800 hover:bg-emerald-50'
                              }`}
                              title="محاسبه آمار موقعیت مکانی فقط برای این روز"
                            >
                              {isThisDayLoading ? (
                                <ArrowPathIcon className="w-3 h-3 animate-spin" />
                              ) : (
                                <SignalIcon className="w-3 h-3" />
                              )}
                              <span>آمار مکانی این روز</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              }

              if (row.type === 'empty') {
                return (
                  <tr key={`empty-${row.day.gregorian_date}`}>
                    <td
                      colSpan={totalColSpan}
                      className={`px-2 py-3 text-center text-[11px] tracking-normal ${textSecondary}`}
                    >
                      هیچ کارگری در این روز ثبت نشده است.
                    </td>
                  </tr>
                );
              }

              const { day, worker, workerIndex } = row;
              const attendanceLogs = worker.attendance_logs || [];
              const overtimeLogs = worker.overtime_logs || [];
              const overtimeApprovals = worker.overtime_approvals || [];
              const extraAttLogs = attendanceLogs.slice(3);
              const isIncomplete = attendanceLogs.some((l) => l.time_in && !l.time_out);
              const isEven = workerIndex % 2 === 1;

              const smsKey = `${worker.worker_id}-${day.gregorian_date}`;
              const currentLogs =
                smsLogsByKey[smsKey] !== undefined ? smsLogsByKey[smsKey] : worker.sms_logs || [];
              const hasSuccessfulOrPendingSms = currentLogs.some((l) =>
                ['SENT', 'DELIVERED'].includes(l.delivery_status)
              );
              const isSmsAlreadySent =
                currentLogs.length > 0 ? hasSuccessfulOrPendingSms : Boolean(worker.sms_sent);

              const isSmsOpen = !!openedSmsKey[smsKey];
              const isSmsLogsLoading = smsLogsLoadingKey === smsKey;
              const isSending = smsSendingKey === smsKey;

              const gpsKey = `${worker.worker_id}:${day.gregorian_date}`;
              const gps = dailyLocationStats[gpsKey];
              const isRowGpsLoading =
                loadingGpsKey === `row:${gpsKey}` || loadingGpsKey === `day:${day.gregorian_date}`;

              const rowBgClass = isEven
                ? isDark
                  ? 'bg-tactical-surface1 hover:bg-tactical-hover border-b-2 border-tactical-canvas print:bg-white'
                  : 'bg-white hover:bg-sky-50/45 border-b-2 border-slate-200'
                : isDark
                ? 'bg-tactical-surface2/80 hover:bg-tactical-hover border-b-2 border-tactical-canvas print:bg-slate-50'
                : 'bg-slate-100/75 hover:bg-sky-50/45 border-b-2 border-slate-200';

              const stickyBgClass = isEven
                ? isDark
                  ? 'bg-tactical-surface1 print:bg-white'
                  : 'bg-white'
                : isDark
                ? 'bg-tactical-surface2 print:bg-slate-50'
                : 'bg-slate-100';

              return (
                <tr
                  key={`${day.gregorian_date}-${worker.worker_id}`}
                  className={`transition-colors duration-150 print-row-avoid-break ${rowBgClass}`}
                >
                  {/* ستون ثابت نام کارگر */}
                  <td
                    className={`px-2.5 py-2 text-right font-bold sticky right-0 z-10 border-e border-s-[3px] align-middle print:static print:border-s ${borderHairline} ${stickyBgClass} ${textPrimary} ${
                      isEven
                        ? isDark
                          ? 'border-s-sky-400/50'
                          : 'border-s-sky-600/50'
                        : isDark
                        ? 'border-s-amber-400/50'
                        : 'border-s-amber-600/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 print:gap-1">
                      <span
                        className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 print:min-w-[14px] print:h-3.5 print:px-0.5 print:text-[7px] rounded-[2px] text-[10px] font-bold tabular-nums border shrink-0 ${
                          isDark
                            ? 'bg-tactical-canvas border-slate-400/20 text-slate-300 print:bg-slate-100 print:text-slate-800 print:border-slate-300'
                            : 'bg-white border-slate-900/15 text-slate-700'
                        }`}
                      >
                        {toPersianDigits(workerIndex)}
                      </span>
                      <span className="tracking-normal truncate max-w-[120px] print:max-w-none print:whitespace-nowrap" title={worker.worker_name}>
                        {worker.worker_name}
                      </span>

                      {worker.status === 'PRESENT' && onFetchSingleWorkerDayGps && (
                        <button
                          type="button"
                          disabled={isBulkGpsRunning || isRowGpsLoading}
                          onClick={() => onFetchSingleWorkerDayGps(worker.worker_id, day.gregorian_date)}
                          title="دریافت آمار مکانی این فرد در همین روز"
                          className={`ms-auto p-1 rounded-[2px] border transition-colors no-print ${
                            gps
                              ? isDark
                                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300'
                                : 'bg-emerald-50 border-emerald-600/35 text-emerald-700'
                              : isDark
                              ? 'bg-tactical-canvas border-slate-400/20 text-sky-400 hover:border-sky-400/50'
                              : 'bg-white border-slate-900/15 text-sky-700 hover:border-sky-600/50'
                          }`}
                        >
                          {isRowGpsLoading ? (
                            <ArrowPathIcon className="w-3 h-3 animate-spin" />
                          ) : (
                            <MapPinIcon className="w-3 h-3" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>

                  {/* وضعیت و عملیات پیامک */}
                  <td className={`px-2 py-2 border-e align-middle ${borderHairline}`}>
                    <div className="flex flex-wrap items-center justify-center gap-1.5 print:gap-0.5">
                      <StatusBadge status={isIncomplete ? 'خروج نخورده' : worker.status} />

                      {worker.status === 'ABSENT' && (
                        <>
                          <button
                            type="button"
                            onClick={() =>
                              handleSendAttendanceSms(worker.worker_id, day.gregorian_date)
                            }
                            disabled={isSending || isSmsAlreadySent}
                            title={
                              isSmsAlreadySent ? 'پیامک قبلاً ارسال شده است' : 'ارسال پیامک یادآوری'
                            }
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-[2px] border tracking-normal transition-colors no-print ${
                              isSmsAlreadySent
                                ? isDark
                                  ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300 cursor-not-allowed'
                                  : 'border-emerald-600/35 bg-emerald-50 text-emerald-800 cursor-not-allowed'
                                : isDark
                                ? 'border-red-500/45 bg-red-500/15 text-red-300 hover:bg-red-500/25 disabled:opacity-50'
                                : 'border-red-600/35 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-50'
                            }`}
                          >
                            {isSending ? (
                              <ArrowPathIcon className="w-3 h-3 animate-spin" />
                            ) : isSmsAlreadySent ? (
                              <CheckIcon className="w-3 h-3" />
                            ) : (
                              <PaperAirplaneIcon className="w-3 h-3" />
                            )}
                            <span>{isSmsAlreadySent ? 'ارسال شده' : 'پیامک'}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleToggleSmsLogs(worker.worker_id, day.gregorian_date)}
                            className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded-[2px] border tracking-normal transition-colors no-print ${
                              isDark
                                ? 'border-sky-400/40 bg-sky-400/10 text-sky-300 hover:bg-sky-400/20'
                                : 'border-sky-600/35 bg-sky-50 text-sky-800 hover:bg-sky-100'
                            }`}
                          >
                            <MagnifyingGlassIcon className="w-3 h-3" />
                            <span>پیگیری</span>
                          </button>
                        </>
                      )}
                    </div>

                    {worker.status === 'ABSENT' && isSmsOpen && (
                      <AttendanceSmsMiniList
                        logs={currentLogs}
                        isLoading={isSmsLogsLoading}
                        refreshingId={smsRefreshingId}
                        onRefresh={(logId) =>
                          handleRefreshAttendanceSms(logId, worker.worker_id, day.gregorian_date)
                        }
                      />
                    )}
                  </td>

                  {/* ستون‌های ورود ۱ / خروج ۱ ... */}
                  {Array.from({ length: maxAttCount }).map((_, idx) => {
                    const log = attendanceLogs[idx];
                    const nextDay = log?.time_in && log?.time_out && log.time_out < log.time_in;
                    const isLastCol = idx === maxAttCount - 1;

                    return (
                      <React.Fragment key={`d-att-c-${idx}`}>
                        <td
                          dir="ltr"
                          className={`px-2 py-2 border-e text-center align-middle tabular-nums whitespace-nowrap ${borderHairline}`}
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
                            <span className="block print:inline print:ms-0.5 text-[9px] print:text-[6.5px] text-sky-400 print:text-slate-700 mt-0.5 print:mt-0">
                              +{toPersianDigits(extraAttLogs.length)}
                            </span>
                          )}
                        </td>

                        <td
                          dir="ltr"
                          className={`px-2 py-2 border-e text-center align-middle tabular-nums whitespace-nowrap ${borderHairline}`}
                        >
                          {log?.time_out ? (
                            <span
                              className={`font-bold ${
                                isDark ? 'text-red-400 print:text-slate-900' : 'text-red-600'
                              }`}
                            >
                              {toPersianDigits(log.time_out)}
                              {nextDay && (
                                <span className="text-[9px] print:text-[6.5px] ms-0.5 text-amber-400 print:text-slate-700">(+۱)</span>
                              )}
                            </span>
                          ) : log?.time_in ? (
                            <span className="text-[10px] print:text-[7px] text-amber-400 print:text-slate-800 font-semibold">باز</span>
                          ) : (
                            <span className="opacity-30">-</span>
                          )}
                        </td>
                      </React.Fragment>
                    );
                  })}

                  {/* ستون‌های اضافه‌کار از / تا */}
                  {Array.from({ length: maxOtCount }).map((_, idx) => {
                    const ot = overtimeLogs[idx];
                    return (
                      <React.Fragment key={`d-ot-c-${idx}`}>
                        <td
                          dir="ltr"
                          className={`px-2 py-2 border-e text-center align-middle tabular-nums whitespace-nowrap ${borderHairline}`}
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
                          className={`px-2 py-2 border-e text-center align-middle tabular-nums whitespace-nowrap ${borderHairline}`}
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

                  {/* جمع اضافه‌کار (سیستم) */}
                  <td
                    dir="ltr"
                    className={`px-2 py-2 border-e text-center align-middle tabular-nums font-semibold whitespace-nowrap ${borderHairline} ${
                      worker.calculated_overtime > 0
                        ? isDark
                          ? 'text-purple-300 print:text-slate-900'
                          : 'text-purple-700'
                        : 'opacity-30'
                    }`}
                  >
                    {worker.calculated_overtime > 0
                      ? toPersianDigits(decimalHoursToHHMM(worker.calculated_overtime))
                      : '-'}
                  </td>

                  {/* تاییدشده اضافه‌کار */}
                  <td
                    dir="ltr"
                    className={`px-2 py-2 border-e text-center align-middle tabular-nums font-bold whitespace-nowrap ${borderHairline} ${
                      worker.overtime_hours > 0
                        ? isDark
                          ? 'text-emerald-300 bg-emerald-500/5 print:bg-transparent print:text-slate-900'
                          : 'text-emerald-800 bg-emerald-50/45 print:bg-transparent'
                        : 'opacity-30'
                    }`}
                  >
                    {worker.overtime_hours > 0
                      ? toPersianDigits(decimalHoursToHHMM(worker.overtime_hours))
                      : '-'}
                  </td>

                  {/* مراحل تأیید */}
                  <td className={`px-2 py-1.5 border-e align-middle ${borderHairline}`}>
                    <div className="flex flex-col gap-1 print:gap-0.5">
                      {overtimeLogs.length > 0 ? (
                        overtimeLogs.map((log) => {
                          const approvalRecord = overtimeApprovals.find(
                            (oa) => oa.overtime_id === log.id
                          );
                          return (
                            <ApprovalStepsMiniTable
                              key={log.id}
                              steps={approvalRecord ? approvalRecord.steps : []}
                            />
                          );
                        })
                      ) : (
                        <span className="text-[10px] text-center block opacity-30">-</span>
                      )}
                    </div>
                  </td>

                  {/* کارکرد (کل / شب / جمعه) */}
                  <td
                    className={`px-2 py-2 text-center align-middle border-e-2 print:border-e ${
                      isDark ? 'border-slate-400/30' : 'border-slate-900/25'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-center gap-1 print:gap-0.5">
                      <div
                        className={`text-[11px] print:text-[7.5px] px-1.5 py-0.5 print:px-1 print:py-0 rounded-[2px] border print:border-0 inline-flex items-center gap-1 print:gap-0.5 ${
                          isDark
                            ? 'bg-tactical-canvas text-slate-100 border-slate-400/20 print:bg-transparent print:text-slate-900'
                            : 'bg-white text-slate-900 border-slate-900/15 print:bg-transparent'
                        }`}
                      >
                        <span className={`text-[9.5px] print:text-[7px] ${textSecondary}`}>کل:</span>
                        <span dir="ltr" className="font-bold tabular-nums">
                          {toPersianDigits(decimalHoursToHHMM(worker.hours_worked))}
                        </span>
                      </div>

                      {worker.night_hours > 0 && (
                        <div
                          className={`text-[9.5px] print:text-[7px] px-1.5 py-0.5 print:px-1 print:py-0 rounded-[2px] border print:border-0 inline-flex items-center gap-1 print:gap-0.5 ${
                            isDark
                              ? 'bg-indigo-500/15 text-indigo-300 border-indigo-400/35 print:bg-transparent print:text-slate-800'
                              : 'bg-indigo-50 text-indigo-800 border-indigo-600/30 print:bg-transparent'
                          }`}
                        >
                          شب:
                          <span dir="ltr" className="font-bold tabular-nums">
                            {toPersianDigits(decimalHoursToHHMM(worker.night_hours))}
                          </span>
                        </div>
                      )}

                      {worker.friday_hours > 0 && (
                        <div
                          className={`text-[9.5px] print:text-[7px] px-1.5 py-0.5 print:px-1 print:py-0 rounded-[2px] border print:border-0 inline-flex items-center gap-1 print:gap-0.5 ${
                            isDark
                              ? 'bg-rose-500/15 text-rose-300 border-rose-400/35 print:bg-transparent print:text-slate-800'
                              : 'bg-rose-50 text-rose-800 border-rose-600/30 print:bg-transparent'
                          }`}
                        >
                          جمعه:
                          <span dir="ltr" className="font-bold tabular-nums">
                            {toPersianDigits(decimalHoursToHHMM(worker.friday_hours))}
                          </span>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* ۶ ستون آمار موقعیت مکانی همان روز */}
                  <td className={`px-2 py-2 text-center align-middle tabular-nums border-e whitespace-nowrap ${borderHairline}`}>
                    {isRowGpsLoading ? (
                      <span className="text-[10px] text-sky-400">...</span>
                    ) : gps && gps.total_logs > 0 ? (
                      <span className={`font-bold ${isDark ? 'text-sky-300 print:text-slate-900' : 'text-sky-800'}`}>
                        {toPersianDigits(gps.distance_kilometers)}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>

                  <td className={`px-2 py-2 text-center align-middle tabular-nums border-e whitespace-nowrap ${borderHairline}`}>
                    {gps && gps.total_logs > 0 ? (
                      <span className={`font-semibold ${textPrimary}`}>
                        {toPersianDigits(gps.total_logs)}
                      </span>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>

                  <td className={`px-2 py-2 text-center align-middle tabular-nums border-e whitespace-nowrap ${borderHairline}`}>
                    {gps && gps.total_logs > 0 ? (
                      <div className="leading-tight print:flex print:items-center print:justify-center print:gap-0.5">
                        <div className={`font-bold ${isDark ? 'text-emerald-400 print:text-slate-900' : 'text-emerald-700'}`}>
                          {toPersianDigits(gps.chart_data?.inside_project_percent ?? 0)}٪
                        </div>
                        <div className={`text-[9px] print:text-[6.5px] ${textSecondary}`}>
                          ({toPersianDigits(gps.raw_counts?.inside ?? 0)})
                        </div>
                      </div>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>

                  <td className={`px-2 py-2 text-center align-middle tabular-nums border-e whitespace-nowrap ${borderHairline}`}>
                    {gps && gps.total_logs > 0 ? (
                      <div className="leading-tight print:flex print:items-center print:justify-center print:gap-0.5">
                        <div className={`font-bold ${isDark ? 'text-amber-400 print:text-slate-900' : 'text-amber-700'}`}>
                          {toPersianDigits(gps.chart_data?.outside_project_percent ?? 0)}٪
                        </div>
                        <div className={`text-[9px] print:text-[6.5px] ${textSecondary}`}>
                          ({toPersianDigits(gps.raw_counts?.outside ?? 0)})
                        </div>
                      </div>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>

                  <td className={`px-2 py-2 text-center align-middle tabular-nums border-e whitespace-nowrap ${borderHairline}`}>
                    {gps && gps.total_logs > 0 ? (
                      <div className="leading-tight print:flex print:items-center print:justify-center print:gap-0.5">
                        <div className={`font-bold ${isDark ? 'text-red-400 print:text-slate-900' : 'text-red-700'}`}>
                          {toPersianDigits(gps.chart_data?.gps_off_percent ?? 0)}٪
                        </div>
                        <div className={`text-[9px] print:text-[6.5px] ${textSecondary}`}>
                          ({toPersianDigits(gps.raw_counts?.off ?? 0)})
                        </div>
                      </div>
                    ) : (
                      <span className="opacity-30">-</span>
                    )}
                  </td>

                  <td className="px-2 py-1.5 text-center align-middle">
                    <DailyGpsMiniDonut stats={gps} isDark={isDark} />
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

export default TimesheetByDay;