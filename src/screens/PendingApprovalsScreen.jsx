// src/screens/PendingApprovalsScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchPendingApprovals, approveReport } from '../features/reports/reportSlice';

const PendingApprovalsScreen = () => {
  const dispatch = useDispatch();
  const { pendingReports, loading, actionLoading, error } = useSelector(
    (state) => state.reports
  );

  const [selectedReport, setSelectedReport] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');

  useEffect(() => {
    dispatch(fetchPendingApprovals());
  }, [dispatch]);

  const handleApprove = (reportId) => {
    dispatch(approveReport({ reportId, decision: 'APPROVED' }))
      .unwrap()
      .then(() => {
        alert('گزارش تایید شد');
        dispatch(fetchPendingApprovals()); // رفرش لیست
      })
      .catch((err) => alert(err));
  };

  const handleReject = (reportId) => {
    if (!rejectNotes.trim()) {
      alert('لطفاً دلیل رد را وارد کنید');
      return;
    }

    dispatch(
      approveReport({ reportId, decision: 'REJECTED', notes: rejectNotes })
    )
      .unwrap()
      .then(() => {
        alert('گزارش رد شد');
        setSelectedReport(null);
        setRejectNotes('');
        dispatch(fetchPendingApprovals());
      })
      .catch((err) => alert(err));
  };

  const getStatusBadge = (status) => {
    const colors = {
      SUBMITTED: 'bg-yellow-500',
      APPROVED: 'bg-green-500',
      REJECTED: 'bg-red-500',
    };
    return (
      <span
        className={`px-2 py-1 rounded text-white text-xs ${
          colors[status] || 'bg-gray-500'
        }`}
      >
        {status === 'SUBMITTED'
          ? 'منتظر تایید'
          : status === 'APPROVED'
          ? 'تایید شده'
          : 'رد شده'}
      </span>
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl">
      <h1 className="text-3xl font-bold text-white mb-6">
        📋 گزارش‌های در انتظار تایید
      </h1>

      {loading && (
        <div className="text-center text-blue-400 animate-pulse">
          در حال بارگذاری...
        </div>
      )}

      {error && (
        <div className="bg-red-900/50 text-red-200 p-4 rounded-lg mb-4">
          {error}
        </div>
      )}

      {!loading && pendingReports.length === 0 && (
        <div className="text-center text-gray-500 py-20 border-2 border-dashed border-gray-700 rounded-xl">
          گزارشی برای تایید وجود ندارد
        </div>
      )}

      <div className="grid gap-4">
        {pendingReports.map((report) => (
          <div
            key={report.id}
            className="bg-gray-800 p-4 rounded-lg border border-gray-700 hover:border-gray-600 transition"
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="text-white font-bold text-lg">
                  {report.author_name}
                </h3>
                <p className="text-sm text-gray-400">
                  {report.position_title} | {report.project_name}
                </p>
              </div>
              {getStatusBadge(report.status)}
            </div>

            {/* Content */}
            <div className="bg-gray-900 p-3 rounded mb-3 text-gray-300 text-sm">
              {report.work_summary || 'بدون متن'}
            </div>

            {/* Media Files */}
            {report.media_files && report.media_files.length > 0 && (
              <div className="flex gap-2 mb-3 overflow-x-auto">
                {report.media_files.map((media) => (
                  <img
                    key={media.id}
                    src={media.file}
                    alt="media"
                    className="w-20 h-20 object-cover rounded border border-gray-600"
                  />
                ))}
              </div>
            )}

            {/* Timestamp */}
            <p className="text-xs text-gray-500 mb-3">
              🕐 {new Date(report.created_at).toLocaleString('fa-IR')}
            </p>

            {/* Actions */}
            {report.status === 'SUBMITTED' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleApprove(report.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded disabled:opacity-50"
                >
                  ✅ تایید
                </button>
                <button
                  onClick={() => setSelectedReport(report.id)}
                  disabled={actionLoading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded disabled:opacity-50"
                >
                  ❌ رد
                </button>
              </div>
            )}

            {/* Reject Modal */}
            {selectedReport === report.id && (
              <div className="mt-3 bg-gray-900 p-3 rounded border border-red-500">
                <textarea
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="دلیل رد گزارش را وارد کنید..."
                  className="w-full bg-gray-800 text-white p-2 rounded mb-2"
                  rows="3"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => handleReject(report.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded"
                  >
                    تایید رد
                  </button>
                  <button
                    onClick={() => {
                      setSelectedReport(null);
                      setRejectNotes('');
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-1 rounded"
                  >
                    لغو
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default PendingApprovalsScreen;
