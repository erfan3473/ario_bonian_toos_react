// src/components/admin/tabs/LeaveTab.jsx

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchEmployeeLeaveSummary,
  approveLeaveRequest,
  rejectLeaveRequest,
  clearLeaveSummary,
  resetUpdateStatus,
} from '../../../features/admin/adminSlice';

const LeaveTab = ({ user }) => {
  const dispatch = useDispatch();
  const { leaveSummary, loading, updateStatus } = useSelector((state) => state.admin);

  const currentYear = new Date().getFullYear();
  const employeeId = user?.employee_details?.id || user?.employee?.id;
  
  useEffect(() => {
    if (employeeId) {
      dispatch(fetchEmployeeLeaveSummary({ employeeId, year: currentYear }));
    }

    return () => {
      dispatch(clearLeaveSummary());
    };
  }, [dispatch, employeeId, currentYear]);

  useEffect(() => {
    if (updateStatus.success) {
      // بعد از تایید/رد، دوباره دیتا بگیر
      if (employeeId) {
        dispatch(fetchEmployeeLeaveSummary({ employeeId, year: currentYear }));
      }
      dispatch(resetUpdateStatus());
    }
  }, [updateStatus.success, dispatch, employeeId, currentYear]);

  const handleApprove = (requestId) => {
    if (window.confirm('آیا از تایید این درخواست مطمئن هستید؟')) {
      dispatch(approveLeaveRequest(requestId));
    }
  };

  const handleReject = (requestId) => {
    const reason = window.prompt('دلیل رد درخواست را وارد کنید:');
    if (reason) {
      dispatch(rejectLeaveRequest({ requestId, reason }));
    }
  };

  if (!user || !employeeId) {
    return (
      <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6 text-center">
        <p className="text-yellow-400">⚠️ این کاربر کارمند نیست</p>
      </div>
    );
  }

  if (loading.leaveSummary) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-white font-bold text-xl">🏖️ وضعیت مرخصی</h3>
        <span className="text-gray-400 text-sm">سال {currentYear}</span>
      </div>

      {/* موجودی مرخصی‌ها */}
      {leaveSummary?.leave_balances?.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {leaveSummary.leave_balances.map((balance) => (
            <div
              key={balance.id}
              className="bg-gray-800 rounded-xl p-4 border border-gray-700 hover:border-gray-600 transition"
            >
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: balance.color || '#3B82F6' }}
                >
                  {balance.leave_type?.[0] || '؟'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{balance.leave_type}</p>
                  <p className="text-gray-500 text-xs">{balance.category}</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">تخصیص:</span>
                  <span className="text-white font-bold">{balance.allocated} روز</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">استفاده شده:</span>
                  <span className="text-orange-400 font-bold">{balance.used} روز</span>
                </div>
                <div className="flex justify-between text-sm border-t border-gray-700 pt-2">
                  <span className="text-gray-400">باقیمانده:</span>
                  <span className={`font-bold ${balance.remaining > 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {balance.remaining} روز
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
                  <div
                    className="h-2 rounded-full transition-all"
                    style={{
                      width: `${Math.min((balance.used / balance.allocated) * 100, 100)}%`,
                      backgroundColor: balance.color || '#3B82F6',
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-gray-800 rounded-xl p-6 text-center border border-gray-700">
          <p className="text-gray-400">موجودی مرخصی تعریف نشده است</p>
        </div>
      )}

      {/* درخواست‌های در انتظار */}
      {leaveSummary?.pending_requests?.length > 0 && (
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-xl p-6">
          <h4 className="text-yellow-400 font-bold mb-4 flex items-center gap-2">
            <span>⏳</span>
            درخواست‌های در انتظار تایید
            <span className="bg-yellow-600 text-white text-xs px-2 py-1 rounded-full">
              {leaveSummary.pending_requests.length}
            </span>
          </h4>

          <div className="space-y-3">
            {leaveSummary.pending_requests.map((request) => (
              <div
                key={request.id}
                className="bg-gray-900/80 rounded-lg p-4 border border-gray-700"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-white font-bold">{request.leave_type_name}</span>
                      <span className="bg-yellow-600/30 text-yellow-400 text-xs px-2 py-0.5 rounded">
                        {request.status_display}
                      </span>
                    </div>
                    <div className="text-gray-400 text-sm space-y-1">
                      <p>📅 از {request.start_date} تا {request.end_date}</p>
                      <p>⏱️ {request.total_days} روز</p>
                      {request.reason && (
                        <p className="text-gray-500">💬 {request.reason}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(request.id)}
                      disabled={updateStatus.loading}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
                    >
                      ✅ تایید
                    </button>
                    <button
                      onClick={() => handleReject(request.id)}
                      disabled={updateStatus.loading}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-bold transition disabled:opacity-50"
                    >
                      ❌ رد
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* مرخصی‌های اخیر تایید شده */}
      {leaveSummary?.recent_leaves?.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <h4 className="text-white font-bold mb-4 flex items-center gap-2">
            <span>✅</span>
            مرخصی‌های اخیر
          </h4>

          <div className="space-y-2">
            {leaveSummary.recent_leaves.map((leave) => (
              <div
                key={leave.id}
                className="flex items-center justify-between bg-gray-900/50 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <span className="text-green-400">✓</span>
                  <div>
                    <p className="text-white text-sm">{leave.leave_type_name}</p>
                    <p className="text-gray-500 text-xs">
                      {leave.start_date} - {leave.end_date}
                    </p>
                  </div>
                </div>
                <span className="text-gray-400 text-sm">{leave.total_days} روز</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* اگه هیچ دیتایی نبود */}
      {!leaveSummary?.leave_balances?.length && 
       !leaveSummary?.pending_requests?.length && 
       !leaveSummary?.recent_leaves?.length && (
        <div className="bg-gray-800 rounded-xl p-12 text-center border border-gray-700">
          <div className="text-5xl mb-4">🏖️</div>
          <p className="text-gray-400">هیچ اطلاعات مرخصی ثبت نشده است</p>
        </div>
      )}
    </div>
  );
};

export default LeaveTab;
