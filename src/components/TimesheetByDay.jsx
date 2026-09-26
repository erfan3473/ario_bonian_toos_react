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
   وضعیت‌ها و برچسب‌های رنگی (پشتیبانی از Dark/Light)
   ========================================== */
const getStatusInfo = (status, isDark) => {
  const STATUS_MAP = {
    PRESENT: { label: 'حاضر', color: isDark ? 'text-green-400 bg-green-900/40 border-green-700' : 'text-green-700 bg-green-50 border-green-200' },
    ABSENT: { label: 'غایب', color: isDark ? 'text-red-400 bg-red-900/40 border-red-700' : 'text-red-700 bg-red-50 border-red-200' },
    LEAVE: { label: 'مرخصی', color: isDark ? 'text-blue-400 bg-blue-900/40 border-blue-700' : 'text-blue-700 bg-blue-50 border-blue-200' },
    APPROVED: { label: 'تایید شده', color: isDark ? 'text-green-300 bg-green-800/40 border-green-600' : 'text-green-700 bg-green-100 border-green-300' },
    PENDING: { label: 'در انتظار', color: isDark ? 'text-yellow-400 bg-yellow-900/40 border-yellow-700' : 'text-yellow-700 bg-yellow-100 border-yellow-300' },
    REJECTED: { label: 'رد شده', color: isDark ? 'text-red-300 bg-red-800/40 border-red-600' : 'text-red-700 bg-red-200 border-red-400' },
    RETURNED: { label: 'برگشتی', color: isDark ? 'text-purple-400 bg-purple-900/40 border-purple-700' : 'text-purple-700 bg-purple-100 border-purple-300' },
    SKIPPED: { label: 'رد مرحله', color: isDark ? 'text-gray-400 bg-gray-700 border-gray-500' : 'text-gray-500 bg-gray-100 border-gray-300' },
    NO_CONTRACT: { label: 'بدون قرارداد', color: isDark ? 'text-slate-300 bg-slate-700 border-slate-500' : 'text-slate-600 bg-slate-100 border-slate-300' },
  };

  return STATUS_MAP[status] || {
    label: status || 'نامشخص',
    color: isDark ? 'text-gray-400 bg-gray-800 border-gray-600' : 'text-gray-600 bg-gray-100 border-gray-300',
  };
};

const StatusBadge = ({ status }) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');
  const { label, color } = getStatusInfo(status, isDark);
  return (
    <span className={`inline-block px-1.5 py-0.5 rounded text-[11px] font-semibold border ${color}`}>
      {label}
    </span>
  );
};

/* ==========================================
   لاگ پیامک حضور (پشتیبانی از Dark/Light)
   ========================================== */
