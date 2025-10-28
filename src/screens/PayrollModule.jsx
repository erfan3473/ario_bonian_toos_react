// src/screens/PayrollModule.jsx
import { useState } from 'react';
import { PayrollPeriodPage } from './PayrollPeriodPage'
import { PayslipListPage } from './PayslipListPage'
import { SalaryComponentListPage } from './SalaryComponentListPage'
import { LeaveRequestListPage } from './LeaveRequestListPage'
import { PayrollReportPage } from './PayrollReportPage'

export default function PayrollModule() {
  const [tab, setTab] = useState('periods')

  const tabs = [
    { key: 'periods', label: 'دوره‌ها' },
    { key: 'payslips', label: 'فیش‌ها' },
    { key: 'salary_components', label: 'کامپوننت‌ها' },
    { key: 'leave_requests', label: 'مرخصی‌ها' },
    { key: 'reports', label: 'گزارش‌ها' },
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex gap-2 p-4">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-2 rounded ${tab===t.key? 'bg-indigo-600 text-white' : 'bg-white border'}`}>{t.label}</button>
        ))}
      </div>

      <div>
        {tab === 'periods' && <PayrollPeriodPage />}
        {tab === 'payslips' && <PayslipListPage />}
        {tab === 'salary_components' && <SalaryComponentListPage />}
        {tab === 'leave_requests' && <LeaveRequestListPage />}
        {tab === 'reports' && <PayrollReportPage />}
      </div>
    </div>
  )
}