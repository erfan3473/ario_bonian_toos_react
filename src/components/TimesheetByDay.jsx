import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FaPaperPlane, FaSpinner, FaSearch } from 'react-icons/fa';
import { decimalHoursToHHMM } from '../utils/dateUtils';
import {
  sendAttendanceSms,
  refreshAttendanceSmsStatus,
  fetchAttendanceSmsLogs,
} from '../features/attendance/attendanceSlice';

/* ==========================================
   وضعیت‌ها و برچسب‌های رنگی
   ========================================== */
const STATUS_MAP = {
  PRESENT: { label: 'حاضر', color: 'text-green-700 bg-green-50 border-green-200' },
  ABSENT: { label: 'غایب', color: 'text-red-700 bg-red-50 border-red-200' },
  LEAVE: { label: 'مرخصی', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  APPROVED: { label: 'تایید شده', color: 'text-green-700 bg-green-100 border-green-300' },
  PENDING: { label: 'در انتظار', color: 'text-yellow-700 bg-yellow-100 border-yellow-300' },
  REJECTED: { label: 'رد شده', color: 'text-red-700 bg-red-200 border-red-400' },
  RETURNED: { label: 'برگشتی', color: 'text-purple-700 bg-purple-100 border-purple-300' },
  SKIPPED: { label: 'رد مرحله', color: 'text-gray-500 bg-gray-100 border-gray-300' },
  NO_CONTRACT: { label: 'بدون قرارداد', color: 'text-slate-600 bg-slate-100 border-slate-300' },
};

const getStatusInfo = (status) =>
  STATUS_MAP[status] || {
    label: status || 'نامشخص',
    color: 'text-gray-600 bg-gray-100 border-gray-300',
  };

const StatusBadge = ({ status }) => {
  const { label, color } = getStatusInfo(status);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
      {label}
    </span>
  );
};

/* ==========================================
   لاگ پیامک حضور
   ========================================== */
