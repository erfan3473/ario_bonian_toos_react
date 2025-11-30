// src/screens/DailySummaryScreen.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDailySummary } from '../features/reports/reportSlice';
import { fetchProjects } from '../features/workers/workerSlice';

const DailySummaryScreen = () => {
  const dispatch = useDispatch();
  const { dailySummary, loading, error } = useSelector((state) => state.reports);
  const { list: projectsList } = useSelector((state) => state.workers.projects);

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      dispatch(fetchDailySummary({ projectId: selectedProjectId, date: selectedDate }));
    }
  }, [dispatch, selectedProjectId, selectedDate]);

  // ✅ محاسبه گزارش‌های مرتب شده با useMemo
  const sortedReports = useMemo(() => {
    if (!dailySummary?.hierarchical_reports) return [];
    
    // کپی آرایه قبل از sort
    return [...dailySummary.hierarchical_reports]
      .sort((a, b) => a.hierarchy_level - b.hierarchy_level);
  }, [dailySummary?.hierarchical_reports]);

  // تبدیل hierarchy_level به نمایش بصری
  const getHierarchyIndent = (level) => {
    const indents = {
      0: 'mr-0',      // مدیر پروژه
      1: 'mr-8',      // سرپرست کارگاه
      2: 'mr-16',     // سرکارگر
      3: 'mr-24',     // کارگر
    };
    return indents[level] || 'mr-0';
  };

  const getHierarchyIcon = (level) => {
    const icons = {
      0: '👑',  // مدیر پروژه
      1: '🔧',  // سرپرست کارگاه
      2: '👔',  // سرکارگر
      3: '👷',  // کارگر
    };
    return icons[level] || '👤';
  };

  const getStatusBadge = (status) => {
    const configs = {
      SUBMITTED: { 
        bg: 'bg-yellow-900/30', 
        text: 'text-yellow-400', 
        border: 'border-yellow-700', 
        label: 'منتظر تایید' 
      },
      APPROVED: { 
        bg: 'bg-green-900/30', 
        text: 'text-green-400', 
        border: 'border-green-700', 
        label: 'تایید شده' 
      },
      REJECTED: { 
        bg: 'bg-red-900/30', 
        text: 'text-red-400', 
        border: 'border-red-700', 
        label: 'رد شده' 
      },
    };
    const config = configs[status] || configs.SUBMITTED;
    
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold border ${config.bg} ${config.text} ${config.border}`}>
        {config.label}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-gray-900">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          📅 خلاصه روزانه پروژه
        </h1>
        <p className="text-gray-400">نمای کامل گزارش‌ها، حضور و غیاب، و فهرست بها</p>
      </div>

      {/* Filters */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-grow">
            <label className="text-gray-400 text-sm mb-1 block">پروژه</label>
            <select
              value={selectedProjectId || ''}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
            >
              <option value="">انتخاب پروژه</option>
              {projectsList.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-gray-400 text-sm mb-1 block">تاریخ</label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-end">
            <button
              onClick={() => {
                if (selectedProjectId && selectedDate) {
                  dispatch(fetchDailySummary({ projectId: selectedProjectId, date: selectedDate }));
                }
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition"
            >
              🔄 رفرش
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center text-blue-400 animate-pulse py-20">
          در حال بارگذاری...
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-700 mb-6">
          ❌ {error}
        </div>
      )}

      {/* No Project Selected */}
      {!selectedProjectId && !loading && (
        <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-700 rounded-xl">
          لطفاً ابتدا یک پروژه انتخاب کنید
        </div>
      )}

      {/* Summary Content */}
      {dailySummary && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gradient-to-br from-blue-900/40 to-blue-800/20 p-4 rounded-xl border border-blue-700/50">
              <div className="text-blue-400 text-sm mb-1">تعداد گزارش‌ها</div>
              <div className="text-3xl font-bold text-white">
                {sortedReports.length}
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-900/40 to-green-800/20 p-4 rounded-xl border border-green-700/50">
              <div className="text-green-400 text-sm mb-1">تایید شده</div>
              <div className="text-3xl font-bold text-white">
                {sortedReports.filter(r => r.status === 'APPROVED').length}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-900/40 to-yellow-800/20 p-4 rounded-xl border border-yellow-700/50">
              <div className="text-yellow-400 text-sm mb-1">حاضرین</div>
              <div className="text-3xl font-bold text-white">
                {dailySummary.workers_attendance?.length || 0}
              </div>
            </div>

            <div className="bg-gradient-to-br from-purple-900/40 to-purple-800/20 p-4 rounded-xl border border-purple-700/50">
              <div className="text-purple-400 text-sm mb-1">هزینه فهرست بها</div>
              <div className="text-2xl font-bold text-white font-mono">
                {dailySummary.boq_report?.total_cost 
                  ? `${Number(dailySummary.boq_report.total_cost).toLocaleString('fa-IR')} ت` 
                  : '---'}
              </div>
            </div>
          </div>

          {/* Hierarchical Reports */}
          <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              🌳 گزارش‌های سلسله‌مراتبی
            </h2>

            {sortedReports.length === 0 ? (
              <div className="text-center text-gray-500 py-10 border-2 border-dashed border-gray-700 rounded-xl">
                هیچ گزارشی برای این تاریخ ثبت نشده است
              </div>
            ) : (
              <div className="space-y-3">
                {/* ✅ استفاده از sortedReports */}
                {sortedReports.map((report) => (
                  <div
                    key={report.id}
                    className={`bg-gray-900/50 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition ${getHierarchyIndent(report.hierarchy_level)}`}
                  >
                    {/* Header */}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">{getHierarchyIcon(report.hierarchy_level)}</div>
                        <div>
                          <h3 className="text-white font-bold text-lg flex items-center gap-2">
                            {report.author_name}
                            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                              {report.position_title}
                            </span>
                          </h3>
                          <p className="text-sm text-gray-400">
                            🕐 {new Date(report.created_at).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      {getStatusBadge(report.status)}
                    </div>

                    {/* Content */}
                    <div className="bg-gray-800 p-3 rounded mb-3 text-gray-300 text-sm whitespace-pre-wrap">
                      {report.work_summary || 'بدون متن'}
                    </div>

                    {/* Media */}
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
                    {report.status === 'APPROVED' && report.approved_by_name && (
                      <div className="text-xs text-green-400 bg-green-900/20 p-2 rounded border border-green-700">
                        ✅ تایید شده توسط: {report.approved_by_name} | 
                        {new Date(report.approved_at).toLocaleString('fa-IR')}
                      </div>
                    )}

                    {report.status === 'REJECTED' && (
                      <div className="text-xs text-red-400 bg-red-900/20 p-2 rounded border border-red-700">
                        ❌ رد شده | دلیل: {report.rejection_reason || 'ذکر نشده'}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* BOQ Report */}
          {dailySummary.boq_report && (
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-6">
              <h2 className="text-2xl font-bold text-white mb-4">💰 فهرست بها</h2>
              <div className="bg-gray-900 p-4 rounded-lg">
                <div className="text-gray-300 mb-3">{dailySummary.boq_report.work_summary}</div>
                <div className="text-xl text-yellow-400 font-bold font-mono">
                  جمع کل: {Number(dailySummary.boq_report.total_cost).toLocaleString('fa-IR')} تومان
                </div>
              </div>
            </div>
          )}

          {/* Attendance */}
          {dailySummary.workers_attendance && dailySummary.workers_attendance.length > 0 && (
            <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700">
              <h2 className="text-2xl font-bold text-white mb-4">👥 حضور و غیاب</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-900 text-gray-400">
                    <tr>
                      <th className="px-4 py-2 text-right">نام</th>
                      <th className="px-4 py-2 text-right">سمت</th>
                      <th className="px-4 py-2 text-center">ورود</th>
                      <th className="px-4 py-2 text-center">خروج</th>
                      <th className="px-4 py-2 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {dailySummary.workers_attendance.map((att, idx) => (
                      <tr key={idx} className="hover:bg-gray-700/30">
                        <td className="px-4 py-3 text-white">{att.worker_name}</td>
                        <td className="px-4 py-3 text-gray-400">{att.position}</td>
                        <td className="px-4 py-3 text-center text-green-400 font-mono">
                          {att.time_in || '---'}
                        </td>
                        <td className="px-4 py-3 text-center text-red-400 font-mono">
                          {att.time_out || '---'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded text-xs ${
                            att.status === 'PRESENT' 
                              ? 'bg-green-900/30 text-green-400' 
                              : 'bg-red-900/30 text-red-400'
                          }`}>
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
