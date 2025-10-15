import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { createProjectThunk, resetProjectCreate } from '../features/projects/projectCreateSlice'

import Loader from '../components/Loader'
import Message from '../components/Message'

function ProjectCreateScreen() {
  const [name, setName] = useState('')
  const [locationText, setLocationText] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isActive, setIsActive] = useState(true)

  const dispatch = useDispatch()
  const navigate = useNavigate()

  const { loading, error, success, project } = useSelector((state) => state.projectCreate)

  useEffect(() => {
    if (success && project) {
      // وقتی پروژه با موفقیت ساخته شد → برو به لیست پروژه‌ها
      navigate('/admin/users')
      dispatch(resetProjectCreate())
    }
  }, [success, project, navigate, dispatch])

  const submitHandler = (e) => {
    e.preventDefault()
    const projectData = {
      name,
      location_text: locationText,
      start_date: startDate,
      end_date: endDate || null,
      is_active: isActive,
    }
    dispatch(createProjectThunk(projectData))
  }

  return (
    <div className="max-w-2xl mx-auto mt-10 p-6 bg-gray-900/30 border border-gray-700 rounded-xl shadow-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-100">ایجاد پروژه جدید</h1>

      {loading && <Loader />}
      {error && <Message variant="danger">{error}</Message>}

      <form onSubmit={submitHandler} className="space-y-4">
        <div>
          <label className="block text-sm mb-1">نام پروژه</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">آدرس پروژه</label>
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">تاریخ شروع</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              required
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">تاریخ پایان</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded bg-gray-800 border border-gray-700 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <input
            id="isActive"
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4 text-blue-600 border-gray-700 rounded"
          />
          <label htmlFor="isActive" className="text-sm">
            پروژه فعال است؟
          </label>
        </div>

        <button
          type="submit"
          className="w-full py-3 mt-4 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 font-semibold shadow hover:scale-105 transition-transform"
        >
          ذخیره پروژه
        </button>
      </form>
    </div>
  )
}

export default ProjectCreateScreen
