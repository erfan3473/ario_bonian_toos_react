// src/screens/ProjectCreateScreen.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProject, clearError } from '../features/projects/projectSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import PersianDatePicker from '../components/PersianDatePicker';

function ProjectCreateScreen() {
  const [name, setName] = useState('');
  const [locationText, setLocationText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [localSuccess, setLocalSuccess] = useState(false);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { loading, error } = useSelector((state) => state.projects);

  useEffect(() => {
    setLocalError(null);
    setLocalSuccess(false);
  }, []);

  useEffect(() => {
    if (localSuccess) {
      const timer = setTimeout(() => {
        navigate('/projects');
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [localSuccess, navigate]);

  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  const submitHandler = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!name.trim()) {
      setLocalError('نام پروژه الزامی است');
      return;
    }

    if (!startDate) {
      setLocalError('تاریخ شروع الزامی است');
      return;
    }

    if (endDate && new Date(endDate) <= new Date(startDate)) {
      setLocalError('تاریخ پایان باید بعد از تاریخ شروع باشد');
      return;
    }

    const projectData = {
      name: name.trim(),
      location_text: locationText.trim() || '',
      start_date: startDate,
      end_date: endDate || null,
      is_active: isActive,
    };

    try {
      const result = await dispatch(createProject(projectData)).unwrap();
      console.log('✅ پروژه با موفقیت ساخته شد:', result);
      setLocalSuccess(true);
    } catch (err) {
      console.error('❌ خطا در ساخت پروژه:', err);
      setLocalError(err || 'خطا در ایجاد پروژه');
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">ایجاد پروژه جدید</h1>

      {(localError || error) && (
        <Message variant="danger">{localError || error}</Message>
      )}

      {localSuccess && (
        <Message variant="success">
          پروژه با موفقیت ایجاد شد! در حال انتقال...
        </Message>
      )}

      {loading && <Loader />}

      <form onSubmit={submitHandler} className="space-y-6">
        {/* نام پروژه */}
        <div>
          <label className="block text-gray-300 mb-2">
            نام پروژه <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="مثال: ساختمان مسکونی تهران"
            required
          />
        </div>

        {/* موقعیت */}
        <div>
          <label className="block text-gray-300 mb-2">موقعیت مکانی</label>
          <input
            type="text"
            value={locationText}
            onChange={(e) => setLocationText(e.target.value)}
            className="w-full p-3 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
            placeholder="مثال: تهران، خیابان ولیعصر"
          />
        </div>

        {/* تاریخ شروع */}
        <div className="relative z-20">
          <PersianDatePicker
            label="تاریخ شروع"
            value={startDate}
            onChange={setStartDate}
            placeholder="انتخاب تاریخ شروع"
            required
          />
        </div>

        {/* تاریخ پایان */}
        <div className="relative z-10 mt-8">
          <PersianDatePicker
            label="تاریخ پایان (اختیاری)"
            value={endDate}
            onChange={setEndDate}
            placeholder="انتخاب تاریخ پایان"
            minimumDate={startDate}
          />
        </div>

        {/* وضعیت فعال/غیرفعال */}
        <div className="flex items-center gap-3 mt-8">
          <input
            type="checkbox"
            id="isActive"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500"
          />
          <label htmlFor="isActive" className="text-gray-300">
            پروژه فعال است
          </label>
        </div>

        {/* دکمه‌ها */}
        <div className="flex gap-3 pt-6">
          <button
            type="submit"
            disabled={loading || localSuccess}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? 'در حال ایجاد...' : 'ایجاد پروژه'}
          </button>
          
          <button
            type="button"
            onClick={() => navigate('/projects')}
            disabled={loading}
            className="flex-1 bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded font-medium transition"
          >
            انصراف
          </button>
        </div>
      </form>
    </div>
  );
}

export default ProjectCreateScreen;
