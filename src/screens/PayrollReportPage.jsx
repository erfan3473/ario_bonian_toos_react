// src/screens/PayrollReportPage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { 
  fetchPayrollPeriods,
  fetchPeriodSummary, 
  fetchEmployeeHistory,
  formatCurrency 
} from '../features/payroll';

export function PayrollReportPage() {
  const dispatch = useDispatch()
  const { periodSummary, employeeHistory, loading, error } = useSelector((s) => s.payrollReport || {})
  const { periods } = useSelector((s) => s.payrollPeriod || {})
  const [periodId, setPeriodId] = useState('')
  const [employeeId, setEmployeeId] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())

  useEffect(() => {
    dispatch(fetchPayrollPeriods())
  }, [dispatch])

  const handleFetchSummary = () => {
    if (!periodId) return alert('یک دوره انتخاب کنید')
    dispatch(fetchPeriodSummary(periodId))
  }

  const handleFetchHistory = () => {
    if (!employeeId) return alert('یک پرسنل وارد کنید')
    dispatch(fetchEmployeeHistory({ employee_id: employeeId, year }))
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">گزارش حقوق</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2">خلاصه دوره</div>
          <div className="mb-2">
            <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="w-full p-2 border rounded">
              <option value="">انتخاب دوره</option>
              {periods && periods.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
            </select>
          </div>
          <div className="flex justify-end">
            <button onClick={handleFetchSummary} className="px-3 py-2 bg-indigo-600 text-white rounded">نمایش خلاصه</button>
          </div>

          {periodSummary && (
            <div className="mt-4">
              <div>تعداد پرسنل: {periodSummary.total_employees}</div>
              <div>کل ناخالص: {formatCurrency(periodSummary.total_gross_salary)}</div>
              <div>کل خالص: {formatCurrency(periodSummary.total_net_salary)}</div>
              <div>کل مالیات: {formatCurrency(periodSummary.total_tax)}</div>
              <div>کل بیمه: {formatCurrency(periodSummary.total_insurance)}</div>
            </div>
          )}
        </div>

        <div className="bg-white rounded shadow p-4">
          <div className="font-semibold mb-2">تاریخچه پرسنل</div>
          <div className="mb-2">
            <input placeholder="employee id" value={employeeId} onChange={e => setEmployeeId(e.target.value)} className="w-full p-2 border rounded mb-2" />
            <input type="number" value={year} onChange={e => setYear(e.target.value)} className="w-full p-2 border rounded" />
          </div>
          <div className="flex justify-end">
            <button onClick={handleFetchHistory} className="px-3 py-2 bg-indigo-600 text-white rounded">نمایش تاریخچه</button>
          </div>

          {employeeHistory && (<div className="mt-4">
            <div className="font-medium mb-2">{employeeHistory.employee?.name || 'پرسنل'}</div>
            <div>سال: {employeeHistory.year}</div>
            <div className="mt-2">
              {employeeHistory.history && employeeHistory.history.length ? (
                <table className="min-w-full text-sm text-right">
                  <thead>
                    <tr className="border-b"><th className="p-2">دوره</th><th className="p-2">ناخالص</th><th className="p-2">خالص</th><th className="p-2">مالیات</th><th className="p-2">بیمه</th></tr>
                  </thead>
                  <tbody>
                    {employeeHistory.history.map((h, idx) => (
                      <tr key={idx} className="border-b hover:bg-slate-50">
                        <td className="p-2">{h.period}</td>
                        <td className="p-2">{formatCurrency(h.gross_salary)}</td>
                        <td className="p-2">{formatCurrency(h.net_salary)}</td>
                        <td className="p-2">{formatCurrency(h.tax)}</td>
                        <td className="p-2">{formatCurrency(h.insurance)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div>تاریخچه‌ای وجود ندارد</div>
              )}
            </div>
          </div>
          )}
        </div>
      </div>

      {error && <div className="text-red-600">{String(error)}</div>}
    </div>
  )
}