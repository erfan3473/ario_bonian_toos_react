// src/screens/PayslipListPage.jsx
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import Table from '../components/ui/Table'
import Button from '../components/ui/Button'
import {
  fetchPayslips,
  createPayslip,
  recalculatePayslip,
  markPayslipPaid,
  fetchPayrollPeriods,
  fetchSalaryComponents,
  formatCurrency,
} from '../features/payroll'

export function PayslipListPage() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { payslips, loading, error } = useSelector((s) => s.payslip || {})
  const { periods } = useSelector((s) => s.payrollPeriod || {})
  const [employees, setEmployees] = useState([])
  const [contracts, setContracts] = useState([])
  const [form, setForm] = useState({ employee_id: '', period_id: '', contract_id: '', days_worked: 0 })
  const [localMsg, setLocalMsg] = useState(null)

  useEffect(() => {
    dispatch(fetchPayslips())
    dispatch(fetchPayrollPeriods())
    dispatch(fetchSalaryComponents())

    axios
      .get('/api/hr/employees/')
      .then((r) => setEmployees(Array.isArray(r.data) ? r.data : []))
      .catch(() => setEmployees([]))

    axios
      .get('/api/contracts/')
      .then((r) => setContracts(Array.isArray(r.data) ? r.data : []))
      .catch(() => setContracts([]))
  }, [dispatch])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  const handleCreate = async (e) => {
    e.preventDefault()
    try {
      await dispatch(createPayslip(form)).unwrap()
      setLocalMsg('✅ فیش ایجاد شد')
      dispatch(fetchPayslips())
      setForm({ employee_id: '', period_id: '', contract_id: '', days_worked: 0 })
    } catch (err) {
      setLocalMsg(err || '❌ خطا در ایجاد فیش')
    }
  }

  const handleRecalc = async (id) => {
    try {
      await dispatch(recalculatePayslip(id)).unwrap()
      dispatch(fetchPayslips())
    } catch (e) {
      setLocalMsg(e || 'خطا در محاسبه')
    }
  }

  const handleMarkPaid = async (id) => {
    try {
      await dispatch(markPayslipPaid(id)).unwrap()
      dispatch(fetchPayslips())
    } catch (e) {
      setLocalMsg(e || 'خطا در پرداخت')
    }
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-100">📄 فیش‌های حقوقی</h2>

      {localMsg && (
        <div className="mb-3 p-3 bg-green-50 text-green-700 border border-green-200 rounded">
          {localMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* ---- لیست فیش‌ها ---- */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow p-4">
          <div className="mb-3 font-semibold text-gray-900">لیست فیش‌ها</div>
          {loading ? (
            <div className="text-gray-900">در حال بارگذاری...</div>
          ) : (
            <Table
              headers={['#', 'پرسنل', 'دوره', 'ناخالص', 'خالص', 'وضعیت', 'عملیات']}
            >
              {payslips && Array.isArray(payslips) && payslips.length ? (
                payslips.map((ps) => (
                  <tr key={ps.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-900">{ps.id}</td>
                    <td className="px-3 py-2 text-gray-900">{ps.employee?.name || '-'}</td>
                    <td className="px-3 py-2 text-gray-900">{ps.period?.title || '-'}</td>
                    <td className="px-3 py-2 text-gray-900">{formatCurrency(ps.gross_salary)}</td>
                    <td className="px-3 py-2 text-gray-900">{formatCurrency(ps.net_salary)}</td>
                    <td className="px-3 py-2">
                      {ps.is_paid ? (
                        <span className="text-green-600 font-semibold">پرداخت شده</span>
                      ) : (
                        <span className="text-red-500 font-semibold">پرداخت نشده</span>
                      )}
                    </td>
                    <td className="px-3 py-2 flex flex-wrap gap-2">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => navigate(`/payroll/payslips/${ps.id}`)}
                      >
                        مشاهده
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleRecalc(ps.id)}
                      >
                        محاسبه مجدد
                      </Button>
                      {!ps.is_paid && (
                        <Button
                          variant="success"
                          size="sm"
                          onClick={() => handleMarkPaid(ps.id)}
                        >
                          علامت پرداخت
                        </Button>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-3 py-3 text-center text-gray-500">
                    فیشی یافت نشد
                  </td>
                </tr>
              )}
            </Table>
          )}
          {error && <div className="text-red-600 mt-2">{String(error)}</div>}
        </div>

        {/* ---- فرم ایجاد فیش جدید ---- */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="mb-3 font-semibold text-gray-900">ایجاد فیش جدید</div>
          <form onSubmit={handleCreate} className="space-y-3">
            <div>
              <label className="block text-sm mb-1 text-gray-900">پرسنل</label>
              <select
                name="employee_id"
                value={form.employee_id}
                onChange={handleChange}
                className="w-full border rounded p-2 text-sm text-gray-900"
              >
                <option value="">انتخاب کنید</option>
                {Array.isArray(employees) &&
                  employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.name}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-900">دوره</label>
              <select
                name="period_id"
                value={form.period_id}
                onChange={handleChange}
                className="w-full border rounded p-2 text-sm text-gray-900"
              >
                <option value="">انتخاب کنید</option>
                {periods &&
                  Array.isArray(periods) &&
                  periods.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-900">قرارداد</label>
              <select
                name="contract_id"
                value={form.contract_id}
                onChange={handleChange}
                className="w-full border rounded p-2 text-sm text-gray-900"
              >
                <option value="">انتخاب کنید</option>
                {Array.isArray(contracts) &&
                  contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name || c.id}
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-sm mb-1 text-gray-900">روزهای کارکرد</label>
              <input
                name="days_worked"
                value={form.days_worked}
                onChange={handleChange}
                type="number"
                className="w-full border rounded p-2 text-sm text-gray-900"
              />
            </div>

            <div className="flex justify-end">
              <motion.div whileTap={{ scale: 0.98 }}>
                <Button type="submit" variant="primary">
                  ایجاد فیش
                </Button>
              </motion.div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
