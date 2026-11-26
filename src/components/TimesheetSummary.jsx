// src/components/TimesheetSummary.jsx
import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowPathIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { decimalHoursToHHMM } from '../utils/dateUtils';
import { fetchWorkerLocationStats } from '../features/attendance/attendanceSlice';
import { aggregateWorkerDailyLocation } from '../utils/timesheetExcelExport';

const toPersianDigits = (value) =>
  String(value ?? '').replace(/\d/g, (digit) => '۰۱۲۳۴۵۶۷۸۹'[Number(digit)]);

const GpsMiniDonut = ({ stats, isDark }) => {
  if (!stats || stats.total_logs === 0) {
    return (
      <span className={`text-[10px] print:text-[7px] tracking-normal ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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
      className="relative w-10 h-10 rounded-full mx-auto shrink-0 print:w-3.5 print:h-3.5"
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
        className={`absolute inset-[4px] rounded-full flex items-center justify-center print:hidden ${
          isDark ? 'bg-tactical-surface1' : 'bg-white'
        }`}
      >
        <span
          className={`text-[9px] font-bold tabular-nums leading-none ${
            isDark ? 'text-slate-100' : 'text-slate-900'
          }`}
        >
          {toPersianDigits(Math.round(inside))}٪
        </span>
      </div>
    </div>
  );
};

const TimesheetSummary = ({ meta, workers, byWorker, loading }) => {
  const dispatch = useDispatch();
  const mode = useSelector((s) => s.theme?.mode || 'dark');
  const isDark = mode === 'dark';

  const {
    filters,
    dailyLocationStats = {},
    locationStatsByWorker = {},
    locationStatsLoadingByWorker = {},
  } = useSelector((state) => state.attendance);

  const days = meta?.days || [];

  const aggregatedGpsByWorker = useMemo(() => {
    const result = {};
    (workers || []).forEach((w) => {
      const wid = String(w.worker_id);
      result[wid] = aggregateWorkerDailyLocation(
        w.worker_id,
        days,
        dailyLocationStats,
        locationStatsByWorker[wid] || null
      );
    });
    return result;
  }, [workers, days, dailyLocationStats, locationStatsByWorker]);

  if (loading || !meta || !workers || workers.length === 0) {
    return null;
  }

  const handleLoadSingleGps = (workerId) => {
    dispatch(
      fetchWorkerLocationStats({
        worker_id: workerId,
        start_date: filters.start_date || meta.start_date,
        end_date: filters.end_date || meta.end_date,
        project_id: filters.projectId || null,
      })
    );
  };

  const totals = workers.reduce(
    (acc, w) => {
      const s = byWorker[w.worker_id]?.summary || {};
      acc.present += s.total_present_days || 0;
      acc.hours += s.total_hours || 0;
      acc.night += s.total_night_hours || 0;
      acc.friday += s.total_friday_hours || 0;
      acc.calcOt += s.total_calculated_overtime || 0;
      acc.approvedOt += s.total_overtime_hours || 0;
      return acc;
    },
    { present: 0, hours: 0, night: 0, friday: 0, calcOt: 0, approvedOt: 0 }
  );

  const borderHairline = isDark ? 'border-slate-400/15' : 'border-slate-900/15';
  const textPrimary = isDark ? 'text-slate-100 print:text-slate-900' : 'text-slate-900';
  const textSecondary = isDark ? 'text-slate-400 print:text-slate-600' : 'text-slate-600';

  return (
    <div className="mt-6 space-y-2.5 print:mt-2 print:space-y-1">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className={`w-1.5 h-4 rounded-[1px] print:hidden ${isDark ? 'bg-amber-400' : 'bg-amber-600'}`} />
          <h3 className={`text-sm font-bold tracking-normal print:text-[9px] ${textPrimary}`}>
            خلاصه کارنامه کل پرسنل در بازه انتخابی
          </h3>
          <span
            className={`text-[11px] font-semibold px-2 py-0.5 rounded-[2px] border tabular-nums tracking-normal print:text-[8px] print:py-0 ${
              isDark
                ? 'bg-tactical-surface2 border-slate-400/20 text-amber-300 print:bg-white print:text-slate-900 print:border-slate-300'
                : 'bg-white border-slate-900/15 text-amber-800'
            }`}
          >
            تعداد پرسنل: {toPersianDigits(workers.length)} نفر
          </span>
        </div>
        <span className={`text-[10px] tracking-normal no-print ${textSecondary}`}>
          آمار مکانی این جدول به‌صورت خودکار از مجموع روزهای محاسبه‌شده بالا به‌روزرسانی می‌شود
        </span>
      </div>

      <div
        className={`border rounded-[2px] overflow-hidden ${
          isDark
            ? 'bg-tactical-surface1 border-slate-400/20 print:bg-white print:border-slate-400'
            : 'bg-white border-slate-900/20'
        }`}
      >
        <div className="overflow-x-auto print:overflow-visible">
          <table className="print-compact-table min-w-full text-[11px] whitespace-nowrap border-collapse">
            <thead
              className={`border-b-2 tracking-normal ${
                isDark
                  ? 'bg-tactical-surface2 text-slate-200 border-slate-400/25 print:bg-slate-200 print:text-slate-900'
                  : 'bg-tactical-lightElevated text-slate-800 border-slate-900/20'
              }`}
            >
              <tr>
                <th
                  className={`px-2.5 py-2.5 text-right font-bold sticky right-0 z-20 border-e print:static ${
                    isDark
                      ? 'bg-tactical-surface2 border-slate-400/20 print:bg-slate-200'
                      : 'bg-tactical-lightElevated border-slate-900/15'
                  }`}
                >
                  ردیف و نام پرسنل
                </th>
                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  حضور
                  <br />
                  (روز)
                </th>
                <th
                  className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline} ${
                    isDark ? 'text-sky-300 print:text-slate-900' : 'text-sky-800'
                  }`}
                >
                  مجموع
                  <br />
                  کارکرد
                </th>
                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  میانگین
                  <br />
                  روزانه
                </th>
                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  شب‌کاری
                </th>
                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  جمعه‌کاری
                </th>
                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  اضافه‌کار
                  <br />
                  (سیستم)
                </th>
                <th
                  className={`px-2 py-2.5 text-center font-bold border-e-2 print:border-e ${
                    isDark
                      ? 'border-slate-400/30 text-emerald-300 print:text-slate-900'
                      : 'border-slate-900/25 text-emerald-800'
                  }`}
                >
                  اضافه‌کار
                  <br />
                  (تایید شده)
                </th>

                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  مسافت
                  <br />
                  (کیلومتر)
                </th>
                <th className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline}`}>
                  تعداد
                  <br />
                  نقاط
                </th>
                <th
                  className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline} ${
                    isDark ? 'text-emerald-400 print:text-slate-900' : 'text-emerald-700'
                  }`}
                >
                  داخل
                  <br />
                  محدوده
                </th>
                <th
                  className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline} ${
                    isDark ? 'text-amber-400 print:text-slate-900' : 'text-amber-700'
                  }`}
                >
                  خارج
                  <br />
                  محدوده
                </th>
                <th
                  className={`px-2 py-2.5 text-center font-bold border-e ${borderHairline} ${
                    isDark ? 'text-red-400 print:text-slate-900' : 'text-red-700'
                  }`}
                >
                  خاموش /
                  <br />
                  خطا
                </th>
                <th className="px-2.5 py-2.5 text-center font-bold">
                  نمودار
                  <br />
                  مکانی
                </th>
              </tr>
            </thead>

            <tbody>
              {workers.map((worker, index) => {
                const wData = byWorker[worker.worker_id];
                if (!wData || !wData.summary) return null;

                const summary = wData.summary;
                const presentDays = summary.total_present_days || 0;
                const hours = summary.total_hours || 0;
                const averageHours = presentDays > 0 ? hours / presentDays : 0;
                const night = summary.total_night_hours || 0;
                const friday = summary.total_friday_hours || 0;
                const calcOvertime = summary.total_calculated_overtime || 0;
                const approvedOvertime = summary.total_overtime_hours || 0;

                const wid = String(worker.worker_id);
                const gps = aggregatedGpsByWorker[wid];
                const isSingleLoading = Boolean(locationStatsLoadingByWorker[wid]);
                const isEven = index % 2 === 0;

                const rowBg = isEven
                  ? isDark
                    ? 'bg-tactical-surface1 hover:bg-tactical-hover border-b-2 border-tactical-canvas print:bg-white'
                    : 'bg-white hover:bg-sky-50/45 border-b-2 border-slate-200'
                  : isDark
                  ? 'bg-tactical-surface2/80 hover:bg-tactical-hover border-b-2 border-tactical-canvas print:bg-slate-50'
                  : 'bg-slate-100/75 hover:bg-sky-50/45 border-b-2 border-slate-200';

                const stickyBg = isEven
                  ? isDark
                    ? 'bg-tactical-surface1 print:bg-white'
                    : 'bg-white'
                  : isDark
                  ? 'bg-tactical-surface2 print:bg-slate-50'
                  : 'bg-slate-100';

                return (
                  <tr
                    key={worker.worker_id}
                    className={`transition-colors duration-150 print-row-avoid-break ${rowBg}`}
                  >
                    <td
                      className={`px-2.5 py-2 sticky right-0 z-10 border-e border-s-[3px] align-middle print:static print:border-s ${borderHairline} ${stickyBg} ${
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
                          className={`inline-flex items-center justify-center min-w-[20px] h-5 px-1 print:min-w-[14px] print:h-3.5 print:px-0.5 print:text-[7px] rounded-[2px] text-[10px] font-bold tabular-nums shrink-0 ${
                            isDark
                              ? 'bg-tactical-canvas text-slate-300 border border-slate-400/20 print:bg-slate-100 print:text-slate-800 print:border-slate-300'
                              : 'bg-white text-slate-700 border border-slate-900/15'
                          }`}
                        >
                          {toPersianDigits(index + 1)}
                        </span>
                        <div className="leading-tight min-w-0 print:flex print:items-center print:gap-1">
                          <div className={`font-bold text-xs print:text-[7.5px] tracking-normal ${textPrimary}`}>
                            {worker.worker_name}
                          </div>
                          <div className={`text-[10px] tabular-nums mt-0.5 print:mt-0 print:text-[6.5px] ${textSecondary}`}>
                            <span className="no-print">کد: </span>
                            ({toPersianDigits(worker.worker_code || '-')})
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadSingleGps(worker.worker_id)}
                          disabled={isSingleLoading}
                          title="دریافت آمار مکانی تجمیعی همین فرد"
                          className={`ms-auto p-1 rounded-[2px] border transition-colors no-print ${
                            gps
                              ? isDark
                                ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-300 hover:bg-emerald-500/25'
                                : 'bg-emerald-50 border-emerald-600/35 text-emerald-700 hover:bg-emerald-100'
                              : isDark
                              ? 'bg-tactical-canvas border-slate-400/20 text-sky-400 hover:border-sky-400/50'
                              : 'bg-white border-slate-900/15 text-sky-700 hover:border-sky-600/50'
                          }`}
                        >
                          {isSingleLoading ? (
                            <ArrowPathIcon className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <MapPinIcon className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    <td className={`px-2 py-2 text-center border-e tabular-nums font-bold ${borderHairline} ${textPrimary}`}>
                      {toPersianDigits(presentDays)}
                    </td>

                    <td
                      dir="ltr"
                      className={`px-2 py-2 text-center font-bold tabular-nums border-e ${borderHairline} ${
                        isDark ? 'text-sky-300 bg-sky-400/5 print:bg-transparent print:text-slate-900' : 'text-sky-800 bg-sky-50/50 print:bg-transparent'
                      }`}
                    >
                      {toPersianDigits(decimalHoursToHHMM(hours))}
                    </td>

                    <td dir="ltr" className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                      {averageHours > 0 ? (
                        <span className={`font-semibold ${isDark ? 'text-teal-300 print:text-slate-900' : 'text-teal-700'}`}>
                          {toPersianDigits(decimalHoursToHHMM(averageHours))}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td dir="ltr" className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                      {night > 0 ? (
                        <span className={`font-semibold ${isDark ? 'text-indigo-300 print:text-slate-900' : 'text-indigo-700'}`}>
                          {toPersianDigits(decimalHoursToHHMM(night))}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td dir="ltr" className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                      {friday > 0 ? (
                        <span className={`font-semibold ${isDark ? 'text-rose-300 print:text-slate-900' : 'text-rose-700'}`}>
                          {toPersianDigits(decimalHoursToHHMM(friday))}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td dir="ltr" className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                      {calcOvertime > 0 ? (
                        <span className={`font-semibold ${isDark ? 'text-purple-300 print:text-slate-900' : 'text-purple-700'}`}>
                          {toPersianDigits(decimalHoursToHHMM(calcOvertime))}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td
                      dir="ltr"
                      className={`px-2 py-2 text-center tabular-nums border-e-2 print:border-e ${
                        isDark
                          ? 'border-slate-400/30 bg-emerald-500/5 print:bg-transparent'
                          : 'border-slate-900/25 bg-emerald-50/45 print:bg-transparent'
                      }`}
                    >
                      {approvedOvertime > 0 ? (
                        <span className={`font-bold ${isDark ? 'text-emerald-300 print:text-slate-900' : 'text-emerald-700'}`}>
                          {toPersianDigits(decimalHoursToHHMM(approvedOvertime))}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    {/* ۶ ستون آمار مکانی تجمیعی */}
                    <td className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                      {isSingleLoading ? (
                        <span className="text-[10px] text-sky-400">...</span>
                      ) : gps ? (
                        <span className={`font-bold ${isDark ? 'text-sky-300 print:text-slate-900' : 'text-sky-800'}`}>
                          {toPersianDigits(gps.distance_kilometers)}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
                      {gps ? (
                        <span className={`font-semibold ${textPrimary}`}>
                          {toPersianDigits(gps.total_logs)}
                        </span>
                      ) : (
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
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
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
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
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td className={`px-2 py-2 text-center tabular-nums border-e ${borderHairline}`}>
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
                        <span className="opacity-35">-</span>
                      )}
                    </td>

                    <td className="px-2 py-1.5 text-center align-middle">
                      <GpsMiniDonut stats={gps} isDark={isDark} />
                    </td>
                  </tr>
                );
              })}
            </tbody>

            <tfoot>
              <tr
                className={`border-t-2 font-bold tracking-normal ${
                  isDark
                    ? 'bg-tactical-surface2 border-sky-400/35 text-slate-100 print:bg-slate-200 print:text-slate-900'
                    : 'bg-tactical-lightElevated border-sky-600/35 text-slate-900'
                }`}
              >
                <td
                  className={`px-3 py-2.5 text-right sticky right-0 z-10 border-e print:static ${
                    isDark
                      ? 'bg-tactical-surface2 border-slate-400/20 print:bg-slate-200'
                      : 'bg-tactical-lightElevated border-slate-900/15'
                  }`}
                >
                  جمع کل ({toPersianDigits(workers.length)} نفر)
                </td>
                <td className={`px-2 py-2.5 text-center tabular-nums border-e ${borderHairline}`}>
                  {toPersianDigits(totals.present)}
                </td>
                <td dir="ltr" className={`px-2 py-2.5 text-center tabular-nums border-e ${borderHairline}`}>
                  {toPersianDigits(decimalHoursToHHMM(totals.hours))}
                </td>
                <td dir="ltr" className={`px-2 py-2.5 text-center tabular-nums border-e ${borderHairline}`}>
                  {totals.present > 0 ? toPersianDigits(decimalHoursToHHMM(totals.hours / totals.present)) : '-'}
                </td>
                <td dir="ltr" className={`px-2 py-2.5 text-center tabular-nums border-e ${borderHairline}`}>
                  {toPersianDigits(decimalHoursToHHMM(totals.night))}
                </td>
                <td dir="ltr" className={`px-2 py-2.5 text-center tabular-nums border-e ${borderHairline}`}>
                  {toPersianDigits(decimalHoursToHHMM(totals.friday))}
                </td>
                <td dir="ltr" className={`px-2 py-2.5 text-center tabular-nums border-e ${borderHairline}`}>
                  {toPersianDigits(decimalHoursToHHMM(totals.calcOt))}
                </td>
                <td
                  dir="ltr"
                  className={`px-2 py-2.5 text-center tabular-nums border-e-2 print:border-e ${
                    isDark ? 'border-slate-400/30' : 'border-slate-900/25'
                  }`}
                >
                  {toPersianDigits(decimalHoursToHHMM(totals.approvedOt))}
                </td>
                <td colSpan={6} className={`px-3 py-2.5 text-center text-[10px] print:text-[7px] font-medium ${textSecondary}`}>
                  سبز: داخل محدوده | کهربایی: خارج محدوده | قرمز: خاموش یا بدون مجوز
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TimesheetSummary;