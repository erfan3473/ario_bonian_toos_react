// src/screens/LeaveRequestListPage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { 
  fetchLeaveRequests, 
  approveLeaveRequest, 
  rejectLeaveRequest 
} from '../features/payroll/slices/leaveRequestSlice';

export function LeaveRequestListPage() {
  const dispatch = useDispatch()
  const { requests, loading, error } = useSelector(s => s.leaveRequest)

  const [localMsg, setLocalMsg] = useState(null)

  useEffect(() => {
    dispatch(fetchLeaveRequests())
  }, [dispatch])
  useEffect(() => {
  console.log("fetchLeaveRequests dispatching...")
  dispatch(fetchLeaveRequests())
}, [dispatch])

  const handleApprove = async (id) => {
    try {
      await dispatch(approveLeaveRequest(id)).unwrap()
      setLocalMsg('مرخصی تأیید شد')
      setTimeout(() => setLocalMsg(null), 3000)
      dispatch(fetchLeaveRequests())
    } catch (e) {
      setLocalMsg(e || 'خطا در تأیید مرخصی')
      setTimeout(() => setLocalMsg(null), 3000)
    }
  }

  const handleReject = async (id) => {
    const reason = window.prompt('علت رد را وارد کنید:') || ''
    if (!reason.trim()) {
      setLocalMsg('علت رد باید وارد شود')
      setTimeout(() => setLocalMsg(null), 3000)
      return
    }
    
    try {
      await dispatch(rejectLeaveRequest({ id, reason })).unwrap()
      setLocalMsg('درخواست رد شد')
      setTimeout(() => setLocalMsg(null), 3000)
      dispatch(fetchLeaveRequests())
    } catch (e) {
      setLocalMsg(e || 'خطا در رد درخواست')
      setTimeout(() => setLocalMsg(null), 3000)
    }
  }

  // تابع برای استایل وضعیت‌ها
  const getStatusStyle = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800'
      case 'APPROVED':
        return 'bg-green-100 text-green-800'
      case 'REJECTED':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  // تابع برای ترجمه وضعیت‌ها
  const translateStatus = (status) => {
    switch (status) {
      case 'PENDING':
        return 'در انتظار'
      case 'APPROVED':
        return 'تأیید شده'
      case 'REJECTED':
        return 'رد شده'
      default:
        return status
    }
  }

  // تبدیل requests به آرایه برای اطمینان
  const requestArray = Array.isArray(requests) ? requests : []

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* هدر صفحه */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">درخواست‌های مرخصی</h2>
        <p className="text-gray-600">مدیریت و بررسی درخواست‌های مرخصی پرسنل</p>
      </div>

      {/* پیام‌های سیستمی */}
      {localMsg && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-lg">
          {localMsg}
        </div>
      )}

      {/* جدول درخواست‌ها */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">
            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
            در حال بارگذاری...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="p-3 font-medium text-gray-700 text-right">#</th>
                  <th className="p-3 font-medium text-gray-700 text-right">پرسنل</th>
                  <th className="p-3 font-medium text-gray-700 text-right">نوع مرخصی</th>
                  <th className="p-3 font-medium text-gray-700 text-right">تاریخ شروع</th>
                  <th className="p-3 font-medium text-gray-700 text-right">تاریخ پایان</th>
                  <th className="p-3 font-medium text-gray-700 text-right">تعداد روزها</th>
                  <th className="p-3 font-medium text-gray-700 text-right">وضعیت</th>
                  <th className="p-3 font-medium text-gray-700 text-right">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {requestArray.length > 0 ? (
                  requestArray.map((r, index) => (
                    <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-600">{index + 1}</td>
                      <td className="p-3 text-gray-900 font-medium">{r.employee?.name || '---'}</td>
                      <td className="p-3 text-gray-700">{r.leave_type?.name || '---'}</td>
                      <td className="p-3 text-gray-700">{r.start_date || '---'}</td>
                      <td className="p-3 text-gray-700">{r.end_date || '---'}</td>
                      <td className="p-3 text-gray-900 font-medium">{r.total_days || 0}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(r.status)}`}>
                          {translateStatus(r.status)}
                        </span>
                      </td>
                      <td className="p-3">
                        {r.status === 'PENDING' ? (
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleApprove(r.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors"
                            >
                              تأیید
                            </button>
                            <button 
                              onClick={() => handleReject(r.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded-lg text-xs hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                            >
                              رد
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-xs">قابل اقدام نیست</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td 
                      className="p-6 text-center text-gray-500" 
                      colSpan={8}
                    >
                      <div className="flex flex-col items-center justify-center py-8">
                        <svg className="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        درخواست مرخصی‌ای وجود ندارد
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* نمایش خطا */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-b-lg">
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {String(error)}
            </div>
          </div>
        )}
      </div>

      {/* اطلاعات آماری - فقط اگر آرایه باشد و آیتم داشته باشد */}
      {requestArray.length > 0 && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">کل درخواست‌ها</div>
            <div className="text-xl font-bold text-gray-800">{requestArray.length}</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">در انتظار بررسی</div>
            <div className="text-xl font-bold text-yellow-600">
              {requestArray.filter(r => r.status === 'PENDING').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600">تأیید شده</div>
            <div className="text-xl font-bold text-green-600">
              {requestArray.filter(r => r.status === 'APPROVED').length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}