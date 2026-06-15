// src/components/admin/tabs/LeaveRequestsTab.jsx

import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchLeaveRequests,
  approveLeaveRequest,
  rejectLeaveRequest,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';

const LeaveRequestsTab = () => {
  const dispatch = useDispatch();
  const { leaveRequests, loading, updateStatus } = useSelector((state) => state.admin);

  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchLeaveRequests(statusFilter));
  }, [dispatch, statusFilter]);

  useEffect(() => {
    if (updateStatus.success) {
      dispatch(fetchLeaveRequests(statusFilter));
      dispatch(resetUpdateStatus());
    }
  }, [updateStatus.success, dispatch, statusFilter]);

  // فیلتر جستجو
  const filteredRequests = useMemo(() => {
    return leaveRequests.filter((req) =>
      req.employee_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.leave_type?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [leaveRequests, searchTerm]);

  const handleApprove = (requestId, employeeName) => {
    if (window.confirm(`آیا درخواست "${employeeName}" را تایید می‌کنید؟`)) {
      dispatch(approveLeaveRequest(requestId));
    }
  };

  const handleReject = (requestId, employeeName) => {
    const reason = window.prompt(`دلیل رد درخواست "${employeeName}":`);
    if (reason) {
      dispatch(rejectLeaveRequest({ requestId, reason }));
    }
  };

  const statusConfig = {
    PENDING: { label: '⏳ در انتظار', color: 'yellow', bgClass: 'bg-yellow-900/30 border-yellow-700' },
    APPROVED: { label: '✅ تایید شده', color: 'green', bgClass: 'bg-green-900/30 border-green-700' },
    REJECTED: { label: '❌ رد شده', color: 'red', bgClass: 'bg-red-900/30 border-red-700' },
  };

  // آمار
  const stats = useMemo(() => ({
    pending: leaveRequests.filter((r) => r.status === 'PENDING').length,
    approved: leaveRequests.filter((r) => r.status === 'APPROVED').length,
    rejected: leaveRequests.filter((r) => r.status === 'REJECTED').length,
  }), [leaveRequests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white">🏖️ درخواست‌های مرخصی</h2>
          <p className="text-gray-400 text-sm mt-1">مدیریت و بررسی درخواست‌های مرخصی کارکنان</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <button
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'PENDING'
              ? 'bg-yellow-900/40 border-yellow-500 scale-105'
              : 'bg-gray-800 border-gray-700 hover:border-yellow-600'
          }`}
        >
          <div className="text-3xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-gray-400 text-sm">در انتظار تایید</div>
        </button>

        <button
          onClick={() => setStatusFilter('APPROVED')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'APPROVED'
              ? 'bg-green-900/40 border-green-500 scale-105'
              : 'bg-gray-800 border-gray-700 hover:border-green-600'
          }`}
        >
          <div className="text-3xl font-bold text-green-400">{stats.approved}</div>
          <div className="text-gray-400 text-sm">تایید شده</div>
        </button>

        <button
          onClick={() => setStatusFilter('REJECTED')}
          className={`p-4 rounded-xl border-2 transition-all ${
            statusFilter === 'REJECTED'
              ? 'bg-red-900/40 border-red-500 scale-105'
              : 'bg-gray-800 border-gray-700 hover:border-red-600'
          }`}
        >
          <div className="text-3xl font-bold text-red-400">{stats.rejected}</div>
          <div className="text-gray-400 text-sm">رد شده</div>
        </button>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="🔍 جستجو بر اساس نام یا نوع مرخصی..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 bg-gray-700 text-white px-4 py-3 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <button
          onClick={() => setStatusFilter('')}
          className={`px-6 py-3 rounded-lg font-bold transition ${
            statusFilter === ''
              ? 'bg-blue-600 text-white'
              : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
          }`}
        >
          همه
        </button>
      </div>

      {/* Loading */}
      {loading.leaveRequests && (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      )}

      {/* List */}
      {!loading.leaveRequests && (
        <div className="space-y-4">
          {filteredRequests.length === 0 ? (
            <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
              <div className="text-5xl mb-4">📋</div>
              <p className="text-gray-400 text-xl">درخواستی یافت نشد</p>
            </div>
          ) : (
            filteredRequests.map((request) => {
              const config = statusConfig[request.status] || statusConfig.PENDING;

              return (
                <div
                  key={request.id}
                  className={`rounded-xl p-5 border-2 ${config.bgClass} transition-all hover:scale-[1.01]`}
                >
                  <div className="flex items-start justify-between gap-4">
                    {/* Info */}
                    <div className="flex items-start gap-4 flex-1">
                      {/* Avatar */}
                      <div
                        className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                        style={{ backgroundColor: request.leave_type_color || '#3B82F6' }}
                      >
                        {request.employee_name?.[0] || '؟'}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-white font-bold text-lg">
                            {request.employee_name}
                          </h4>
                          <span className={`text-xs px-2 py-1 rounded-full bg-${config.color}-600/30 text-${config.color}-400 border border-${config.color}-600`}>
                            {config.label}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div>
                            <span className="text-gray-500">نوع مرخصی:</span>
                            <p className="text-white font-medium">{request.leave_type}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">تاریخ شروع:</span>
                            <p className="text-white font-medium">{request.start_date}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">تاریخ پایان:</span>
                            <p className="text-white font-medium">{request.end_date}</p>
                          </div>
                          <div>
                            <span className="text-gray-500">مدت:</span>
                            <p className="text-white font-medium">{request.total_days} روز</p>
                          </div>
                        </div>

                        {request.reason && (
                          <div className="mt-3 bg-gray-900/50 rounded-lg p-3">
                            <span className="text-gray-500 text-sm">💬 دلیل: </span>
                            <span className="text-gray-300 text-sm">{request.reason}</span>
                          </div>
                        )}

                        {request.employee_position && (
                          <p className="text-gray-500 text-xs mt-2">
                            سمت: {request.employee_position}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions - فقط برای PENDING */}
                    {request.status === 'PENDING' && (
                      <div className="flex flex-col gap-2">
                        <button
                          onClick={() => handleApprove(request.id, request.employee_name)}
                          disabled={updateStatus.loading}
                          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2"
                        >
                          ✅ تایید
                        </button>
                        <button
                          onClick={() => handleReject(request.id, request.employee_name)}
                          disabled={updateStatus.loading}
                          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg font-bold transition disabled:opacity-50 flex items-center gap-2"
                        >
                          ❌ رد
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Timestamp */}
                  <div className="mt-3 pt-3 border-t border-gray-700/50 flex justify-between items-center text-xs text-gray-500">
                    <span>🕐 ثبت شده: {new Date(request.created_at).toLocaleDateString('fa-IR')}</span>
                    <span>#{request.id}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default LeaveRequestsTab;
