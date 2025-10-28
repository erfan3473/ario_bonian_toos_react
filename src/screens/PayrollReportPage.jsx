
// src/screens/PayrollReportPage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import {
  fetchPayrollPeriods,
  fetchPeriodSummary,
  fetchEmployeeHistory,
  formatCurrency,
} from '../features/payroll';
import Table from '../components/ui/Table';
import Button from '../components/ui/Button';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

export function PayrollReportPage() {
  const dispatch = useDispatch();
  const { periodSummary, employeeHistory, loading, error } = useSelector((s) => s.payrollReport || {});
  const { periods } = useSelector((s) => s.payrollPeriod || {});
  const [periodId, setPeriodId] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    dispatch(fetchPayrollPeriods());
  }, [dispatch]);

  const handleFetchSummary = () => {
    if (!periodId) return alert('یک دوره انتخاب کنید');
    dispatch(fetchPeriodSummary(periodId));
  };

  const handleFetchHistory = () => {
    if (!employeeId) return alert('یک پرسنل وارد کنید');
    dispatch(fetchEmployeeHistory({ employee_id: employeeId, year }));
  };

  const isLoading = loading; // اختصار برای وضوح

  return (
    <div className="p-6 text-gray-900 dark:text-gray-100">
      <h2 className="text-2xl font-bold mb-6">گزارش حقوق</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* خلاصه دوره */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <div className="font-semibold mb-3 text-lg">خلاصه دوره</div>

          {isLoading ? (
            <Skeleton height={40} className="mb-3" />
          ) : (
            <select
              value={periodId}
              onChange={(e) => setPeriodId(e.target.value)}
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
            >
              <option value="">انتخاب دوره</option>
              {periods?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex justify-end mt-3">
            <Button onClick={handleFetchSummary} disabled={isLoading}>
              {isLoading ? 'در حال بارگذاری...' : 'نمایش خلاصه'}
            </Button>
          </div>

          <div className="mt-5 space-y-1 text-sm">
            {isLoading ? (
              <>
                <Skeleton count={5} />
              </>
            ) : (
              periodSummary && (
                <>
                  <div>تعداد پرسنل: {periodSummary.total_employees}</div>
                  <div>کل ناخالص: {formatCurrency(periodSummary.total_gross_salary)}</div>
                  <div>کل خالص: {formatCurrency(periodSummary.total_net_salary)}</div>
                  <div>کل مالیات: {formatCurrency(periodSummary.total_tax)}</div>
                  <div>کل بیمه: {formatCurrency(periodSummary.total_insurance)}</div>
                </>
              )
            )}
          </div>
        </div>

        {/* تاریخچه پرسنل */}
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-md p-5 border border-gray-200 dark:border-gray-700">
          <div className="font-semibold mb-3 text-lg">تاریخچه پرسنل</div>

          <div className="space-y-2 mb-3">
            {isLoading ? (
              <>
                <Skeleton height={36} />
                <Skeleton height={36} />
              </>
            ) : (
              <>
                <input
                  placeholder="کد پرسنل"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
                <input
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 dark:border-gray-700"
                />
              </>
            )}
          </div>

          <div className="flex justify-end mb-3">
            <Button onClick={handleFetchHistory} disabled={isLoading}>
              {isLoading ? 'در حال بارگذاری...' : 'نمایش تاریخچه'}
            </Button>
          </div>

          {isLoading ? (
            <Skeleton count={6} height={20} />
          ) : (
            employeeHistory && (
              <div className="mt-4">
                <div className="font-medium mb-2 text-base">
                  {employeeHistory.employee?.name || 'پرسنل'}
                </div>
                <div className="mb-3 text-sm text-gray-600 dark:text-gray-400">
                  سال: {employeeHistory.year}
                </div>

                {employeeHistory.history?.length ? (
                  <Table headers={['دوره', 'ناخالص', 'خالص', 'مالیات', 'بیمه']}>
                    {employeeHistory.history.map((h, idx) => (
                      <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                        <td className="px-3 py-2">{h.period}</td>
                        <td className="px-3 py-2">{formatCurrency(h.gross_salary)}</td>
                        <td className="px-3 py-2">{formatCurrency(h.net_salary)}</td>
                        <td className="px-3 py-2">{formatCurrency(h.tax)}</td>
                        <td className="px-3 py-2">{formatCurrency(h.insurance)}</td>
                      </tr>
                    ))}
                  </Table>
                ) : (
                  <div className="text-gray-500 dark:text-gray-400">تاریخچه‌ای وجود ندارد</div>
                )}
              </div>
            )
          )}
        </div>
      </div>

      {error && (
        <div className="text-red-600 dark:text-red-400 font-medium mt-3">
          {String(error)}
        </div>
      )}
    </div>
  );
}

