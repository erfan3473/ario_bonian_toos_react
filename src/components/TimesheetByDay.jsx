import React from 'react';
import { decimalHoursToHHMM } from '../utils/dateUtils';

/* ==========================================
   وضعیت‌ها و برچسب‌های رنگی
   ========================================== */
const STATUS_MAP = {
  PRESENT:  { label: 'حاضر',      color: 'text-green-700 bg-green-50 border-green-200' },
  ABSENT:   { label: 'غایب',      color: 'text-red-700 bg-red-50 border-red-200' },
  LEAVE:    { label: 'مرخصی',     color: 'text-blue-700 bg-blue-50 border-blue-200' },
  APPROVED: { label: 'تایید شده', color: 'text-green-700 bg-green-100 border-green-300' },
  PENDING:  { label: 'در انتظار', color: 'text-yellow-700 bg-yellow-100 border-yellow-300' },
  REJECTED: { label: 'رد شده',    color: 'text-red-700 bg-red-200 border-red-400' },
  RETURNED: { label: 'برگشتی',    color: 'text-purple-700 bg-purple-100 border-purple-300' },
  SKIPPED:  { label: 'رد مرحله',  color: 'text-gray-500 bg-gray-100 border-gray-300' },
};

const getStatusInfo = (status) =>
  STATUS_MAP[status] || { label: status || 'نامشخص', color: 'text-gray-600 bg-gray-100 border-gray-300' };

