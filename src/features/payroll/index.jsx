// src/features/payroll/index.jsx
export * from './slices/payrollPeriodSlice'
export * from './slices/payslipSlice'
export * from './slices/salaryComponentSlice'
export * from './slices/leaveRequestSlice'
export * from './slices/payrollReportSlice'

export const formatCurrency = (v) => {
  try {
    return new Intl.NumberFormat('fa-IR').format(Number(v || 0))
  } catch (e) {
    return v
  }
}
