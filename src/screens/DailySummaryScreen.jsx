// src/screens/DailySummaryScreen.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDailySummary } from '../features/reports/reportSlice';
import { fetchProjects } from '../features/projects/projectSlice';

const DailySummaryScreen = () => {
  const dispatch = useDispatch();
  
  // ✅ اصلاح selector ها
  const { dailySummary, summaryLoading, summaryError } = useSelector((state) => state.reports);
  const { list: projectsList, loading: projectsLoading } = useSelector((state) => state.projects);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // ✅ بارگذاری اولیه پروژه‌ها
  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // ✅ بارگذاری خلاصه روزانه
  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      dispatch(
        fetchDailySummary({ projectId: selectedProjectId, date: selectedDate })
      );
    }
  }, [dispatch, selectedProjectId, selectedDate]);

  // ✅ مرتب‌سازی گزارش‌های سلسله‌مراتبی
  const sortedReports = useMemo(() => {
    if (!dailySummary?.hierarchical_reports) return [];
    return [...dailySummary.hierarchical_reports].sort(
      (a, b) => 
        (a.author_position?.hierarchy_level || 0) - 
        (b.author_position?.hierarchy_level || 0)
    );
  }, [dailySummary?.hierarchical_reports]);

  // ✅ تابع indent بر اساس سطح سلسله‌مراتب
  const getHierarchyIndent = (level) => {
    const indents = {
      0: 'mr-0',      // مدیر پروژه
      1: 'mr-8',      // سرپرست کارگاه
      2: 'mr-16',     // سرکارگر
      3: 'mr-24',     // کارگر
    };
    return indents[level] || 'mr-0';
  };

  // ✅ آیکون بر اساس سطح سلسله‌مراتب
  const getHierarchyIcon = (level) => {
    const icons = {
      0: '👑',  // مدیر پروژه
      1: '🔧',  // سرپرست کارگاه
      2: '👔',  // سرکارگر
      3: '👷',  // کارگر
    };
    return icons[level] || '👤';
  };

  // ✅ Badge وضعیت
  const getStatusBadge = (status) => {
    const configs = {
      DRAFT: {
        bg: 'bg-gray-900/30',
        text: 'text-gray-400',
        border: 'border-gray-700',
        label: 'پیش‌نویس',
      },
      SUBMITTED: {
        bg: 'bg-yellow-900/30',
        text: 'text-yellow-400',
        border: 'border-yellow-700',
        label: 'منتظر تایید',
      },
      APPROVED: {
        bg: 'bg-green-900/30',
        text: 'text-green-400',
        border: 'border-green-700',
        label: 'تایید شده',
      },
      REJECTED: {
        bg: 'bg-red-900/30',
        text: 'text-red-400',
        border: 'border-red-700',
        label: 'رد شده',
      },
      FINAL: {
        bg: 'bg-blue-900/30',
        text: 'text-blue-400',
        border: 'border-blue-700',
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

  // ✅ فرمت تاریخ فارسی
  const formatPersianDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-gray-900">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Header */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          📅 خلاصه روزانه پروژه
        </h1>
        <p className="text-gray-400">
          نمای کامل گزارش‌ها، حضور و غیاب، و فهرست بها
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Filters */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* انتخاب پروژه */}
          <div className="flex-grow min-w-[250px]">
            <label className="text-gray-400 text-sm mb-1 block">پروژه</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
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
          <div className="min-w-[200px]">
            <label className="text-gray-400 text-sm mb-1 block">تاریخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* دکمه رفرش */}
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
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {summaryLoading ? '⏳ در حال بارگذاری...' : '🔄 رفرش'}
            </button>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Loading State */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {summaryLoading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-400 text-lg">در حال بارگذاری خلاصه روزانه...</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Error State */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {summaryError && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-700 mb-6">
          <div className="flex items-center gap-2">
            <span className="text-2xl">❌</span>
            <span>{summaryError}</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* No Project Selected */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {!selectedProjectId && !summaryLoading && (
        <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-700 rounded-xl">
          <div className="text-6xl mb-4">📊</div>
          <p className="text-xl">لطفاً ابتدا یک پروژه انتخاب کنید</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Summary Content */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {dailySummary && !summaryLoading && (
        <>
          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Stats Cards */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* تعداد گزارش‌ها */}
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-4 rounded-xl border border-blue-700/50">
              <div className="text-blue-400 text-sm mb-1">تعداد گزارش‌ها</div>
              <div className="text-3xl font-bold text-white">
                {dailySummary.statistics?.total_hierarchical_reports || 0}
              </div>
            </div>

            {/* تایید شده */}
            <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 p-4 rounded-xl border border-green-700/50">
              <div className="text-green-400 text-sm mb-1">تایید شده</div>
              <div className="text-3xl font-bold text-white">
                {dailySummary.statistics?.approved_reports || 0}
              </div>
            </div>

            {/* منتظر تایید */}
            <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 p-4 rounded-xl border border-yellow-700/50">
              <div className="text-yellow-400 text-sm mb-1">منتظر تایید</div>
              <div className="text-3xl font-bold text-white">
                {dailySummary.statistics?.pending_reports || 0}
              </div>
            </div>

            {/* هزینه فهرست بها */}
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4 rounded-xl border border-purple-700/50">
              <div className="text-purple-400 text-sm mb-1">هزینه فهرست بها</div>
              <div className="text-2xl font-bold text-white font-mono">
                {dailySummary.boq_summary?.total_cost
                  ? `${Number(dailySummary.boq_summary.total_cost).toLocaleString('fa-IR')} ت`
                  : '---'}
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Hierarchical Reports */}
          {/* ═══════════════════════════════════════════════════════════ */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🌳 گزارش‌های سلسله‌مراتبی
            </h2>

            {sortedReports.length === 0 ? (
              <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-700 rounded-xl">
                <div className="text-5xl mb-3">📝</div>
                <p className="text-lg">هیچ گزارشی برای این تاریخ ثبت نشده است</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedReports.map((report) => (
                  <div
                    key={report.id}
                    className={`bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition ${getHierarchyIndent(
                      report.author_position?.hierarchy_level || 0
                    )}`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">
                          {getHierarchyIcon(
                            report.author_position?.hierarchy_level || 0
                          )}
                        </div>
                        <div>
                          <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            {report.author_name || 'نامشخص'}
                            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                              {report.position_title || 'بدون سمت'}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-400">
                            🕐{' '}
                            {new Date(report.created_at).toLocaleTimeString(
                              'fa-IR',
                              { hour: '2-digit', minute: '2-digit' }
                            )}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    {/* Content */}
                    <div className="bg-gray-800 p-3 rounded mb-3 text-gray-300 text-sm whitespace-pre-wrap">
                      {report.work_summary || 'بدون متن'}
                    </div>

                    {/* Issues */}
                    {report.issues && (
                      <div className="bg-red-900/20 border border-red-700 p-3 rounded mb-3 text-red-300 text-sm">
                        <strong>⚠️ مشکلات:</strong> {report.issues}
                      </div>
                    )}

                    {/* Media Files */}
                    {report.media_files && report.media_files.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto mb-3">
                        {report.media_files.map((media) => (
                          <img
                            key={media.id}
                            src={media.file}
                            alt="media"
                            className="w-24 h-24 object-cover rounded border border-gray-600 cursor-pointer hover:scale-105 transition"
                            onClick={() => window.open(media.file, '_blank')}
                          />
                        ))}
                      </div>
                    )}

                    {/* Approval Info */}
                    {report.status === 'APPROVED' && report.approved_by && (
                      <div className="text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-700">
                        ✅ تایید شده توسط: {report.approved_by?.username} |{' '}
                        {new Date(report.approved_at).toLocaleString('fa-IR')}
                      </div>
                    )}

                    {report.status === 'REJECTED' && (
                      <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-700">
                        ❌ رد شده | دلیل:{' '}
                        {report.rejection_reason || 'ذکر نشده'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* BOQ Summary */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {dailySummary.boq_summary && dailySummary.boq_summary.reports_count > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                💰 فهرست بها
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">تعداد گزارش‌ها</div>
                  <div className="text-2xl font-bold text-white">
                    {dailySummary.boq_summary.reports_count}
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">تعداد آیتم‌ها</div>
                  <div className="text-2xl font-bold text-white">
                    {dailySummary.boq_summary.entries_count}
                  </div>
                </div>
                <div className="bg-gray-900 p-4 rounded-lg">
                  <div className="text-gray-400 text-sm mb-1">جمع کل هزینه</div>
                  <div className="text-xl font-bold text-yellow-400 font-mono">
                    {Number(dailySummary.boq_summary.total_cost).toLocaleString('fa-IR')} تومان
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════ */}
          {/* Attendance */}
          {/* ═══════════════════════════════════════════════════════════ */}
          {dailySummary.workers_attendance &&
            dailySummary.workers_attendance.length > 0 && (
              <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
                  👥 حضور و غیاب
                  <span className="text-sm text-gray-400 font-normal">
                    ({dailySummary.statistics?.present_workers || 0} از{' '}
                    {dailySummary.statistics?.total_workers || 0} نفر)
                  </span>
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-900 text-gray-400">
                      <tr>
                        <th className="px-4 py-2 text-right">نام</th>
                        <th className="px-4 py-2 text-right">سمت</th>
                        <th className="px-4 py-2 text-center">ورود</th>
                        <th className="px-4 py-2 text-center">خروج</th>
                        <th className="px-4 py-2 text-center">اضافه‌کار</th>
                        <th className="px-4 py-2 text-center">وضعیت</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                      {dailySummary.workers_attendance.map((att, idx) => (
                        <tr key={idx} className="hover:bg-gray-700/30">
                          <td className="px-4 py-3 text-white font-medium">
                            {att.worker_name}
                          </td>
                          <td className="px-4 py-3 text-gray-400">
                            {att.position}
                          </td>
                          <td className="px-4 py-3 text-center text-green-400 font-mono">
                            {att.time_in || '---'}
                          </td>
                          <td className="px-4 py-3 text-center text-red-400 font-mono">
                            {att.time_out || '---'}
                          </td>
                          <td className="px-4 py-3 text-center text-yellow-400 font-mono">
                            {att.overtime_hours > 0
                              ? `${att.overtime_hours} ساعت`
                              : '---'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`px-2 py-1 rounded text-xs font-bold ${
                                att.status === 'PRESENT'
                                  ? 'bg-green-900/30 text-green-400'
                                  : 'bg-red-900/30 text-red-400'
                              }`}
                            >
                              {att.status === 'PRESENT' ? 'حاضر' : att.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
        </>
      )}
    </div>
  );
};

export default DailySummaryScreen;