const StatusBadge = ({ status }) => {
  const { label, color } = getStatusInfo(status);
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold border ${color}`}>
      {label}
    </span>
  );
};

/* ==========================================
   کامپوننت جدول مراحل تأیید (برای یک لاگ)
   ========================================== */
const ApprovalStepsMiniTable = ({ steps, type }) => {
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
          {type === 'overtime' && (
            <>
              <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">دقیقه قبل</th>
              <th className="px-2 py-1.5 text-center font-medium text-gray-600 border-b border-gray-200">دقیقه بعد</th>
            </>
          )}
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
            <td className="px-2 py-1.5 text-center text-gray-700 max-w-[100px] truncate" title={step.note}>
              {step.note || '---'}
            </td>
            {type === 'overtime' && (
              <>
                <td className="px-2 py-1.5 text-center text-gray-700 font-mono">
                  {step.approved_minutes_before ?? 0}
                </td>
                <td className="px-2 py-1.5 text-center text-gray-700 font-mono">
                  {step.approved_minutes_after ?? 0}
                </td>
              </>
            )}
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
  if (!meta?.days?.length) {
    return (
      <div className="mt-6 p-6 text-center bg-white border border-gray-200 rounded-xl shadow-sm">
        <p className="text-gray-400">📭 داده‌ای برای نمایش وجود نداردp</p>
      </div>
    );
  }

  // ساخت یک flat list: هر سطر = یک روز + یک کارگر
  const rows = [];
  meta.days.forEach((day) => {
    const dayKey = day.gregorian_date;
    const dayData = byDay[dayKey] || { workers: [] };
    const workers = dayData.workers;

    if (workers.length === 0) {
      rows.push({
        day,
        worker: null,
      });
    } else {
      workers.forEach((worker, wi) => {
        rows.push({
          day,
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
          <tr className="bg-slate-50/75 border-b border-gray-200 text-slate-700">
            {/* سربرگ روز و هفته با پس‌زمینه سفید و متن مشکی */}
            <th className="p-4 text-right font-extrabold min-w-[100px] bg-white text-black border-l border-gray-200">روز</th>
            <th className="p-4 text-center font-extrabold min-w-[80px] bg-white text-black border-l border-gray-200">هفته</th>

            <th className="p-4 text-center font-semibold min-w-[95px] border-l border-gray-250">نوع روز</th>
            <th className="p-4 text-right font-semibold min-w-[150px] border-l border-gray-250">نام کارگر</th>
            <th className="p-4 text-center font-semibold min-w-[95px] border-l border-gray-250">وضعیت</th>
            <th className="p-4 text-center font-semibold min-w-[170px] border-l border-gray-250">حضور (خروج / ورود)</th>
            <th className="p-4 text-center font-semibold min-w-[210px] border-l border-gray-250">اضافه‌کاری (تا / از / ساعت تأییدشده)</th>
            <th className="p-4 text-center font-semibold min-w-[260px] border-l border-gray-250">مراحل تأیید (حضور / اضافه‌کاری)</th>
            <th className="p-4 text-center font-semibold min-w-[130px]">سایر (شب/جمعه/کل)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150">
          {rows.map((row, rowIdx) => {
            const { day, worker, isFirstOfDay, totalWorkers } = row;

            if (!worker) {
              return (
                <tr key={`nodata-${rowIdx}`} className="border-b border-gray-200 bg-gray-50/30">
                  <td colSpan={9} className="p-4 text-center text-gray-400 italic">
                    برای این روز هیچ کارگری ثبت نشده است
                  </td>
                </tr>
              );
            }
            console.log(`مراحل تأیید ${worker.worker_name} در تاریخ ${day.gregorian_date}:`, {
              حضور: worker.attendance_approvals,
              اضافه_کاری: worker.overtime_approvals
            });
            // 👆 پایان لاگ 👆
            const attendanceLogs = worker.attendance_logs || [];
            const overtimeLogs  = worker.overtime_logs || [];

            // مپ تأییدیه‌ها
            const attMap = {};
            (worker.attendance_approvals || []).forEach((app) => {
              attMap[app.attendance_id] = app.steps || [];
            });
            const otMap = {};
            (worker.overtime_approvals || []).forEach((app) => {
              otMap[app.overtime_id] = app.steps || [];
            });

            // محاسبه ساعات اضافه‌کاری تأییدشده
            const approvedOvertimeMinutes = overtimeLogs.reduce((acc, otLog) => {
              const steps = otMap[otLog.id] || [];
              const lastApp = steps.filter((s) => s.status === 'APPROVED').pop();
              return acc + (lastApp ? (lastApp.approved_minutes_after || 0) : 0);
            }, 0);
            const approvedOvertimeHours = (approvedOvertimeMinutes / 60).toFixed(2);

            const firstAtt = attendanceLogs[0];
            const start = firstAtt?.time_in;
            const end = firstAtt?.time_out;
            const isIncomplete = start && !end;

            return (
              <tr key={`${day.gregorian_date}-${worker.worker_id}`} className="hover:bg-slate-50/30 transition-colors duration-150 ease-in-out">
                {/* سلول‌های روز (ادغام شده) با پس‌زمینه سفید و متن مشکی */}
                {isFirstOfDay && (
                  <>
                    <td rowSpan={totalWorkers} className="p-4 text-right border-l border-gray-200 bg-white text-black align-middle">
                      <div className="font-extrabold text-lg text-slate-900">{day.day}</div>
                      <div className="text-gray-400 text-xs mt-1 font-medium">{day.month} / {day.year}</div>
                    </td>
                    <td rowSpan={totalWorkers} className="p-4 text-center border-l border-gray-200 bg-white text-slate-800 font-bold align-middle">
                      {day.weekday_name || '-'}
                    </td>

                    <td rowSpan={totalWorkers} className="p-4 text-center border-l border-gray-200 align-middle">
                      <span className={`inline-block px-3 py-1 rounded-lg text-xs font-semibold border
                        ${day.is_official_holiday
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

                {/* نام کارگر */}
                <td className="p-4 text-right font-semibold text-black border-l border-gray-200">
                  {worker.worker_name}
                </td>

                {/* وضعیت کلی */}
                <td className="p-4 text-center border-l border-gray-200">
                  <StatusBadge status={isIncomplete ? 'خروج نخورده' : worker.status} />
                </td>

                {/* حضور و غیاب (با جهت معکوس خروج ← ورود برای RTL) */}
                <td className="p-4 border-l border-gray-200">
                  {attendanceLogs.length === 0 ? (
                    <span className="text-gray-400 text-xs">بدون تردد</span>
                  ) : (
                    <div className="flex flex-col gap-1.5 justify-center items-center">
                      {attendanceLogs.map((log, i) => {
                        const nextDay = log.time_in && log.time_out && log.time_out < log.time_in;
                        return (
                          <div key={log.id || i} className="flex items-center gap-1.5 text-xs">
                            <span className="font-mono font-bold text-red-600">
                              {log.time_out || '--:--'}
                            </span>
                            <span className="text-gray-400">←</span>
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

                {/* اضافه‌کاری (با جهت معکوس تا ← از برای RTL) */}
                <td className="p-4 border-l border-gray-200 text-center">
                  {overtimeLogs.length === 0 ? (
                    <span className="text-gray-400 text-xs">-</span>
                  ) : (
                    <div className="flex flex-col gap-2 items-center">
                      {overtimeLogs.map((otLog, i) => (
                        <div key={otLog.id || i} className="flex items-center gap-1.5 text-xs">
                          <span className="font-mono font-bold text-purple-600">
                            {otLog.time_out || '--:--'}
                          </span>
                          <span className="text-gray-400">←</span>
                          <span className="font-mono font-bold text-blue-600">
                            {otLog.time_in || '--:--'}
                          </span>
                        </div>
                      ))}
                      <div className="font-mono font-bold text-amber-600 text-sm mt-1 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                        {decimalHoursToHHMM(parseFloat(approvedOvertimeHours))}
                      </div>
                    </div>
                  )}
                </td>

                {/* مراحل تأیید */}
                <td className="p-4 border-l border-gray-200">
                  <div className="flex flex-col gap-3">
                    {attendanceLogs.map((log) => {
                      const steps = attMap[log.id] || [];
                      return (
                        <div key={log.id}>
                          <div className="text-xs font-semibold mb-1 text-gray-500">حضور (لاگ {log.id})</div>
                          <ApprovalStepsMiniTable steps={steps} type="attendance" />
                        </div>
                      );
                    })}
                    {overtimeLogs.map((log) => {
                      const steps = otMap[log.id] || [];
                      return (
                        <div key={log.id} className="mt-2">
                          <div className="text-xs font-semibold mb-1 text-gray-500">اضافه‌کاری (لاگ {log.id})</div>
                          <ApprovalStepsMiniTable steps={steps} type="overtime" />
                        </div>
                      );
                    })}
                    {attendanceLogs.length === 0 && overtimeLogs.length === 0 && (
                      <span className="text-gray-400 text-xs">-</span>
                    )}
                  </div>
                </td>

                {/* سایر اطلاعات */}
                <td className="p-4 text-center">
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
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
                    <div className="text-center col-span-2 mt-2 pt-2 border-t border-gray-200">
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
