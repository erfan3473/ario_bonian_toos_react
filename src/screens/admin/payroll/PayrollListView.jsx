// src/screens/admin/PayrollListView.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import moment from 'moment-jalaali';

// Components
import JalaliDatePicker from '../../components/JalaliDatePicker';
import { formatJalaliDateLong } from '../../utils/dateUtils';

// Redux Actions
import { fetchPeriodPayroll } from '../../features/payroll/payrollSlice';

moment.loadPersian({ usePersianDigits: false });

const PayrollListView = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { periodsList, loading: payrollLoading } = useSelector((state) => state.payroll);
  const userLogin = useSelector((state) => state.userLogin);
  const { userInfo } = userLogin;
  const userDetails = useSelector((state) => state.userDetails);
  const { user: userProfile } = userDetails;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [dateRange, setDateRange] = useState({ start: null, end: null });
  const [snackbar, setSnackbar] = useState({ open: false, type: 'success', message: '' });

  // Permissions
  const currentUser = (userProfile && Object.keys(userProfile).length > 0) ? userProfile : userInfo;
  const userRole = currentUser?.employee?.position?.report_type || 'UNKNOWN';
  const isSuperUser = currentUser?.is_superuser || false;
  const MANAGER_ROLES = ['TECHNICAL_OFFICE', 'PROJECT_MANAGER', 'HR_MANAGER'];
  const canManageRows = ['WORKSHOP_SUPERVISOR', 'ACCOUNTANT'].includes(userRole) || 
                        MANAGER_ROLES.includes(userRole) || 
                        isSuperUser;

  const showSnackbar = (type, message) => {
    setSnackbar({ open: true, type, message });
    setTimeout(() => setSnackbar((prev) => ({ ...prev, open: false })), 3000);
  };

  const handleOpenPeriod = async (period) => {
    try {
      await dispatch(fetchPeriodPayroll({ 
        start: period.start_date, 
        end: period.end_date 
      })).unwrap();
      navigate('/admin/payroll/detail');
    } catch (e) {
      showSnackbar('error', e || 'خطا در باز کردن دوره');
    }
  };

  const handleCreateConfirm = async () => {
    if (!dateRange.start || !dateRange.end) {
      showSnackbar('error', 'لطفاً تاریخ شروع و پایان را وارد کنید');
      return;
    }
    try {
      await dispatch(fetchPeriodPayroll({ 
        start: dateRange.start, 
        end: dateRange.end 
      })).unwrap();
      setShowCreateModal(false);
      showSnackbar('success', 'دوره ایجاد شد');
      navigate('/admin/payroll/detail');
    } catch (e) {
      showSnackbar('error', e || 'خطا در ایجاد دوره');
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 rtl min-h-screen bg-white">
      {/* Snackbar */}
      {snackbar.open && (
        <div className={`fixed bottom-5 left-1/2 -translate-x-1/2 z-[70] text-white px-4 py-2 rounded-full shadow-lg text-sm ${snackbar.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {snackbar.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-black text-black">📂 لیست‌های حقوق</h1>
        {canManageRows && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl shadow-lg transition"
          >
            ➕ دوره جدید
          </button>
        )}
      </div>

      {/* Loading */}
      {payrollLoading && (
        <div className="text-center py-10 text-gray-500">در حال دریافت اطلاعات...</div>
      )}

      {/* Periods Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        {periodsList.map((p) => (
          <div
            key={p.id}
            className="bg-white p-6 rounded-2xl shadow border border-gray-300 hover:border-blue-400 transition flex flex-col justify-between min-h-[180px]"
          >
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 font-bold mb-1">بازه زمانی:</span>
                  <h3 className="font-black text-lg text-black">
                    {formatJalaliDateLong(p.start_date)}
                    <span className="mx-2 text-gray-400">تا</span>
                    {formatJalaliDateLong(p.end_date)}
                  </h3>
                </div>
                <span
                  className={`text-xs px-2 py-1 rounded border font-bold whitespace-nowrap ${
                    p.status === 'FINAL'
                      ? 'bg-green-100 text-green-800 border-green-200'
                      : p.status === 'FINANCE_CHECK'
                      ? 'bg-blue-100 text-blue-800 border-blue-200'
                      : 'bg-gray-100 text-gray-600 border-gray-200'
                  }`}
                >
                  {p.status_display}
                </span>
              </div>

              <div className="flex justify-between items-end border-t border-gray-100 pt-4">
                <div>
                  <p className="text-xs text-gray-500 font-bold">قابل پرداخت:</p>
                  <div className="text-xl font-black text-blue-700 mt-1">
                    {Number(p.total_payable).toLocaleString()}{' '}
                    <span className="text-xs text-black font-normal">تومان</span>
                  </div>
                </div>
                <div className="text-xs text-black bg-gray-100 px-2 py-1 rounded">
                  {p.employee_count} پرسنل
                </div>
              </div>
            </div>

            <button
              onClick={() => handleOpenPeriod(p)}
              className="w-full mt-4 border-2 border-blue-600 text-blue-700 font-bold py-2 rounded-xl hover:bg-blue-50 transition"
            >
              مشاهده و ویرایش
            </button>
          </div>
        ))}
      </div>

      {/* Create Period Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 rtl">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl relative">
            <h2 className="text-xl font-black text-black mb-6 border-b pb-2">
              ایجاد دوره جدید
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black mb-1">از تاریخ:</label>
                <JalaliDatePicker
                  modal={true}
                  value={dateRange.start}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, start: e.target.value }))
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black mb-1">تا تاریخ:</label>
                <JalaliDatePicker
                  modal={true}
                  value={dateRange.end}
                  onChange={(e) =>
                    setDateRange((prev) => ({ ...prev, end: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex gap-2 mt-8">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 border-2 border-gray-300 text-black font-bold py-2 rounded-xl hover:bg-gray-100"
              >
                انصراف
              </button>
              <button
                onClick={handleCreateConfirm}
                className="flex-1 bg-blue-600 text-white font-bold py-2 rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200"
              >
                شروع محاسبات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayrollListView;
