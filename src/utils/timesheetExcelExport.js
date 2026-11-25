// src/utils/timesheetExcelExport.js
import * as XLSX from 'xlsx';
import { decimalHoursToHHMM } from './dateUtils';

const STATUS_LABELS = {
  PRESENT: 'حاضر',
  ABSENT: 'غایب',
  LEAVE: 'مرخصی',
  APPROVED: 'تایید شده',
  PENDING: 'در انتظار',
  REJECTED: 'رد شده',
  RETURNED: 'برگشتی',
  SKIPPED: 'رد مرحله',
  NO_CONTRACT: 'بدون قرارداد',
};

const getDayTypeLabel = (day) => {
  if (day.is_official_holiday) return day.holiday_title || 'تعطیل رسمی';
  if (day.is_friday) return 'جمعه';
  return 'عادی';
};

const formatApprovalSummary = (overtimeApprovals = []) => {
  const parts = [];
  overtimeApprovals.forEach((oa) => {
    (oa.steps || []).forEach((s) => {
      const st = STATUS_LABELS[s.status] || s.status || '-';
      parts.push(
        `مرحله ${s.step_order ?? '-'}: ${s.approver_name || '---'} (${st} / ${
          s.approved_minutes_after ?? 0
        } دقیقه)`
      );
    });
  });
  return parts.length > 0 ? parts.join(' | ') : '-';
};

const autoSizeColumns = (rows) => {
  if (!rows || rows.length === 0) return [];
  const keys = Object.keys(rows[0]);
  return keys.map((key) => {
    const maxLen = rows.reduce((max, row) => {
      const val = row[key] !== null && row[key] !== undefined ? String(row[key]) : '';
      return Math.max(max, val.length);
    }, key.length);
    return { wch: Math.min(Math.max(maxLen + 4, 10), 42) };
  });
};

export const aggregateWorkerDailyLocation = (workerId, days = [], dailyLocationStats = {}, fallbackStat = null) => {
  let foundDays = 0;
  let totalLogs = 0;
  let totalDistanceMeters = 0;
  let inside = 0;
  let outside = 0;
  let off = 0;

  days.forEach((d) => {
    const stat = dailyLocationStats[`${workerId}:${d.gregorian_date}`];
    if (stat) {
      foundDays += 1;
      totalLogs += stat.total_logs || 0;
      totalDistanceMeters += stat.distance_meters || 0;
      inside += stat.raw_counts?.inside || 0;
      outside += stat.raw_counts?.outside || 0;
      off += stat.raw_counts?.off || 0;
    }
  });

  if (foundDays === 0) {
    return fallbackStat ? { ...fallbackStat, loadedDaysCount: days.length } : null;
  }

  return {
    loadedDaysCount: foundDays,
    total_logs: totalLogs,
    distance_meters: Math.round(totalDistanceMeters * 100) / 100,
    distance_kilometers: Math.round((totalDistanceMeters / 1000) * 100) / 100,
    chart_data: {
      inside_project_percent: totalLogs > 0 ? Math.round((inside / totalLogs) * 1000) / 10 : 0,
      outside_project_percent: totalLogs > 0 ? Math.round((outside / totalLogs) * 1000) / 10 : 0,
      gps_off_percent: totalLogs > 0 ? Math.round((off / totalLogs) * 1000) / 10 : 0,
    },
    raw_counts: { inside, outside, off },
  };
};

