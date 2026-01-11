// src/screens/DailySummaryScreen.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDailySummary } from '../features/reports/reportSlice';
import { fetchProjects } from '../features/projects/projectSlice';

import JalaliDatePicker from '../components/JalaliDatePicker';
import { formatJalaliDateLong } from '../utils/dateUtils';

import moment from 'moment-jalaali';
moment.loadPersian({ usePersianDigits: false });

// فرمت ساعت از ISO به HH:mm
const formatTime = (iso) => {
  if (!iso) return '---';
  return moment(iso).format('HH:mm');
};

const DailySummaryScreen = () => {
  const dispatch = useDispatch();

  const { dailySummary, summaryLoading, summaryError } = useSelector(
    (state) => state.reports
  );
  const { list: projectsList, loading: projectsLoading } = useSelector(
    (state) => state.projects
  );

  const [selectedProjectId, setSelectedProjectId] = useState(null);

  // تاریخ برای API (میلادی YYYY-MM-DD)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // بارگذاری اولیه پروژه‌ها
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // بارگذاری خلاصه روزانه وقتی پروژه و تاریخ انتخاب شده
  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      dispatch(
        fetchDailySummary({
          projectId: selectedProjectId,
          date: selectedDate,
        })
      );
    }
  }, [dispatch, selectedProjectId, selectedDate]);

  // مرتب‌سازی گزارش‌های سلسله‌مراتبی بر اساس سطح
  const sortedReports = useMemo(() => {
    if (!dailySummary?.hierarchical_reports) return [];
    return [...dailySummary.hierarchical_reports].sort(
      (a, b) =>
        (a.author_position?.hierarchy_level || 0) -
        (b.author_position?.hierarchy_level || 0)
    );
  }, [dailySummary?.hierarchical_reports]);

  const getHierarchyIndent = (level) => {
    const indents = {
      0: 'mr-0',
      1: 'mr-8',
      2: 'mr-16',
      3: 'mr-24',
    };
    return indents[level] || 'mr-0';
  };

  const getHierarchyIcon = (level) => {
    const icons = {
      0: '👑',
      1: '👔',
      2: '🔧',
      3: '👷',
    };
    return icons[level] || '👤';
  };

  const getStatusBadge = (status) => {
    const configs = {
      DRAFT: {
        bg: 'bg-gray-100',
        text: 'text-gray-700',
        border: 'border-gray-300',
        label: 'پیش‌نویس',
      },
      SUBMITTED: {
        bg: 'bg-yellow-50',
        text: 'text-yellow-700',
        border: 'border-yellow-300',
        label: 'منتظر تأیید',
      },
      APPROVED: {
        bg: 'bg-green-50',
        text: 'text-green-700',
        border: 'border-green-300',
        label: 'تأیید شده',
      },
      REJECTED: {
        bg: 'bg-red-50',
        text: 'text-red-700',
        border: 'border-red-300',
        label: 'رد شده',
      },
      FINAL: {
        bg: 'bg-blue-50',
        text: 'text-blue-700',
        border: 'border-blue-300',
        label: 'نهایی',
      },
    };
    const config = configs[status] || configs.SUBMITTED;

    return (
      <span
        className={`px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}
      >
        {config.label}
      </span>
    );
  };

  // Badge رنگی برای وضعیت حضور
  const getAttendanceStatusBadge = (status) => {
    const map = {
      PRESENT: {
        label: 'حاضر',
        cls: 'bg-green-50 text-green-700 border border-green-200',
      },
      ABSENT: {
        label: 'غایب',
        cls: 'bg-red-50 text-red-700 border border-red-200',
      },
      LEAVE: {
        label: 'مرخصی',
        cls: 'bg-blue-50 text-blue-700 border border-blue-200',
      },
      HALF_DAY: {
        label: 'نیم‌روز',
        cls: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
      },
    };
    const item = map[status] || {
      label: status,
      cls: 'bg-gray-50 text-gray-700 border border-gray-200',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${item.cls}`}>
        {item.label}
      </span>
    );
  };

  const hasSummaryBase =
    dailySummary && dailySummary.id !== 0 && selectedProjectId && !summaryLoading;

  // برای این‌که حضور حتی وقتی گزارش صفر است هم نشان داده شود:
  const hasAttendance =
    dailySummary &&
    dailySummary.workers_attendance &&
    dailySummary.workers_attendance.length > 0;

  const hasSummary = hasSummaryBase || hasAttendance;

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white">
      {/* Header */}
      <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          📅 خلاصه روزانه پروژه
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          انتخاب پروژه و تاریخ، و مشاهده گزارش‌های روزانه، فهرست‌بها و حضور و غیاب.
        </p>
        {dailySummary?.report_date && hasSummary && (
          <p className="text-gray-600 text-sm">
            تاریخ گزارش: {formatJalaliDateLong(dailySummary.report_date)}
          </p>
        )}
      </div>

      {/* فیلترها */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* انتخاب پروژه */}
          <div className="flex-grow min-w-[220px]">
            <label className="text-gray-600 text-sm mb-1 block">پروژه</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) =>
                setSelectedProjectId(
                  e.target.value ? Number(e.target.value) : null
                )
              }
              className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-60 disabled:cursor-not-allowed text-sm"
              disabled={projectsLoading}
            >
              <option value="">
                {projectsLoading ? 'در حال بارگذاری...' : 'انتخاب پروژه'}
              </option>
              {projectsList?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* انتخاب تاریخ */}
          <div className="min-w-[220px]">
            <JalaliDatePicker
              name="report_date"
              label="تاریخ"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              modal        // برای مودال استفاده می‌شود، پایین پیاده‌سازی‌اش را می‌دهم
            />
          </div>

          {/* دکمه نمایش/رفرش */}
          <div className="flex items-end">
            <button
              onClick={() => {
                if (selectedProjectId && selectedDate) {
                  dispatch(
                    fetchDailySummary({
                      projectId: selectedProjectId,
                      date: selectedDate,
                    })
                  );
                }
              }}
              disabled={!selectedProjectId || !selectedDate || summaryLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {summaryLoading ? 'در حال بارگذاری...' : 'نمایش گزارش'}
            </button>
          </div>
        </div>
      </div>

      {/* Error */}
      {summaryError && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg border border-red-200 mb-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="text-xl">❌</span>
            <span>{summaryError}</span>
          </div>
        </div>
      )}

      {/* بدون پروژه */}
      {!selectedProjectId && !summaryLoading && (
        <div className="text-center text-gray-500 py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
          <div className="text-5xl mb-3">📊</div>
          <p className="text-base">لطفاً ابتدا یک پروژه انتخاب کنید</p>
        </div>
      )}

      {/* بدون گزارش، ولی ممکن است حضور داشته باشد (اگر dailySummary.id === 0 از بک‌اند گرفتی، حضور هم خالی است) */}
      {dailySummary &&
        dailySummary.id === 0 &&
        selectedProjectId &&
        !summaryLoading &&
        !hasAttendance && (
          <div className="text-center text-gray-500 py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50">
            <div className="text-4xl mb-2">📝</div>
            <p className="text-base">
              برای این تاریخ گزارشی ثبت نشده است و حضور و غیابی هم ثبت نشده است.
            </p>
          </div>
        )}

      {/* Loading */}
      {summaryLoading && (
        <div className="text-center py-14">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mb-3" />
          <p className="text-blue-600 text-sm">در حال بارگذاری خلاصه روزانه...</p>
        </div>
      )}

      {/* محتوا */}
      {hasSummary && (
        <div className="space-y-6">
          {/* کارت‌های آمار (فقط اگر dailySummary واقعی داشته باشیم) */}
          {dailySummary.id !== 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">تعداد گزارش‌ها</div>
                <div className="text-xl font-bold text-gray-800">
                  {dailySummary.statistics?.total_hierarchical_reports || 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">تأیید شده</div>
                <div className="text-xl font-bold text-green-700">
                  {dailySummary.statistics?.approved_reports || 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">منتظر تأیید</div>
                <div className="text-xl font-bold text-yellow-600">
                  {dailySummary.statistics?.pending_reports || 0}
                </div>
              </div>

              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="text-gray-500 text-xs mb-1">هزینه فهرست‌بها</div>
                <div className="text-lg font-bold text-blue-700">
                  {dailySummary.boq_summary?.total_cost
                    ? `${Number(
                        dailySummary.boq_summary.total_cost
                      ).toLocaleString('fa-IR')} تومان`
                    : '---'}
                </div>
              </div>
            </div>
          )}

          {/* گزارش‌های سلسله‌مراتبی (فقط اگر DailyReport واقعی باشد) */}
          {dailySummary.id !== 0 && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                🌳 گزارش‌های سلسله‌مراتبی
              </h2>

              {sortedReports.length === 0 ? (
                <div className="text-center text-gray-500 py-8 border border-dashed border-gray-200 rounded-lg bg-gray-50 text-sm">
                  هیچ گزارشی برای این تاریخ ثبت نشده است
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedReports.map((report) => (
                    <div
                      key={report.id}
                      className={`bg-gray-50 p-4 rounded-lg border border-gray-200 hover:border-gray-300 transition ${getHierarchyIndent(
                        report.author_position?.hierarchy_level || 0
                      )}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-start gap-3">
                          <div className="text-xl">
                            {getHierarchyIcon(
                              report.author_position?.hierarchy_level || 0
                            )}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-gray-800">
                                {report.author_name || 'نامشخص'}
                              </span>
                              <span className="text-[11px] bg-gray-200 px-2 py-0.5 rounded text-gray-700">
                                {report.position_title || 'بدون سمت'}
                              </span>
                            </div>
                            <div className="text-xs text-gray-500">
                              🕐{' '}
                              {new Date(
                                report.created_at
                              ).toLocaleTimeString('fa-IR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </div>
                          </div>
                        </div>
                        {getStatusBadge(report.status)}
                      </div>

                      {report.work_summary && (
                        <div className="bg-white p-3 rounded border border-gray-200 text-xs text-gray-700 whitespace-pre-wrap">
                          {report.work_summary}
                        </div>
                      )}

                      {report.issues && (
                        <div className="mt-2 bg-red-50 border border-red-200 p-2 rounded text-xs text-red-700">
                          ⚠️ {report.issues}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* فهرست‌بها (اگر هست) */}
          {dailySummary.boq_summary &&
            dailySummary.boq_summary.reports_count > 0 && (
              <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
                <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  💰 فهرست‌بها
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-500 text-xs mb-1">
                      تعداد گزارش‌ها
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {dailySummary.boq_summary.reports_count}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-500 text-xs mb-1">
                      تعداد آیتم‌ها
                    </div>
                    <div className="text-lg font-semibold text-gray-800">
                      {dailySummary.boq_summary.entries_count}
                    </div>
                  </div>
                  <div className="bg-gray-50 p-3 rounded border border-gray-200">
                    <div className="text-gray-500 text-xs mb-1">
                      جمع کل هزینه
                    </div>
                    <div className="text-lg font-bold text-blue-700">
                      {Number(
                        dailySummary.boq_summary.total_cost
                      ).toLocaleString('fa-IR')}{' '}
                      تومان
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* حضور و غیاب (حتی اگر هیچ DailyReport نباشد، فقط کافی است workers_attendance پر باشد) */}
          {hasAttendance && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-200">
              <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                👥 حضور و غیاب
                <span className="text-xs text-gray-500 font-normal">
                  ({dailySummary.statistics?.present_workers || 0} از{' '}
                  {dailySummary.statistics?.total_workers || 0} نفر)
                </span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-xs md:text-sm">
                  <thead className="bg-gray-100 text-gray-600">
                    <tr>
                      <th className="px-3 md:px-4 py-2 text-right">نام</th>
                      <th className="px-3 md:px-4 py-2 text-center">ورود</th>
                      <th className="px-3 md:px-4 py-2 text-center">خروج</th>
                      <th className="px-3 md:px-4 py-2 text-center">
                        اضافه‌کار
                      </th>
                      <th className="px-3 md:px-4 py-2 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {dailySummary.workers_attendance.map((att, idx) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-3 md:px-4 py-2 text-gray-800 font-medium">
                          {att.worker_name}
                        </td>
                        <td className="px-3 md:px-4 py-2 text-center text-gray-700 font-mono">
                          {formatTime(att.time_in)}
                        </td>
                        <td className="px-3 md:px-4 py-2 text-center text-gray-700 font-mono">
                          {formatTime(att.time_out)}
                        </td>
                        <td className="px-3 md:px-4 py-2 text-center text-gray-700 font-mono">
                          {att.overtime_hours > 0
                            ? `${att.overtime_hours} ساعت`
                            : '---'}
                        </td>
                        <td className="px-3 md:px-4 py-2 text-center">
                          {getAttendanceStatusBadge(att.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DailySummaryScreen;
