// src/screens/AdminAttendanceScreen.jsx
import React, { useState, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import DatePicker, { DateObject } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { fetchDailyAttendance, fetchMonthlyAttendance, clearError } from "../features/attendance/adminAttendanceSlice"

export default function AdminAttendanceScreen() {
  const dispatch = useDispatch()
  const { dailyReport, monthlyReport, loading, error } = useSelector((state) => state.adminAttendance)

  const [reportType, setReportType] = useState("daily")
  const [selectedDate, setSelectedDate] = useState(new DateObject({ calendar: persian, locale: persian_fa }))
  const [currentTime, setCurrentTime] = useState(new DateObject({ calendar: persian, locale: persian_fa }))

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new DateObject({ calendar: persian, locale: persian_fa }))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    dispatch(clearError())
  }, [reportType, dispatch])

  // --- کمکی: تبدیل ارقام لاتین به فارسی (برای نمایش جدول)
  const persianDigitsMap = {
    '0': '۰','1': '۱','2': '۲','3': '۳','4': '۴',
    '5': '۵','6': '۶','7': '۷','8': '۸','9': '۹'
  }
  const toPersianDigits = (str) => {
    if (typeof str !== 'string') str = String(str)
    return str.replace(/\d/g, (d) => persianDigitsMap[d] ?? d)
  }

  // --- ستون‌ها بر اساس نوع گزارش (ترتیب و برچسب فارسی)
  const dailyColumns = [
    { key: 'worker_name', label: 'نام کارگر' },
    { key: 'report_date_jalali', label: 'تاریخ' },
    { key: 'time_in_display', label: 'ساعت ورود' },
    { key: 'time_out_display', label: 'ساعت خروج' },
    { key: 'total_hours_hhmmss', label: 'مدت (HH:MM:SS)' },
    { key: 'total_hours_decimal', label: 'مدت (ساعت)' },
    { key: 'overtime_hours', label: 'اضافه‌کار' },
    { key: 'is_holiday', label: 'تعطیل رسمی' },
  ]

  const monthlyColumns = [
    { key: 'worker_name', label: 'نام کارگر' },
    { key: 'month', label: 'ماه' },
    { key: 'work_days', label: 'روزهای کاری' },
    { key: 'total_hours', label: 'مجموع ساعات' },
    { key: 'total_overtime_hours', label: 'مجموع اضافه‌کار' },
  ]

  const handleFetch = () => {
    const dateObj = Array.isArray(selectedDate) ? selectedDate[0] : new DateObject(selectedDate)
    const gregorianDate = dateObj.convert("gregorian")

    if (reportType === "daily") {
      // شکل ارسال به API: YYYY-MM-DD (به صورت انگلیسی تا سرور فعلی سازگار باشه)
      const year = gregorianDate.year;
      const month = String(gregorianDate.month.number).padStart(2, '0');
      const day = String(gregorianDate.day).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`; // مثال: "2025-10-10"

      console.log("ارسال تاریخ (میلادی) به API:", dateStr);
      dispatch(fetchDailyAttendance({ date: dateStr }))
    } else {
      const year = gregorianDate.year;
      const month = String(gregorianDate.month.number).padStart(2, '0');
      dispatch(fetchMonthlyAttendance({ year, month }))
    }
  }

  const data = useMemo(() => {
    return reportType === 'daily' ? dailyReport : monthlyReport;
  }, [reportType, dailyReport, monthlyReport]);

  // پویا انتخاب ستون‌ها
  const columns = reportType === 'daily' ? dailyColumns : monthlyColumns

  const formatCell = (key, value) => {
    if (value === null || value === undefined) return '---'
    if (key === 'is_holiday') return value ? 'بله' : 'خیر'
    // برای تاریخ شمسی که سرور برمی‌گرداند فرض می‌کنیم رشته‌ای مانند "1404/07/18" است
    if (typeof value === 'string' && /\d/.test(value)) {
      // نمایش ارقام به فارسی
      return toPersianDigits(value)
    }
    if (typeof value === 'number') {
      return toPersianDigits(String(value))
    }
    return String(value)
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-5 rounded-xl shadow flex flex-col md:flex-row items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold mb-1">مدیریت حضور و غیاب</h1>
          <p className="opacity-80">گزارش روزانه یا ماهانه کارگران</p>
        </div>
        <div className="text-center mt-3 md:mt-0">
          <div className="text-lg font-semibold">{currentTime.format("dddd DD MMMM YYYY")}</div>
          <div className="text-3xl font-bold tracking-wide">{currentTime.format("HH:mm:ss")}</div>
        </div>
      </div>

      <div className="bg-gray-800 p-5 rounded-xl shadow space-y-4">
        <div className="grid md:grid-cols-3 gap-4">
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="p-3 border rounded-lg bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-indigo-400"
          >
            <option value="daily">گزارش روزانه</option>
            <option value="monthly">گزارش ماهانه</option>
          </select>

          <DatePicker
            value={selectedDate}
            onChange={setSelectedDate}
            calendar={persian}
            locale={persian_fa}
            onlyMonthPicker={reportType === "monthly"}
            format={reportType === "monthly" ? "YYYY/MM" : "YYYY/MM/DD"}
            inputClass="w-full p-3 border rounded-lg bg-gray-900 border-gray-700 text-white focus:ring-2 focus:ring-indigo-400 text-center"
            calendarPosition="bottom-right"
          />

          <button
            onClick={handleFetch}
            disabled={loading}
            className="p-3 bg-indigo-500 hover:bg-indigo-600 rounded-lg font-semibold disabled:opacity-50 transition-all"
          >
            {loading ? "در حال دریافت..." : "دریافت گزارش"}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-800/40 text-red-300 p-3 rounded-lg">{error}</div>
      )}

      <div className="bg-gray-800 rounded-xl shadow p-5">
        {loading ? (
          <div className="text-center text-gray-400 animate-pulse">در حال بارگذاری...</div>
        ) : !data || data.length === 0 ? (
          <div className="text-center text-gray-400">هیچ داده‌ای برای نمایش وجود ندارد.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-700">
              <thead className="sticky top-0 bg-gray-700">
                <tr className="text-sm">
                  {columns.map(col => (
                    <th key={col.key} className="border border-gray-600 p-3 text-right whitespace-nowrap">
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr key={i} className="hover:bg-gray-700/40 transition-colors">
                    {columns.map((col, j) => (
                      <td key={j} className="border border-gray-700 p-3 text-sm">
                        {formatCell(col.key, row[col.key])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
