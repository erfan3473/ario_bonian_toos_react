// src/screens/DailyReportPage.jsx
import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'
import { useSelector } from 'react-redux'

export default function DailyReportPage() {
  const { projectId } = useParams()
  const { userInfo } = useSelector((state) => state.userLogin)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true)
      try {
        const config = { headers: { Authorization: `Bearer ${userInfo.token}` } }
        const { data } = await axios.get(`http://127.0.0.1:8000/api/reports/get_today_report/${projectId}/`, config)
        setReport(data)
      } catch (err) {
        setError(err.response?.data?.detail || 'خطا در دریافت گزارش')
      } finally {
        setLoading(false)
      }
    }
    fetchReport()
  }, [projectId, userInfo])

  if (loading) return <p>در حال بارگذاری...</p>
  if (error) return <p className="text-red-500">{error}</p>

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">گزارش روزانه پروژه {report?.project?.name}</h2>
      {report ? (
        <pre className="bg-gray-900 text-green-400 p-4 rounded-md">{JSON.stringify(report, null, 2)}</pre>
      ) : (
        <p>هنوز گزارشی برای امروز ثبت نشده.</p>
      )}
    </div>
  )
}
