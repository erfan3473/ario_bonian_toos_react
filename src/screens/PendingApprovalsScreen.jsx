// src/screens/PendingApprovalsScreen.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  fetchPendingApprovals, 
  approveReport, 
  clearErrors 
} from '../features/reports/reportSlice';

const PendingApprovalsScreen = () => {
  const dispatch = useDispatch();
  
  // ✅ State از Redux
  const { pendingReports, loading, actionLoading, error, actionError } = useSelector(
    (state) => state.reports
  );

  // ✅ Local state
  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [successMessage, setSuccessMessage] = useState('');

  // ✅ بارگذاری اولیه
  useEffect(() => {
    dispatch(fetchPendingApprovals());
  }, [dispatch]);

  // ✅ پاک کردن خطاها هنگام unmount
  useEffect(() => {
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  // ✅ فیلتر و جستجو
  const filteredReports = useMemo(() => {
    let filtered = pendingReports;

    // جستجو
    if (searchTerm.trim()) {
      filtered = filtered.filter(
        (report) =>
          report.author_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.position_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          report.work_summary?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // فیلتر وضعیت
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((report) => report.status === filterStatus);
    }

    return filtered;
  }, [pendingReports, searchTerm, filterStatus]);

  // ✅ تابع تایید
  const handleApprove = (reportId) => {
    dispatch(approveReport({ reportId, decision: 'APPROVED' }))
      .unwrap()
      .then(() => {
        setSuccessMessage('✅ گزارش با موفقیت تایید شد');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Error approving report:', err);
      });
  };

  // ✅ تابع رد
  const handleReject = (reportId) => {
    if (!rejectNotes.trim()) {
      alert('⚠️ لطفاً دلیل رد را وارد کنید');
      return;
    }

    dispatch(
      approveReport({ reportId, decision: 'REJECTED', notes: rejectNotes })
    )
      .unwrap()
      .then(() => {
        setSuccessMessage('❌ گزارش رد شد');
        setSelectedReport(null);
        setRejectNotes('');
        setTimeout(() => setSuccessMessage(''), 3000);
      })
      .catch((err) => {
        console.error('Error rejecting report:', err);
      });
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

  // ✅ آیکون سلسله‌مراتب
  const getHierarchyIcon = (level) => {
    const icons = {
      0: '👑',
      1: '🔧',
      2: '👔',
      3: '👷',
    };
    return icons[level] || '👤';
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-gray-900">
      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Header */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
          📋 گزارش‌های در انتظار تایید
        </h1>
        <p className="text-gray-400">
          تایید یا رد گزارش‌های زیردستان خود
        </p>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Success Message */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {successMessage && (
        <div className="bg-green-900/50 text-green-200 p-4 rounded-lg border border-green-700 mb-6 animate-pulse">
          {successMessage}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Errors */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {(error || actionError) && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg border border-red-700 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">❌</span>
              <span>{error || actionError}</span>
            </div>
            <button
              onClick={() => dispatch(clearErrors())}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Filters & Search */}
      {/* ═══════════════════════════════════════════════════════════ */}
      <div className="bg-gray-800 p-4 rounded-xl shadow-lg border border-gray-700 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          {/* جستجو */}
          <div className="flex-grow min-w-[250px]">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 جستجو در نام، سمت یا متن گزارش..."
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
          </div>

          {/* فیلتر وضعیت */}
          <div className="min-w-[200px]">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full bg-gray-700 text-white px-4 py-2 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">همه وضعیت‌ها</option>
              <option value="SUBMITTED">منتظر تایید</option>
              <option value="APPROVED">تایید شده</option>
              <option value="REJECTED">رد شده</option>
            </select>
          </div>

          {/* دکمه رفرش */}
          <button
            onClick={() => dispatch(fetchPendingApprovals())}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳' : '🔄'} رفرش
          </button>
        </div>

        {/* آمار */}
        <div className="flex gap-4 mt-4 text-sm">
          <div className="text-gray-400">
            <span className="font-bold text-white">
              {pendingReports.length}
            </span>{' '}
            گزارش کل
          </div>
          <div className="text-yellow-400">
            <span className="font-bold">
              {pendingReports.filter((r) => r.status === 'SUBMITTED').length}
            </span>{' '}
            منتظر تایید
          </div>
          <div className="text-green-400">
            <span className="font-bold">
              {pendingReports.filter((r) => r.status === 'APPROVED').length}
            </span>{' '}
            تایید شده
          </div>
          <div className="text-red-400">
            <span className="font-bold">
              {pendingReports.filter((r) => r.status === 'REJECTED').length}
            </span>{' '}
            رد شده
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Loading */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {loading && (
        <div className="text-center py-20">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-blue-400 text-lg">در حال بارگذاری گزارش‌ها...</p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Empty State */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {!loading && filteredReports.length === 0 && (
        <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-700 rounded-xl">
          <div className="text-6xl mb-4">📭</div>
          <p className="text-xl mb-2">
            {searchTerm || filterStatus !== 'ALL'
              ? 'نتیجه‌ای یافت نشد'
              : 'گزارشی برای تایید وجود ندارد'}
          </p>
          <p className="text-sm text-gray-600">
            {searchTerm || filterStatus !== 'ALL'
              ? 'فیلترها را تغییر دهید'
              : 'هیچ گزارش معلقی برای بررسی نیست'}
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════ */}
      {/* Reports List */}
      {/* ═══════════════════════════════════════════════════════════ */}
      {!loading && (
        <div className="grid gap-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-gray-800 p-5 rounded-xl border border-gray-700 hover:border-gray-600 transition shadow-lg"
            >
              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Header */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="flex justify-between items-start mb-4">
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
                    <p className="text-sm text-gray-400 mt-1">
                      🏗️ پروژه:{' '}
                      {report.daily_report?.project_name || 'نامشخص'}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      🕐{' '}
                      {new Date(report.created_at).toLocaleString('fa-IR', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
                {getStatusBadge(report.status)}
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Work Summary */}
              {/* ═══════════════════════════════════════════════════════════ */}
              <div className="bg-gray-900 p-4 rounded-lg mb-3">
                <div className="text-gray-400 text-xs mb-1 font-bold">
                  📝 خلاصه کار:
                </div>
                <div className="text-gray-300 text-sm whitespace-pre-wrap">
                  {report.work_summary || 'بدون متن'}
                </div>
              </div>

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Issues */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {report.issues && (
                <div className="bg-red-900/20 border border-red-700 p-3 rounded-lg mb-3">
                  <div className="text-red-400 text-xs mb-1 font-bold">
                    ⚠️ مشکلات:
                  </div>
                  <div className="text-red-300 text-sm">{report.issues}</div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Media Files */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {report.media_files && report.media_files.length > 0 && (
                <div className="mb-4">
                  <div className="text-gray-400 text-xs mb-2 font-bold">
                    🖼️ فایل‌های پیوست ({report.media_files.length}):
                  </div>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {report.media_files.map((media) => (
                      <div
                        key={media.id}
                        className="flex-shrink-0 relative group"
                      >
                        <img
                          src={media.file}
                          alt="media"
                          className="w-24 h-24 object-cover rounded border border-gray-600 cursor-pointer hover:scale-110 transition"
                          onClick={() => window.open(media.file, '_blank')}
                        />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition flex items-center justify-center rounded">
                          <span className="text-white text-xs">🔍</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Actions for SUBMITTED reports */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {report.status === 'SUBMITTED' && (
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => handleApprove(report.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {actionLoading ? '⏳' : '✅'} تایید
                  </button>
                  <button
                    onClick={() => setSelectedReport(report.id)}
                    disabled={actionLoading}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    ❌ رد
                  </button>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Reject Modal */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {selectedReport === report.id && (
                <div className="mt-4 bg-gray-900 p-4 rounded-lg border-2 border-red-500 animate-pulse">
                  <label className="text-red-400 text-sm font-bold mb-2 block">
                    دلیل رد گزارش:
                  </label>
                  <textarea
                    value={rejectNotes}
                    onChange={(e) => setRejectNotes(e.target.value)}
                    placeholder="لطفاً دلیل رد را به طور دقیق توضیح دهید..."
                    className="w-full bg-gray-800 text-white p-3 rounded border border-gray-600 focus:ring-2 focus:ring-red-500 focus:outline-none mb-3"
                    rows="4"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReject(report.id)}
                      disabled={actionLoading || !rejectNotes.trim()}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded font-bold transition disabled:opacity-50"
                    >
                      {actionLoading ? '⏳ در حال پردازش...' : 'تایید رد'}
                    </button>
                    <button
                      onClick={() => {
                        setSelectedReport(null);
                        setRejectNotes('');
                      }}
                      disabled={actionLoading}
                      className="flex-1 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded font-bold transition disabled:opacity-50"
                    >
                      لغو
                    </button>
                  </div>
                </div>
              )}

              {/* ═══════════════════════════════════════════════════════════ */}
              {/* Approval Info */}
              {/* ═══════════════════════════════════════════════════════════ */}
              {report.status === 'APPROVED' && report.approved_by && (
                <div className="mt-4 text-xs text-green-400 bg-green-900/20 p-3 rounded border border-green-700">
                  ✅ <strong>تایید شده توسط:</strong>{' '}
                  {report.approved_by?.username || 'نامشخص'}
                  {report.approved_at && (
                    <>
                      {' | '}
                      <span>
                        {new Date(report.approved_at).toLocaleString('fa-IR')}
                      </span>
                    </>
                  )}
                </div>
              )}

              {report.status === 'REJECTED' && (
                <div className="mt-4 text-xs text-red-400 bg-red-900/20 p-3 rounded border border-red-700">
                  <div>
                    ❌ <strong>رد شده</strong>
                  </div>
                  {report.rejection_reason && (
                    <div className="mt-2">
                      <strong>دلیل:</strong> {report.rejection_reason}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovalsScreen;