const AttendanceSmsMiniList = ({ logs = [], onRefresh, refreshingId, isLoading }) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

  if (isLoading) {
    return (
      <div className={`text-[10px] mt-1 w-full flex items-center justify-center gap-1 ${isDark ? 'text-blue-400' : 'text-blue-500'}`}>
        <FaSpinner className="animate-spin" size={9} />
        در حال دریافت لاگ...
      </div>
    );
  }

  if (!logs.length) {
    return <div className={`text-[10px] mt-1 w-full text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>لاگی ثبت نشده</div>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-1 mt-1 w-full">
      {logs.map((log) => {
        const statusLabel =
          log.delivery_status === 'DELIVERED' ? 'تحویل شد' :
          log.delivery_status === 'FAILED' ? 'ناموفق' :
          log.delivery_status === 'SENT' ? 'ارسال شده' : 'نامشخص';

        const statusColor =
          log.delivery_status === 'DELIVERED'
            ? (isDark ? 'text-green-400 border-green-800 bg-green-900/30' : 'text-green-600 border-green-200 bg-green-50')
            : log.delivery_status === 'FAILED'
            ? (isDark ? 'text-red-400 border-red-800 bg-red-900/30' : 'text-red-600 border-red-200 bg-red-50')
            : log.delivery_status === 'SENT'
            ? (isDark ? 'text-yellow-400 border-yellow-800 bg-yellow-900/30' : 'text-yellow-600 border-yellow-200 bg-yellow-50')
            : (isDark ? 'text-gray-400 border-gray-700 bg-gray-800' : 'text-gray-500 border-gray-200 bg-gray-50');

        const canRefresh = !['DELIVERED', 'FAILED'].includes(log.delivery_status);

        return (
          <div key={log.id} className={`flex items-center gap-1 text-[10px] border rounded px-1.5 py-0.5 ${statusColor}`}>
            <span className="font-bold">{statusLabel}</span>
            {canRefresh && (
              <button
                onClick={() => onRefresh(log.id)}
                disabled={refreshingId === log.id}
                className={`flex items-center justify-center p-0.5 rounded disabled:opacity-50 transition-colors ${
                  isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
                }`}
              >
                {refreshingId === log.id ? <FaSpinner className="animate-spin" size={8} /> : <FaSearch size={8} />}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};

/* ==========================================
   کامپوننت جدول مراحل تأیید (پشتیبانی از Dark/Light)
   ========================================== */
const ApprovalStepsMiniTable = ({ steps }) => {
  const isDark = useSelector((s) => s.theme?.mode === 'dark');

  if (!steps || steps.length === 0) {
    return <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>-</span>;
  }

  return (
    <table className={`w-full text-[10px] border rounded overflow-hidden shadow-sm ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
      <thead>
        <tr className={isDark ? 'bg-gray-800' : 'bg-gray-100'}>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'}`}>مرحله</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'}`}>وضعیت</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'}`}>تأییدکننده</th>
          <th className={`px-1 py-0.5 text-center font-semibold border-b ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-600 border-gray-200'}`}>دقیقه</th>
        </tr>
      </thead>
      <tbody>
        {steps.map((step, idx) => (
          <tr key={idx} className={`border-t ${isDark ? 'border-gray-700 even:bg-gray-800/50' : 'border-gray-150 even:bg-gray-50'}`}>
            <td className={`px-1 py-0.5 text-center font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{step.step_order}</td>
            <td className="px-1 py-0.5 text-center"><StatusBadge status={step.status} /></td>
            <td className={`px-1 py-0.5 text-center truncate max-w-[80px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={step.approver_name}>
              {step.approver_name || '---'}
            </td>
            <td className={`px-1 py-0.5 text-center font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title="ساعت تایید شده">
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
  const isDark = useSelector((s) => s.theme?.mode === 'dark');
  
  const smsSendingKey = useSelector((s) => s.attendance.smsSendingKey);
  const smsRefreshingId = useSelector((s) => s.attendance.smsRefreshingId);
  const smsLogsByKey = useSelector((s) => s.attendance.smsLogsByKey || {});
  const smsLogsLoadingKey = useSelector((s) => s.attendance.smsLogsLoadingKey);

  const [openedSmsKey, setOpenedSmsKey] = useState({});

  if (!meta?.days?.length) {
    return (
      <div className={`mt-4 p-4 text-center border rounded-lg shadow-sm ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>📭 داده‌ای برای نمایش وجود ندارد</p>
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
    const workers = dayData.workers;

    rows.push({ type: 'dayHeader', day, dayIndex, totalWorkers: workers.length });

    if (workers.length === 0) {
      rows.push({ type: 'empty', day, dayIndex });
    } else {
      // اضافه کردن ایندکس (شماره ردیف) برای هر کارگر در آن روز
      workers.forEach((worker, wIndex) => {
        rows.push({ type: 'worker', day, dayIndex, worker, workerIndex: wIndex + 1 });
      });
    }
  });

  return (
    <div className={`mt-2 overflow-x-auto rounded-lg border shadow-sm max-h-[80vh] overflow-y-auto ${isDark ? 'border-gray-700 bg-gray-900' : 'border-slate-300 bg-white'}`}>
      <table className="w-full text-xs border-collapse">
        <thead className="sticky top-0 z-20 shadow-md">
          <tr className={`border-b-2 ${isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-slate-200 border-slate-400 text-slate-800'}`}>
            <th className={`px-2 py-2 text-right font-bold min-w-[150px] border-l ${isDark ? 'border-gray-700' : 'border-slate-300'}`}>نام کارگر</th>
            <th className={`px-2 py-2 text-center font-bold min-w-[200px] border-l ${isDark ? 'border-gray-700' : 'border-slate-300'}`}>وضعیت / عملیات پیامک</th>
            <th className={`px-2 py-2 text-center font-bold min-w-[140px] border-l ${isDark ? 'border-gray-700' : 'border-slate-300'}`}>تردد (خروج / ورود)</th>
            <th className={`px-2 py-2 text-center font-bold min-w-[140px] border-l ${isDark ? 'border-gray-700' : 'border-slate-300'}`}>اضافه‌کاری (تا / از)</th>
            <th className={`px-2 py-2 text-center font-bold min-w-[220px] border-l ${isDark ? 'border-gray-700' : 'border-slate-300'}`}>مراحل تأیید</th>
            <th className="px-2 py-2 text-center font-bold min-w-[180px]">کارکرد (کل/شب/جمعه)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            if (row.type === 'dayHeader') {
              const { day, totalWorkers } = row;
              const isHoliday = day.is_official_holiday;
              const isFriday = day.is_friday;
              
              const badgeClass = isHoliday
                ? 'bg-red-500 text-white border-red-600 shadow-sm'
                : isFriday
                ? 'bg-orange-500 text-white border-orange-600 shadow-sm'
                : 'bg-slate-600 text-white border-slate-700 shadow-sm';

              return (
                <tr key={`header-${day.gregorian_date}`} className={`border-t-[4px] ${isDark ? 'border-gray-400' : 'border-slate-500'}`}>
                  {/* پس‌زمینه معکوس */}
                  <td colSpan={6} className={`px-3 py-2 ${isDark ? 'bg-slate-100' : 'bg-slate-800'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* متن معکوس */}
                        <span className={`font-extrabold text-sm drop-shadow-sm ${isDark ? 'text-slate-900' : 'text-white'}`}>
                          {day.weekday_name} {day.day} {day.month} {day.year}
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[11px] font-bold border ${badgeClass}`}>
                          {isHoliday ? day.holiday_title || 'تعطیل رسمی' : isFriday ? 'جمعه' : 'روز عادی'}
                        </span>
                      </div>
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded shadow-sm border ${
                        isDark ? 'text-slate-800 bg-white border-slate-300' : 'text-white bg-slate-700 border-slate-600'
                      }`}>
                        تعداد افراد: {totalWorkers}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            }

            const rowBgClass = isDark
              ? (row.dayIndex % 2 === 0 ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-800/60 hover:bg-gray-700')
              : (row.dayIndex % 2 === 0 ? 'bg-white hover:bg-sky-50' : 'bg-slate-50 hover:bg-slate-100/80');

            if (row.type === 'empty') {
              return (
                <tr key={`empty-${row.day.gregorian_date}`} className={rowBgClass}>
                  <td colSpan={6} className={`px-2 py-3 text-center italic text-[11px] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    هیچ کارگری در این روز ثبت نشده است.
                  </td>
                </tr>
              );
            }

            const { day, worker, workerIndex } = row;
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
              <tr key={`${day.gregorian_date}-${worker.worker_id}`} className={`border-b transition-colors duration-150 ${isDark ? 'border-gray-700' : 'border-gray-200'} ${rowBgClass}`}>
                <td className={`px-2 py-1.5 text-right font-bold border-l align-middle ${isDark ? 'text-gray-200 border-gray-700' : 'text-slate-800 border-gray-200/70'}`}>
                  {/* نمایش شماره ردیف و نام کارگر */}
                  <div className="flex items-center gap-1.5">
                    <span className={`flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-mono shadow-sm ${
                      isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {workerIndex}
                    </span>
                    <span>{worker.worker_name}</span>
                  </div>
                </td>

                <td className={`px-2 py-1.5 border-l align-middle ${isDark ? 'border-gray-700' : 'border-gray-200/70'}`}>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <StatusBadge status={isIncomplete ? 'خروج نخورده' : worker.status} />

                    {worker.status === 'ABSENT' && (
                      <>
                        <button
                          onClick={() => handleSendAttendanceSms(worker.worker_id, day.gregorian_date)}
                          disabled={smsSendingKey === smsKey}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border disabled:opacity-50 transition-colors ${
                            isDark ? 'border-red-800 bg-red-900/30 text-red-400 hover:bg-red-800/50' : 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                        >
                          {smsSendingKey === smsKey ? <FaSpinner className="animate-spin" size={8} /> : <FaPaperPlane size={8} />}
                          ارسال پیامک
                        </button>
                        <button
                          onClick={() => handleToggleSmsLogs(worker.worker_id, day.gregorian_date)}
                          className={`flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded border transition-colors ${
                            isDark ? 'border-blue-800 bg-blue-900/30 text-blue-400 hover:bg-blue-800/50' : 'border-blue-300 bg-blue-50 text-blue-600 hover:bg-blue-100'
                          }`}
                        >
                          <FaSearch size={8} />
                          پیگیری
                        </button>
                      </>
                    )}
                  </div>
                  {worker.status === 'ABSENT' && isSmsOpen && (
                    <AttendanceSmsMiniList logs={smsLogs} isLoading={isSmsLogsLoading} refreshingId={smsRefreshingId} onRefresh={(logId) => handleRefreshAttendanceSms(logId, worker.worker_id, day.gregorian_date)} />
                  )}
                </td>

                <td className={`px-2 py-1.5 border-l text-center align-middle ${isDark ? 'border-gray-700' : 'border-gray-200/70'}`}>
                  {attendanceLogs.length === 0 ? (
                    <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>-</span>
                  ) : (
                    <div className="flex flex-col gap-0.5 items-center">
                      {attendanceLogs.map((log, i) => {
                        const nextDay = log.time_in && log.time_out && log.time_out < log.time_in;
                        return (
                          <div key={log.id || i} className="flex items-center gap-1 text-[11px]">
                            <span className={`font-mono font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{log.time_out || '--:--'}</span>
                            <span className={`text-[8px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>▶</span>
                            <span className={`font-mono font-bold ${isDark ? 'text-green-400' : 'text-green-700'}`}>{log.time_in || '--:--'}</span>
                            {nextDay && <span className={`font-bold text-[9px] ${isDark ? 'text-red-500' : 'text-red-400'}`}>(+۱)</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </td>

                <td className={`px-2 py-1.5 border-l text-center align-middle ${isDark ? 'border-gray-700' : 'border-gray-200/70'}`}>
                  {overtimeLogs.length === 0 ? (
                    <span className={`text-[10px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>-</span>
                  ) : (
                    <div className="flex flex-col gap-0.5 items-center">
                      {overtimeLogs.map((otLog, i) => (
                        <div key={otLog.id || i} className="flex items-center gap-1 text-[11px]">
                          <span className={`font-mono font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{otLog.time_out || '--:--'}</span>
                          <span className={`text-[8px] ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>▶</span>
                          <span className={`font-mono font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{otLog.time_in || '--:--'}</span>
                        </div>
                      ))}
                      <div className={`mt-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${isDark ? 'text-amber-400 bg-amber-900/30 border-amber-800' : 'text-amber-700 bg-amber-50 border-amber-200'}`}>
                        {decimalHoursToHHMM(worker.overtime_hours)}
                      </div>
                    </div>
                  )}
                </td>

                <td className={`px-2 py-1 border-l align-middle ${isDark ? 'border-gray-700' : 'border-gray-200/70'}`}>
                  <div className="flex flex-col gap-1">
                    {overtimeLogs.length > 0 ? (
                      overtimeLogs.map((log) => {
                        const approvalRecord = overtimeApprovals.find((oa) => oa.overtime_id === log.id);
                        return <ApprovalStepsMiniTable key={log.id} steps={approvalRecord ? approvalRecord.steps : []} />;
                      })
                    ) : (
                      <span className={`text-[10px] text-center block ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>-</span>
                    )}
                  </div>
                </td>

                <td className="px-2 py-1.5 text-center align-middle">
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    <div className={`text-[11px] px-2 py-0.5 rounded border flex items-center gap-1 shadow-sm ${isDark ? 'bg-gray-700 text-gray-200 border-gray-600' : 'bg-white text-slate-800 border-slate-300'}`}>
                      <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>حضور:</span>
                      <span className="font-mono font-extrabold text-sm">{decimalHoursToHHMM(worker.hours_worked)}</span>
                    </div>

                    {worker.night_hours > 0 && (
                      <div className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${isDark ? 'bg-indigo-900/30 text-indigo-300 border-indigo-800' : 'bg-indigo-50 text-indigo-700 border-indigo-200'}`}>
                        شب: <span className="font-mono font-bold">{decimalHoursToHHMM(worker.night_hours)}</span>
                      </div>
                    )}

                    {worker.friday_hours > 0 && (
                      <div className={`text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1 ${isDark ? 'bg-rose-900/30 text-rose-300 border-rose-800' : 'bg-rose-50 text-rose-700 border-rose-200'}`}>
                        جمعه: <span className="font-mono font-bold">{decimalHoursToHHMM(worker.friday_hours)}</span>
                      </div>
                    )}
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