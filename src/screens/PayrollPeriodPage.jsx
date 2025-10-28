// src/screens/PayrollPeriodPage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  fetchPayrollPeriods, 
  closePayrollPeriod,
  generatePayroll,
  fetchPayslips 
} from '../features/payroll';

export function PayrollPeriodPage() {
  const dispatch = useDispatch()
  const { periods, currentPeriod, loading, error } = useSelector((s) => s.payrollPeriod || {})
  const [localMsg, setLocalMsg] = useState(null)

  useEffect(() => {
    dispatch(fetchPayrollPeriods())
  }, [dispatch])

  const handleClose = async (id) => {
    try {
      await dispatch(closePayrollPeriod(id)).unwrap()
      dispatch(fetchPayrollPeriods())
      setLocalMsg('دوره بسته شد')
    } catch (e) {
      setLocalMsg(e || 'خطا')
    }
  }

  const handleGenerate = async (id) => {
    try {
      const res = await dispatch(generatePayroll(id)).unwrap()
      setLocalMsg('تولید حقوق انجام شد')
      dispatch(fetchPayslips())
    } catch (e) {
      setLocalMsg(e || 'خطا در تولید حقوق')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">دوره‌های حقوق و دستمزد</h2>

      {localMsg && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded">{String(localMsg)}</div>
      )}

      {currentPeriod ? (
        <div className="mb-6 p-4 rounded-xl shadow-sm bg-white/80">
          <div className="flex justify-between items-center">
            <div>
              <div className="text-sm text-slate-500">دوره جاری</div>
              <div className="text-lg font-medium">{currentPeriod.title}</div>
              <div className="text-sm text-slate-400">{currentPeriod.start_date} — {currentPeriod.end_date}</div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.97 }}
                className="px-3 py-2 rounded bg-indigo-600 text-white text-sm"
                onClick={() => handleGenerate(currentPeriod.id)}
              >
                تولید حقوق
              </motion.button>
              {!currentPeriod.is_closed && (
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  className="px-3 py-2 rounded bg-red-600 text-white text-sm"
                  onClick={() => handleClose(currentPeriod.id)}
                >
                  بستن دوره
                </motion.button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="mb-6 text-slate-500">دوره جاری یافت نشد.</div>
      )}

      <div className="bg-white rounded shadow p-4">
        <div className="mb-4 font-semibold">همه دوره‌ها</div>
        {loading ? (
          <div>در حال بارگذاری...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-right">
              <thead>
                <tr className="border-b">
                  <th className="p-2">عنوان</th>
                  <th className="p-2">سال/ماه</th>
                  <th className="p-2">تاریخ</th>
                  <th className="p-2">وضعیت</th>
                  <th className="p-2">عملیات</th>
                </tr>
              </thead>
              <tbody>
                {periods && periods.length ? periods.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-slate-50">
                    <td className="p-2">{p.title}</td>
                    <td className="p-2">{p.year} / {p.month}</td>
                    <td className="p-2">{p.start_date} — {p.end_date}</td>
                    <td className="p-2">{p.is_closed ? 'بسته' : 'باز'}</td>
                    <td className="p-2 flex gap-2">
                      {!p.is_closed && (
                        <button className="px-2 py-1 bg-red-500 text-white rounded text-xs" onClick={() => handleClose(p.id)}>بستن</button>
                      )}
                      <button className="px-2 py-1 bg-indigo-600 text-white rounded text-xs" onClick={() => handleGenerate(p.id)}>تولید حقوق</button>
                    </td>
                  </tr>
                )) : (
                  <tr><td className="p-2" colSpan={5}>دوره‌ای موجود نیست</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        {error && <div className="text-red-600 mt-2">{String(error)}</div>}
      </div>
    </div>
  )
}