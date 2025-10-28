// src/screens/SalaryComponentListPage.jsx
import { useDispatch, useSelector } from 'react-redux'
import { useState, useEffect } from 'react'
import {
  fetchSalaryComponents,
  formatCurrency,
} from '../features/payroll'
import { checkAuthStatus } from '../utils/debugAuth';
const COMPONENT_TYPES = [
  'BASIC_SALARY',
  'HOUSING_ALLOWANCE',
  'TRANSPORT_ALLOWANCE',
  'OVERTIME',
  'BONUS',
  'OTHER_EARNING',
  'INSURANCE',
  'TAX',
  'LOAN',
  'OTHER_DEDUCTION',
]

export function SalaryComponentListPage() {
  const dispatch = useDispatch()
  const { components, loading, error, next, previous, count } = useSelector(
    (s) => s.salaryComponent || {}
  )

  const [filter, setFilter] = useState('')
  const [page, setPage] = useState(1)
   // دیباگ موقع لود کامپوننت
  useEffect(() => {
    console.log('🔍=== Salary Component Page Loaded ===');
    checkAuthStatus();
  }, []);

  useEffect(() => {
    console.log('🔄 useEffect triggered with:', { filter, page });
    dispatch(fetchSalaryComponents({ type: filter, page }));
  }, [dispatch, filter, page]);
  useEffect(() => {
    dispatch(fetchSalaryComponents({ type: filter, page }))
  }, [dispatch, filter, page])

  useEffect(() => {
    console.log('💾 Components from store:', components)
  }, [components])

  const handleNext = () => {
    if (next) setPage((p) => p + 1)
  }

  const handlePrev = () => {
    if (previous && page > 1) setPage((p) => p - 1)
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* هدر صفحه */}
      <h2 className="text-2xl font-bold mb-6 text-gray-800">اجزای حقوق</h2>

      {/* فیلتر */}
      <div className="mb-6 flex gap-3">
        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value)
            setPage(1)
          }}
          className="p-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="" className="text-gray-700">همه انواع</option>
          {COMPONENT_TYPES.map((t) => (
            <option key={t} value={t} className="text-gray-700">
              {t}
            </option>
          ))}
        </select>
      </div>

      {/* جدول */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-600">در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="border-b border-gray-200">
                  <th className="p-3 font-medium text-gray-700 text-right">نام</th>
                  <th className="p-3 font-medium text-gray-700 text-right">نوع</th>
                  <th className="p-3 font-medium text-gray-700 text-right">نوع محاسبه</th>
                  <th className="p-3 font-medium text-gray-700 text-right">مقدار</th>
                  <th className="p-3 font-medium text-gray-700 text-right">فعال</th>
                </tr>
              </thead>
              <tbody>
                {components && components.length ? (
                  components.map((c) => (
                    <tr key={c.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="p-3 text-gray-900">{c.name}</td>
                      <td className="p-3 text-gray-700">{c.component_type}</td>
                      <td className="p-3 text-gray-700">{c.calc_type}</td>
                      <td className="p-3 text-gray-900 font-medium">{formatCurrency(c.value)}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          c.is_active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {c.is_active ? 'فعال' : 'غیرفعال'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="p-4 text-center text-gray-500" colSpan={5}>
                      کامپوننتی وجود ندارد
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* خطا */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-b-lg">
            {String(error)}
          </div>
        )}

        {/* پagination */}
        <div className="flex justify-between items-center p-4 bg-gray-50 border-t border-gray-200">
          <button
            onClick={handlePrev}
            disabled={!previous}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            قبلی
          </button>
          <div className="text-sm text-gray-600">
            صفحه <span className="font-medium text-gray-800">{page}</span> از <span className="font-medium text-gray-800">{Math.ceil(count / 10) || 1}</span>
          </div>
          <button
            onClick={handleNext}
            disabled={!next}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            بعدی
          </button>
        </div>
      </div>
    </div>
  )
}