export const exportTimesheetToExcel = ({
  meta,
  workers = [],
  byWorker = {},
  byDay = {},
  dailyLocationStats = {},
  locationStatsByWorker = {},
  startDate,
  endDate,
  projectName = 'همه پروژه‌ها',
}) => {
  if (!meta || !workers.length) return;

  const wb = XLSX.utils.book_new();
  wb.Workbook = { Views: [{ RTL: true }] };

  const days = meta.days || [];

  // محاسبه بیشترین تعداد تردد و اضافه‌کاری در کل بازه (بدون محدودیت برای اکسل)
  let maxAttPairs = 1;
  let maxOtPairs = 1;

  days.forEach((day) => {
    const dayWorkers = byDay[day.gregorian_date]?.workers || [];
    dayWorkers.forEach((w) => {
      if ((w.attendance_logs?.length || 0) > maxAttPairs) {
        maxAttPairs = w.attendance_logs.length;
      }
      if ((w.overtime_logs?.length || 0) > maxOtPairs) {
        maxOtPairs = w.overtime_logs.length;
      }
    });
  });

  // ======================================================
  // شیت ۱: گزارش یکپارچه روزانه + ترددها + آمار مکانی روزانه
  // ======================================================
  const dailyRows = [];
  days.forEach((day) => {
    const dayData = byDay[day.gregorian_date] || { workers: [] };
    (dayData.workers || []).forEach((w, idx) => {
      const attLogs = w.attendance_logs || [];
      const otLogs = w.overtime_logs || [];
      const isIncomplete = attLogs.some((l) => l.time_in && !l.time_out);
      const gps = dailyLocationStats[`${w.worker_id}:${day.gregorian_date}`];

      const rowObj = {
        'تاریخ شمسی': `${day.year}/${day.month}/${day.day}`,
        'روز هفته': day.weekday_name,
        'نوع روز': getDayTypeLabel(day),
        ردیف: idx + 1,
        'نام پرسنل': w.worker_name || '-',
        وضعیت: isIncomplete ? 'خروج نخورده' : STATUS_LABELS[w.status] || w.status || '-',
        'وضعیت پیامک غیبت': w.status === 'ABSENT' ? (w.sms_sent ? 'ارسال شده' : 'ارسال نشده') : '-',
      };

      for (let i = 0; i < maxAttPairs; i++) {
        const log = attLogs[i];
        rowObj[`ورود ${i + 1}`] = log?.time_in || '-';
        rowObj[`خروج ${i + 1}`] = log?.time_out
          ? log.time_in && log.time_out < log.time_in
            ? `${log.time_out} (+1)`
            : log.time_out
          : '-';
      }

      for (let i = 0; i < maxOtPairs; i++) {
        const ot = otLogs[i];
        rowObj[`اضافه‌کار از ${maxOtPairs > 1 ? i + 1 : ''}`.trim()] = ot?.time_in || '-';
        rowObj[`اضافه‌کار تا ${maxOtPairs > 1 ? i + 1 : ''}`.trim()] = ot?.time_out || '-';
      }

      rowObj['جمع اضافه‌کار (سیستم)'] = w.calculated_overtime > 0 ? decimalHoursToHHMM(w.calculated_overtime) : '-';
      rowObj['تاییدشده اضافه‌کار'] = w.overtime_hours > 0 ? decimalHoursToHHMM(w.overtime_hours) : '-';
      rowObj['مراحل تأیید'] = formatApprovalSummary(w.overtime_approvals);
      rowObj['کارکرد کل'] = decimalHoursToHHMM(w.hours_worked);
      rowObj['شب‌کاری'] = w.night_hours > 0 ? decimalHoursToHHMM(w.night_hours) : '-';
      rowObj['جمعه‌کاری'] = w.friday_hours > 0 ? decimalHoursToHHMM(w.friday_hours) : '-';

      rowObj['مسافت (کیلومتر)'] = gps ? gps.distance_kilometers : '-';
      rowObj['تعداد نقاط'] = gps ? gps.total_logs : '-';
      rowObj['داخل محدوده (%)'] = gps && gps.total_logs > 0 ? `${gps.chart_data?.inside_project_percent ?? 0}%` : '-';
      rowObj['خارج محدوده (%)'] = gps && gps.total_logs > 0 ? `${gps.chart_data?.outside_project_percent ?? 0}%` : '-';
      rowObj['خاموش / خطا (%)'] = gps && gps.total_logs > 0 ? `${gps.chart_data?.gps_off_percent ?? 0}%` : '-';

      dailyRows.push(rowObj);
    });
  });

  if (dailyRows.length > 0) {
    const wsDaily = XLSX.utils.json_to_sheet(dailyRows);
    wsDaily['!cols'] = autoSizeColumns(dailyRows);
    wsDaily['!views'] = [{ rightToLeft: true }];
    XLSX.utils.book_append_sheet(wb, wsDaily, 'گزارش روزانه');
  }

  // ======================================================
  // شیت ۲: خلاصه کارنامه پرسنل (تجمیعی کل بازه)
  // ======================================================
  let sumPresent = 0;
  let sumHours = 0;
  let sumNight = 0;
  let sumFriday = 0;
  let sumCalcOt = 0;
  let sumApprovedOt = 0;

  const summaryRows = workers.map((worker, index) => {
    const summary = byWorker[worker.worker_id]?.summary || {};
    const gps = aggregateWorkerDailyLocation(
      worker.worker_id,
      days,
      dailyLocationStats,
      locationStatsByWorker[String(worker.worker_id)]
    );

    const presentDays = summary.total_present_days || 0;
    const hours = summary.total_hours || 0;
    const avgHours = presentDays > 0 ? hours / presentDays : 0;
    const night = summary.total_night_hours || 0;
    const friday = summary.total_friday_hours || 0;
    const calcOt = summary.total_calculated_overtime || 0;
    const approvedOt = summary.total_overtime_hours || 0;

    sumPresent += presentDays;
    sumHours += hours;
    sumNight += night;
    sumFriday += friday;
    sumCalcOt += calcOt;
    sumApprovedOt += approvedOt;

    return {
      ردیف: index + 1,
      'نام پرسنل': worker.worker_name || '-',
      'کد پرسنلی': worker.worker_code || '-',
      'حضور (روز)': presentDays,
      'مجموع کارکرد': decimalHoursToHHMM(hours),
      'میانگین حضور روزانه': avgHours > 0 ? decimalHoursToHHMM(avgHours) : '-',
      'شب‌کاری': night > 0 ? decimalHoursToHHMM(night) : '-',
      'جمعه‌کاری': friday > 0 ? decimalHoursToHHMM(friday) : '-',
      'اضافه‌کار (سیستم)': calcOt > 0 ? decimalHoursToHHMM(calcOt) : '-',
      'اضافه‌کار (تایید شده)': approvedOt > 0 ? decimalHoursToHHMM(approvedOt) : '-',
      'مسافت مکانی (کیلومتر)': gps ? gps.distance_kilometers : '-',
      'تعداد نقاط مکانی': gps ? gps.total_logs : '-',
      'داخل محدوده (%)': gps && gps.total_logs > 0 ? `${gps.chart_data?.inside_project_percent ?? 0}%` : '-',
      'خارج محدوده (%)': gps && gps.total_logs > 0 ? `${gps.chart_data?.outside_project_percent ?? 0}%` : '-',
      'خاموش / خطا (%)': gps && gps.total_logs > 0 ? `${gps.chart_data?.gps_off_percent ?? 0}%` : '-',
    };
  });

  summaryRows.push({
    ردیف: 'جمع کل',
    'نام پرسنل': `پروژه: ${projectName}`,
    'کد پرسنلی': `${workers.length} نفر`,
    'حضور (روز)': sumPresent,
    'مجموع کارکرد': decimalHoursToHHMM(sumHours),
    'میانگین حضور روزانه': sumPresent > 0 ? decimalHoursToHHMM(sumHours / sumPresent) : '-',
    'شب‌کاری': decimalHoursToHHMM(sumNight),
    'جمعه‌کاری': decimalHoursToHHMM(sumFriday),
    'اضافه‌کار (سیستم)': decimalHoursToHHMM(sumCalcOt),
    'اضافه‌کار (تایید شده)': decimalHoursToHHMM(sumApprovedOt),
    'مسافت مکانی (کیلومتر)': '-',
    'تعداد نقاط مکانی': '-',
    'داخل محدوده (%)': '-',
    'خارج محدوده (%)': '-',
    'خاموش / خطا (%)': '-',
  });

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary['!cols'] = autoSizeColumns(summaryRows);
  wsSummary['!views'] = [{ rightToLeft: true }];
  XLSX.utils.book_append_sheet(wb, wsSummary, 'خلاصه پرسنل');

  XLSX.writeFile(wb, `گزارش-حضور-${startDate}-تا-${endDate}.xlsx`);
};