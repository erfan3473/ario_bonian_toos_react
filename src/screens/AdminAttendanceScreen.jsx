// src/screens/AdminAttendanceScreen.jsx
import React, { useState, useEffect, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import DatePicker, { DateObject } from "react-multi-date-picker"
import persian from "react-date-object/calendars/persian"
import persian_fa from "react-date-object/locales/persian_fa"
import { fetchDailyAttendance, fetchMonthlyAttendance, clearError } from "../features/attendance/adminAttendanceSlice"
import * as XLSX from "xlsx"
import { saveAs } from "file-saver"

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

  const persianDigitsMap = {
    '0': '۰','1': '۱','2': '۲','3': '۳','4': '۴',
    '5': '۵','6': '۶','7': '۷','8': '۸','9': '۹'
  }
  const toPersianDigits = (str) => {
    if (typeof str !== 'string') str = String(str)
    return str.replace(/\d/g, (d) => persianDigitsMap[d] ?? d)
  }

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
      const year = gregorianDate.year;
      const month = String(gregorianDate.month.number).padStart(2, '0');
      const day = String(gregorianDate.day).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;
      dispatch(fetchDailyAttendance({ date: dateStr }))
    } else {
      const year = gregorianDate.year;
      const month = gregorianDate.month.number;
      dispatch(fetchMonthlyAttendance({ date: selectedDate.format("YYYY/MM") }))

    }
  }

  const data = useMemo(() => {
    return reportType === 'daily' ? dailyReport : monthlyReport;
  }, [reportType, dailyReport, monthlyReport]);

  const columns = reportType === 'daily' ? dailyColumns : monthlyColumns

  const formatCell = (key, value) => {
    if (value === null || value === undefined) return '---'
    if (key === 'is_holiday') return value ? 'بله' : 'خیر'
    if (typeof value === 'string' && /\d/.test(value)) {
      return toPersianDigits(value)
    }
    if (typeof value === 'number') {
      return toPersianDigits(String(value))
    }
    return String(value)
  }

  // 📌 ۱. خروجی CSV
  const exportToCSV = () => {
    if (!data || data.length === 0) return
    const header = columns.map(col => `"${col.label}"`).join(",")
    const rows = data.map(row =>
      columns.map(col => {
        let cell = row[col.key]
        if (cell === null || cell === undefined) cell = ""
        cell = String(cell).replace(/"/g, '""')
        return `"${cell}"`
      }).join(",")
    )
    const csvContent = [header, ...rows].join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, `${reportType}_attendance.csv`)
  }

  // 📌 ۲. خروجی Excel (XLSX)
  const exportToExcel = () => {
    if (!data || data.length === 0) return
    const sheetData = [
      columns.map(col => col.label),
      ...data.map(row => columns.map(col => row[col.key] ?? "")),
    ]
    const ws = XLSX.utils.aoa_to_sheet(sheetData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Attendance")
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" })
    const blob = new Blob([wbout], { type: "application/octet-stream" })
    saveAs(blob, `${reportType}_attendance.xlsx`)
  }

  // 📌 ۳. باز کردن مستقیم در Google Sheets (بدون API)
  const openInGoogleSheets = () => {
    if (!data || data.length === 0) return;

    const header = columns.map(col => col.label).join(",");
    const rows = data.map(row =>
      columns.map(col => {
        let cell = row[col.key];
        if (cell === null || cell === undefined) cell = "";
        return String(cell).replace(/"/g, '""');
      }).join(",")
    );
    const csvContent = [header, ...rows].join("\n");

    // ساخت Data URI از CSV
    const encoded = encodeURIComponent(csvContent);
    const dataUri = `data:text/csv;charset=utf-8,${encoded}`;
    const importFormula = `=IMPORTDATA("${dataUri}")`;

    // باز کردن یک شیت جدید
    window.open("https://docs.google.com/spreadsheets/create", "_blank");

    // کپی فرمول در Clipboard
    navigator.clipboard.writeText(importFormula).then(() => {
      alert("✅ شیت جدید باز شد. فقط در سلول A1 این فرمول را Paste کن:\n\n" + importFormula);
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 space-y-6">
      {/* هدر */}
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

      {/* فیلتر + دکمه‌ها */}
      <div className="bg-gray-800 p-5 rounded-xl shadow space-y-4">
        <div className="grid md:grid-cols-4 lg:grid-cols-6 gap-4">
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

          <button
            onClick={exportToCSV}
            disabled={!data || data.length === 0}
            className="p-3 bg-emerald-500 hover:bg-emerald-600 rounded-lg font-semibold disabled:opacity-50 transition-all"
          >
            خروجی CSV
          </button>

          <button
            onClick={exportToExcel}
            disabled={!data || data.length === 0}
            className="p-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-semibold disabled:opacity-50 transition-all"
          >
            خروجی Excel
          </button>

          <button
            onClick={openInGoogleSheets}
            disabled={!data || data.length === 0}
            className="p-3 bg-blue-500 hover:bg-blue-600 rounded-lg font-semibold disabled:opacity-50 transition-all"
          >
            باز کردن در Google Sheets
          </button>
        </div>
      </div>

      {/* جدول */}
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