const AttendanceSmsMiniList = ({ logs = [], onRefresh, refreshingId, isLoading }) => {
  if (isLoading) {
    return (
      <div className="text-[10px] text-blue-500 mt-1 flex items-center justify-center gap-1">
        <FaSpinner className="animate-spin" size={9} />
        در حال دریافت لاگ...
      </div>
    );
  }

  if (!logs.length) {
    return <div className="text-[10px] text-gray-400 mt-1">لاگی ثبت نشده</div>;
  }

  return (
    <div className="flex flex-col gap-1 mt-1 items-center">
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
            ? 'text-green-600'
            : log.delivery_status === 'FAILED'
            ? 'text-red-600'
            : log.delivery_status === 'SENT'
            ? 'text-yellow-600'
            : 'text-gray-500';

        const canRefresh = !['DELIVERED', 'FAILED'].includes(log.delivery_status);

        return (
          <div
            key={log.id}
            className="flex items-center gap-1.5 text-[10px] bg-white border border-gray-200 rounded px-2 py-1"
          >
            <span className={`font-semibold ${statusColor}`}>{statusLabel}</span>

            {canRefresh && (
              <button
                onClick={() => onRefresh(log.id)}
                disabled={refreshingId === log.id}
                className="flex items-center gap-1 px-1.5 py-0.5 rounded border border-gray-300 bg-white hover:bg-gray-100 disabled:opacity-50"
              >
                {refreshingId === log.id ? (
                  <FaSpinner className="animate-spin" size={9} />
                ) : (
                  <FaSearch size={9} />
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ==========================================
   کامپوننت جدول مراحل تأیید
   ========================================== */
const ApprovalStepsMiniTable = ({ steps }) => {
  if (!steps || steps.length === 0) {
    return <span className="text-gray-400 text-xs">-</span>;
  }

  return (
    <table className="min-w-[200px] text-xs border border-gray-200 rounded overflow-hidden shadow-sm">
      <thead>
        <tr className="bg-gray-50/75">
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">مرحله</th>
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">وضعیت</th>
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">تأییدکننده</th>
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">سمت</th>
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">یادداشت</th>
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">دقیقه قبل</th>
          <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">دقیقه بعد</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step, idx) => (
          <tr key={idx} className="border-t border-gray-150 even:bg-gray-50/50">
            <td className="px-2 py-1.5 text-center text-gray-700 font-mono">{step.step_order}</td>
            <td className="px-2 py-1.5 text-center">
              <StatusBadge status={step.status} />
            </td>
            <td className="px-2 py-1.5 text-center text-gray-700 whitespace-nowrap">
              {step.approver_name || '---'}
            </td>
            <td className="px-2 py-1.5 text-center text-gray-700 whitespace-nowrap">
              {step.approver_position || '---'}
            </td>
            <td
              className="px-2 py-1.5 text-center text-gray-700 max-w-[100px] truncate"
              title={step.note}
            >
              {step.note || '---'}
            </td>
            <td className="px-2 py-1.5 text-center text-gray-700 font-mono">
              {step.approved_minutes_before ?? 0}
            </td>
            <td className="px-2 py-1.5 text-center text-gray-700 font-mono">
              {step.approved_minutes_after ?? 0}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

/* ==========================================
   کامپوننت اصلی
   ========================================== */
const TimesheetByDay = ({ meta, byDay }) => {
  const dispatch = useDispatch();
  const smsSendingKey = useSelector((s) => s.attendance.smsSendingKey);
  const smsRefreshingId = useSelector((s) => s.attendance.smsRefreshingId);
  const smsLogsByKey = useSelector((s) => s.attendance.smsLogsByKey || {});
  const smsLogsLoadingKey = useSelector((s) => s.attendance.smsLogsLoadingKey);

  const [openedSmsKey, setOpenedSmsKey] = useState({});

  if (!meta?.days?.length) {
    return (
      <div className="mt-6 p-6 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
        <p className="text-gray-400">📭 داده‌ای برای نمایش وجود ندارد</p>
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
    dispatch(
      refreshAttendanceSmsStatus({
        log_id: logId,
        worker_id: workerId,
        date: dateStr,
      })
    );
  };

  const rows = [];
  meta.days.forEach((day, dayIndex) => {
    const dayKey = day.gregorian_date;
    const dayData = byDay[dayKey] || { workers: [] };
    const workers = dayData.workers;

    if (workers.length === 0) {
      rows.push({
        day,
        dayIndex,
        worker: null,
        isFirstOfDay: true,
        totalWorkers: 1,
      });
    } else {
      workers.forEach((worker, wi) => {
        rows.push({
          day,
          dayIndex,
          worker,
          isFirstOfDay: wi === 0,
          totalWorkers: workers.length,
        });
      });
    }
  });

  return (
    <div className="mt-6 overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-slate-100 border-b-2 border-gray-300 text-slate-700">
            <th className="px-3 py-2.5 text-right font-extrabold min-w-[100px] bg-white text-black border-l border-gray-200">روز</th>
            <th className="px-3 py-2.5 text-center font-extrabold min-w-[80px] bg-white text-black border-l border-gray-200">هفته</th>
            <th className="px-3 py-2.5 text-center font-semibold min-w-[95px] border-l border-gray-250">نوع روز</th>
            <th className="px-3 py-2.5 text-right font-semibold min-w-[150px] border-l border-gray-250">نام کارگر</th>
            <th className="px-3 py-2.5 text-center font-semibold min-w-[170px] border-l border-gray-250">وضعیت / پیامک حضور</th>
            <th className="px-3 py-2.5 text-center font-semibold min-w-[170px] border-l border-gray-250">حضور (خروج / ورود)</th>
            <th className="px-3 py-2.5 text-center font-semibold min-w-[210px] border-l border-gray-250">اضافه‌کاری (تا / از / ساعت تأییدشده)</th>
            <th className="px-3 py-2.5 text-center font-semibold min-w-[260px] border-l border-gray-250">مراحل تأیید اضافه‌کاری</th>
            <th className="px-3 py-2.5 text-center font-semibold min-w-[130px]">سایر (شب/جمعه/کل)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => {
            const { day, dayIndex, worker, isFirstOfDay, totalWorkers } = row;

            const dayBg = dayIndex % 2 === 0 ? 'bg-white' : 'bg-sky-50/60';
            const dayDivider =
              isFirstOfDay && dayIndex > 0 ? 'border-t-[3px] border-t-slate-300' : '';

            if (!worker) {
              return (
                <tr key={`nodata-${rowIdx}`} className={`${dayBg} ${dayDivider}`}>
                  <td colSpan={9} className="px-3 py-2.5 text-center text-gray-400 italic">
                    برای این روز هیچ کارگری ثبت نشده است
                  </td>
                </tr>
              );
            }

            const attendanceLogs = worker.attendance_logs || [];
            const overtimeLogs = worker.overtime_logs || [];
            const overtimeApprovals = worker.overtime_approvals || [];

            const firstAtt = attendanceLogs[0];
            const isIncomplete = firstAtt?.time_in && !firstAtt?.time_out;

            const smsKey = `${worker.worker_id}-${day.gregorian_date}`;
            const smsLogs = smsLogsByKey[smsKey] || [];
            const isSmsOpen = !!openedSmsKey[smsKey];
            const isSmsLogsLoading = smsLogsLoadingKey === smsKey;

            return (
              <tr
                key={`${day.gregorian_date}-${worker.worker_id}`}
                className={`${dayBg} ${dayDivider} hover:bg-slate-100/50 transition-colors duration-150`}
              >
                {isFirstOfDay && (
                  <>
                    <td rowSpan={totalWorkers} className="px-3 py-2.5 text-right border-l border-gray-200 bg-inherit text-black align-middle">
                      <div className="font-extrabold text-lg text-slate-900">{day.day}</div>
                      <div className="text-gray-400 text-xs mt-0.5 font-medium">{day.month} / {day.year}</div>
                    </td>
                    <td rowSpan={totalWorkers} className="px-3 py-2.5 text-center border-l border-gray-200 bg-inherit text-slate-800 font-bold align-middle">
                      {day.weekday_name || '-'}
                    </td>
                    <td rowSpan={totalWorkers} className="px-3 py-2.5 text-center border-l border-gray-200 align-middle">
                      <span
                        className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border
                        ${
                          day.is_official_holiday
                            ? 'bg-red-50 text-red-700 border-red-200'
                            : day.is_friday
                            ? 'bg-orange-50 text-orange-700 border-orange-200'
                            : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}
                      >
                        {day.is_official_holiday
                          ? day.holiday_title || 'تعطیل رسمی'
                          : day.is_friday
                          ? 'جمعه'
                          : 'عادی'}
                      </span>
                    </td>
                  </>
                )}

                <td className="px-3 py-2.5 text-right font-semibold text-black border-l border-gray-200">
                  {worker.worker_name}
                </td>

                <td className="px-3 py-2.5 text-center border-l border-gray-200">
                  <StatusBadge status={isIncomplete ? 'خروج نخورده' : worker.status} />

                  {worker.status === 'ABSENT' && (
                    <div className="mt-1.5 flex flex-col items-center gap-1">
                      <button
                        onClick={() => handleSendAttendanceSms(worker.worker_id, day.gregorian_date)}
                        disabled={smsSendingKey === smsKey}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg border border-red-300 bg-red-50 text-red-600 hover:bg-red-100 disabled:opacity-50"
                      >
                        {smsSendingKey === smsKey ? (
                          <FaSpinner className="animate-spin" size={9} />
                        ) : (
                          <FaPaperPlane size={9} />
                        )}
                        ارسال پیامک
                      </button>

                      <button
                        onClick={() => handleToggleSmsLogs(worker.worker_id, day.gregorian_date)}
                        className="flex items-center gap-1 px-2 py-1 text-[10px] rounded-lg border border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <FaSearch size={9} />
                        پیگیری لاگ
                      </button>

                      {isSmsOpen && (
                        <AttendanceSmsMiniList
                          logs={smsLogs}
                          isLoading={isSmsLogsLoading}
                          refreshingId={smsRefreshingId}
                          onRefresh={(logId) =>
                            handleRefreshAttendanceSms(logId, worker.worker_id, day.gregorian_date)
                          }
                        />
                      )}
                    </div>
                  )}
                </td>

                <td className="px-3 py-2.5 border-l border-gray-200">
                  {attendanceLogs.length === 0 ? (
                    <span className="text-gray-400 text-xs">بدون تردد</span>
                  ) : (
                    <div className="flex flex-col gap-1 justify-center items-center">
                      {attendanceLogs.map((log, i) => {
                        const nextDay =
                          log.time_in && log.time_out && log.time_out < log.time_in;
                        return (
                          <div key={log.id || i} className="flex items-center gap-1.5 text-xs">
                            <span className="font-mono font-bold text-red-600">
                              {log.time_out || '--:--'}
                            </span>
                            <span className="text-gray-400">→</span>
                            <span className="font-mono font-bold text-green-700">
                              {log.time_in || '--:--'}
                            </span>
                            {nextDay && (
                              <span className="text-red-400 font-bold text-[10px]">(+۱)</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>

                <td className="px-3 py-2.5 border-l border-gray-200 text-center">
                  {overtimeLogs.length === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <div className="flex flex-col gap-1.5 items-center">
                      {overtimeLogs.map((otLog, i) => (
                        <div key={otLog.id || i} className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono font-bold text-purple-600">
                            {otLog.time_out || '--:--'}
                          </span>
                          <span className="text-gray-400">→</span>
                          <span className="font-mono font-bold text-blue-600">
                            {otLog.time_in || '--:--'}
                          </span>
                        </div>
                      ))}
                      <div className="font-mono font-bold text-amber-600 text-sm mt-0.5 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {decimalHoursToHHMM(worker.overtime_hours)}
                      </div>
                    </div>
                  )}
                </td>

                <td className="px-3 py-2.5 border-l border-gray-200">
                  <div className="flex flex-col gap-2">
                    {overtimeLogs.length > 0 ? (
                      overtimeLogs.map((log) => {
                        const approvalRecord = overtimeApprovals.find(
                          (oa) => oa.overtime_id === log.id
                        );
                        const steps = approvalRecord ? approvalRecord.steps : [];
                        return <ApprovalStepsMiniTable key={log.id} steps={steps} />;
                      })
                    ) : (
                      <span className="text-gray-400 text-xs text-center block">-</span>
                    )}
                  </div>
                </td>

                <td className="px-3 py-2.5 text-center">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1">
                    {worker.night_hours > 0 && (
                      <div className="text-center">
                        <div className="font-mono font-bold text-indigo-600">
                          {decimalHoursToHHMM(worker.night_hours)}
                        </div>
                        <div className="text-[10px] text-gray-500">شب</div>
                      </div>
                    )}

                    {worker.friday_hours > 0 && (
                      <div className="text-center">
                        <div className="font-mono font-bold text-rose-600">
                          {decimalHoursToHHMM(worker.friday_hours)}
                        </div>
                        <div className="text-[10px] text-gray-500">جمعه</div>
                      </div>
                    )}

                    <div className="text-center col-span-2 mt-1.5 pt-1.5 border-t border-gray-200">
                      <div className="font-mono font-extrabold text-lg text-slate-800">
                        {decimalHoursToHHMM(worker.hours_worked)}
                      </div>
                      <div className="text-[10px] text-gray-500 font-medium">کل کارکرد</div>
                    </div>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default TimesheetByDay;