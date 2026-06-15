import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchUserDetail } from '../../../features/admin/usersSlice';
import { 
  fetchEmployeeLeaveSummary, 
  approveLeaveRequest, 
  rejectLeaveRequest, 
  clearLeaveSummary 
} from '../../../features/admin/leaveSlice';

const LeavePage = () => {
  const { userId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  // خواندن استیت کاربر
  const { selectedUser: user, loading: usersLoading } = useSelector((state) => state.admin.users);
  const userLoading = usersLoading?.userDetail;

  // خواندن استیت مرخصی
  const { leaveSummary, loading: leaveLoading, updateStatus } = useSelector((state) => state.admin.leave);

  const [isInitializing, setIsInitializing] = useState(true);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!userId) return;

    let isMounted = true;
    setIsInitializing(true);
    
    const fetchInitialData = async () => {
      try {
        // دریافت اطلاعات کاربر (اگر موجود نیست)
        if (!user || user.id !== parseInt(userId)) {
          await dispatch(fetchUserDetail(userId)).unwrap();
        }
      } catch (error) {
        console.error("خطا در دریافت اطلاعات کاربر:", error);
      } finally {
        if (isMounted) setIsInitializing(false);
      }
    };

    fetchInitialData();

    return () => {
      isMounted = false;
      dispatch(clearLeaveSummary()); // پاکسازی استیت مرخصی هنگام خروج از صفحه
    };
  }, [dispatch, userId, user]);

  // دریافت اطلاعات مرخصی به محض لود شدن کاربر و داشتن شناسه کارمندی
  useEffect(() => {
    const employeeId = user?.employee_details?.id;
    if (employeeId && !isInitializing) {
      dispatch(fetchEmployeeLeaveSummary({ employeeId, year: currentYear }));
    }
  }, [dispatch, user, currentYear, isInitializing]);

  // هندلرهای تایید و رد درخواست
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

  if (isInitializing || userLoading) {
    return <div className="p-8 flex justify-center items-center h-screen text-gray-500 font-bold text-lg">در حال بارگذاری اطلاعات...</div>;
  }
  
  if (!user) {
    return <div className="p-8 flex justify-center items-center h-screen text-red-500 font-bold text-lg">کاربر یافت نشد.</div>;
  }

  const employeeId = user?.employee_details?.id;

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <nav className="text-sm font-medium text-gray-500 mb-4 flex gap-2 items-center">
          <Link to="/admin/users" className="hover:text-blue-600 transition-colors">👥 لیست کاربران</Link>
          <span>/</span>
          <Link to={`/admin/users/${userId}`} className="hover:text-blue-600 transition-colors">
            داشبورد {user.first_name} {user.last_name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">وضعیت مرخصی‌ها</span>
        </nav>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <h1 className="text-2xl font-bold text-gray-800">
            🏖️ مرخصی‌های: <span className="text-blue-600">{user.first_name} {user.last_name}</span>
          </h1>
          <button
            onClick={() => navigate(`/admin/users/${userId}`)}
            className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            ← بازگشت به داشبورد
          </button>
        </div>
      </div>

      {!employeeId ? (
        <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-xl mb-6">
          ⚠️ برای این کاربر هنوز اطلاعات پرسنلی ثبت نشده است. امکان مشاهده مرخصی وجود ندارد.
        </div>
      ) : leaveLoading.summary ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* هدر بخش مرخصی */}
          <div className="flex items-center justify-between">
            <h3 className="text-gray-800 font-bold text-lg">خلاصه وضعیت مرخصی‌ها</h3>
            <span className="text-gray-500 text-sm font-medium bg-gray-200 px-3 py-1 rounded-full">سال {currentYear}</span>
          </div>

          {/* موجودی مرخصی‌ها (کارت‌های رنگی) */}
          {leaveSummary?.leave_balances?.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {leaveSummary.leave_balances.map((balance) => (
                <div key={balance.id} className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:shadow transition">
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm"
                      style={{ backgroundColor: balance.color || '#3B82F6' }}
                    >
                      {balance.leave_type?.[0] || '؟'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-gray-900 font-bold truncate text-lg">{balance.leave_type}</p>
                      <p className="text-gray-500 text-xs mt-0.5">{balance.category}</p>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">تخصیص یافته:</span>
                      <span className="text-gray-900 font-bold">{balance.allocated} روز</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600 font-medium">استفاده شده:</span>
                      <span className="text-orange-500 font-bold">{balance.used} روز</span>
                    </div>
                    <div className="flex justify-between text-sm border-t border-gray-100 pt-2.5 mt-1">
                      <span className="text-gray-600 font-medium">باقیمانده:</span>
                      <span className={`font-bold ${balance.remaining > 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {balance.remaining} روز
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-gray-100 rounded-full h-2 mt-3 overflow-hidden">
                      <div
                        className="h-2 rounded-full transition-all duration-500"
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
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200 shadow-sm">
              <p className="text-gray-500">موجودی مرخصی برای این سال تعریف نشده است.</p>
            </div>
          )}

          {/* درخواست‌های در انتظار (ترکیب با ظاهر LeaveRequestsTab) */}
          {leaveSummary?.pending_requests?.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5 shadow-sm">
              <h4 className="text-yellow-800 font-bold mb-4 flex items-center gap-2">
                <span>⏳</span>
                درخواست‌های در انتظار بررسی
                <span className="bg-yellow-200 text-yellow-800 text-xs px-2.5 py-1 rounded-full font-bold">
                  {leaveSummary.pending_requests.length} مورد
                </span>
              </h4>

              <div className="space-y-3">
                {leaveSummary.pending_requests.map((request) => (
                  <div key={request.id} className="bg-white rounded-xl p-4 border border-yellow-200 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-gray-900 font-bold text-lg">{request.leave_type_name}</span>
                          <span className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded font-medium border border-yellow-200">
                            {request.status_display}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm text-gray-600 mt-2">
                          <div><span className="text-gray-400 mr-1">از:</span>{request.start_date}</div>
                          <div><span className="text-gray-400 mr-1">تا:</span>{request.end_date}</div>
                          <div><span className="text-gray-400 mr-1">مدت:</span><span className="font-bold text-gray-800">{request.total_days} روز</span></div>
                        </div>
                        {request.reason && (
                          <div className="mt-3 bg-gray-50 rounded-lg p-2.5 text-sm border border-gray-100">
                            <span className="text-gray-500">💬 دلیل: </span>
                            <span className="text-gray-800">{request.reason}</span>
                          </div>
                        )}
                      </div>

                      {/* دکمه‌های تایید و رد */}
                      <div className="flex gap-2 w-full md:w-auto mt-2 md:mt-0">
                        <button
                          onClick={() => handleApprove(request.id)}
                          disabled={updateStatus.loading}
                          className="flex-1 md:flex-none bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
                        >
                          ✅ تایید
                        </button>
                        <button
                          onClick={() => handleReject(request.id)}
                          disabled={updateStatus.loading}
                          className="flex-1 md:flex-none bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-lg text-sm font-bold transition disabled:opacity-50 flex items-center justify-center gap-1 shadow-sm"
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

          {/* سوابق و مرخصی‌های اخیر */}
          {leaveSummary?.recent_leaves?.length > 0 && (
            <div className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm">
              <h4 className="text-gray-800 font-bold mb-4 flex items-center gap-2 pb-2 border-b">
                <span>✅</span>
                سوابق مرخصی‌های اخیر
              </h4>

              <div className="space-y-3">
                {leaveSummary.recent_leaves.map((leave) => (
                  <div key={leave.id} className="flex items-center justify-between bg-gray-50 rounded-lg p-3.5 border border-gray-100 hover:bg-gray-100 transition">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">✓</div>
                      <div>
                        <p className="text-gray-900 font-bold text-sm">{leave.leave_type_name}</p>
                        <p className="text-gray-500 text-xs mt-0.5" dir="ltr">
                          {leave.start_date} <span className="mx-1">➔</span> {leave.end_date}
                        </p>
                      </div>
                    </div>
                    <span className="bg-gray-200 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                      {leave.total_days} روز
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* حالت خالی */}
          {!leaveSummary?.leave_balances?.length && 
           !leaveSummary?.pending_requests?.length && 
           !leaveSummary?.recent_leaves?.length && (
            <div className="bg-white rounded-xl p-12 text-center border border-gray-200 shadow-sm">
              <div className="text-5xl mb-4 opacity-50">🏖️</div>
              <p className="text-gray-500 text-lg">هیچ اطلاعات مرخصی برای این کاربر ثبت نشده است.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LeavePage;
