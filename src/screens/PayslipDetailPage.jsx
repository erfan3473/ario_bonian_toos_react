// src/screens/PayslipDetailPage.jsx
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  recalculatePayslip, 
  markPayslipPaid,
  formatCurrency 
} from '../features/payroll';

export function PayslipDetailPage() {
  const { id } = useParams()
  const dispatch = useDispatch()
  const [payslip, setPayslip] = useState(null)
  const [loading, setLoading] = useState(false)
  const [localMsg, setLocalMsg] = useState(null)

  useEffect(() => {
    if (!id) return
    setLoading(true)
    axios.get(`/api/payroll/payslips/${id}/`).then(r => setPayslip(r.data)).catch(() => setPayslip(null)).finally(() => setLoading(false))
  }, [id])

  const handleRecalc = async () => {
    try {
      await dispatch(recalculatePayslip(id)).unwrap()
      const r = await axios.get(`/api/payroll/payslips/${id}/`)
      setPayslip(r.data)
      setLocalMsg('محاسبه انجام شد')
    } catch (e) {
      setLocalMsg(e || 'خطا')
    }
  }

  const handleMarkPaid = async () => {
    try {
      await dispatch(markPayslipPaid(id)).unwrap()
      const r = await axios.get(`/api/payroll/payslips/${id}/`)
      setPayslip(r.data)
      setLocalMsg('پرداخت ثبت شد')
    } catch (e) {
      setLocalMsg(e || 'خطا')
    }
  }

  if (loading) return <div className="p-6">بارگذاری...</div>
  if (!payslip) return <div className="p-6">فیش پیدا نشد</div>

  return (
    <div className="p-6">
      <h2 className="text-2xl mb-4">جزئیات فیش #{payslip.id}</h2>
      {localMsg && <div className="mb-3 p-2 bg-green-50 rounded">{localMsg}</div>}

      <div className="bg-white rounded shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-slate-500">پرسنل</div>
            <div className="font-medium">{payslip.employee?.name}</div>
            <div className="text-sm text-slate-400">قرارداد: {payslip.contract?.id || '-'}</div>
          </div>
          <div className="text-left">
            <div className="text-sm text-slate-500">دوره</div>
            <div className="font-medium">{payslip.period?.title}</div>
            <div className="text-sm text-slate-400">روزهای کارکرد: {payslip.days_worked}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-semibold mb-2">مبالغ</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 border rounded">ناخالص: {formatCurrency(payslip.gross_salary)}</div>
            <div className="p-3 border rounded">کسور بیمه: {formatCurrency(payslip.insurance_deduction)}</div>
            <div className="p-3 border rounded">خالص: {formatCurrency(payslip.net_salary)}</div>
          </div>
        </div>

        <div className="mt-4">
          <div className="font-semibold mb-2">خطوط</div>
          <div className="space-y-2">
            {payslip.lines && payslip.lines.length ? payslip.lines.map(l => (
              <div key={l.id} className="p-3 border rounded flex justify-between">
                <div>
                  <div className="font-medium">{l.salary_component_name} ({l.component_type})</div>
                  <div className="text-sm text-slate-500">{l.notes}</div>
                </div>
                <div className="text-left">{formatCurrency(l.actual_amount)}</div>
              </div>
            )) : <div>خطی وجود ندارد</div>}
          </div>
        </div>

        <div className="mt-4 flex gap-2 justify-end">
          <button className="px-3 py-2 bg-yellow-500 text-white rounded" onClick={handleRecalc}>محاسبه مجدد</button>
          {!payslip.is_paid && <button className="px-3 py-2 bg-green-600 text-white rounded" onClick={handleMarkPaid}>علامت پرداخت</button>}
        </div>
      </div>
    </div>
  )
}