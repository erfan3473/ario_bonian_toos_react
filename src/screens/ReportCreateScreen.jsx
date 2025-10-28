// src/screens/ReportCreateScreen.jsx
import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { createReport, resetCreateState } from '../features/dailyReports/dailyReportSlice'
import { useNavigate, useParams } from 'react-router-dom'
import Loader from '../components/Loader'
import Message from '../components/Message'

const ReportCreateScreen = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { id: projectId } = useParams()

  const [reportDate, setReportDate] = useState('')
  const [summary, setSummary] = useState('')
  const [files, setFiles] = useState([])

  const { loading, error, success } = useSelector((state) => state.dailyReports)

  useEffect(() => {
    if (success) {
      dispatch(resetCreateState())
      navigate(`/projects/${projectId}/reports`)
    }
  }, [success, dispatch, navigate, projectId])

  const submitHandler = (e) => {
    e.preventDefault()
    if (!projectId) return alert('شناسه پروژه نامشخص است!')
    dispatch(
      createReport({
        projectId,
        reportData: { project: projectId, report_date: reportDate, summary },
        files,
      })
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="bg-gray-800 rounded-3xl shadow-xl p-8">
          <h1 className="text-3xl font-bold mb-8 text-white text-center">
            ایجاد گزارش روزانه
          </h1>

          {error && <Message variant="danger">{error}</Message>}
          {loading && <Loader />}

          <form onSubmit={submitHandler} className="space-y-6">
            {/* تاریخ */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-200">
                تاریخ گزارش
              </label>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                required
              />
            </div>

            {/* خلاصه */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-200">
                خلاصه
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:outline-none resize-none"
                rows="4"
                placeholder="متن گزارش را وارد کنید..."
                required
              />
            </div>

            {/* فایل‌ها */}
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-200">
                فایل‌ها (اختیاری)
              </label>
              <input
                type="file"
                multiple
                onChange={(e) => setFiles([...e.target.files])}
                className="w-full p-3 border border-gray-600 rounded-xl bg-gray-700 text-gray-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {files.length > 0 && (
                <ul className="mt-2 text-gray-300 text-sm list-disc list-inside space-y-1">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center">
                      <span className="mr-2">📄</span>
                      {f.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white font-semibold rounded-xl shadow-lg hover:bg-blue-700 transition duration-300 disabled:opacity-50"
            >
              {loading ? 'در حال ارسال...' : 'ثبت گزارش'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ReportCreateScreen
