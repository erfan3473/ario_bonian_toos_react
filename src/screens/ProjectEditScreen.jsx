// src/screens/ProjectEditScreen.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import {
  fetchProjectDetail,
  updateProject,
  clearError,
} from '../features/projects/projectSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import PersianDatePicker from '../components/PersianDatePicker';

function ProjectEditScreen() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [locationText, setLocationText] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [localError, setLocalError] = useState(null);
  const [localSuccess, setLocalSuccess] = useState(false);

  const { selectedProject, loading } = useSelector((state) => state.projects);

  useEffect(() => {
    if (id) {
      dispatch(fetchProjectDetail(id));
    }
  }, [dispatch, id]);

  useEffect(() => {
    if (selectedProject.data) {
      const project = selectedProject.data;
      setName(project.name || '');
      setLocationText(project.location_text || '');
      setStartDate(project.start_date || '');
      setEndDate(project.end_date || '');
      setIsActive(project.is_active !== undefined ? project.is_active : true);
    }
  }, [selectedProject.data]);

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
      const result = await dispatch(
        updateProject({ projectId: id, projectData })
      ).unwrap();

      console.log('✅ پروژه با موفقیت آپدیت شد:', result);
      setLocalSuccess(true);
    } catch (err) {
      console.error('❌ خطا در آپدیت پروژه:', err);
      setLocalError(err || 'خطا در ویرایش پروژه');
    }
  };

  if (selectedProject.loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader />
      </div>
    );
  }

  if (selectedProject.error && !selectedProject.data) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Message variant="danger">
          {selectedProject.error}
        </Message>
        <button
          onClick={() => navigate('/projects')}
          className="mt-4 bg-gray-600 hover:bg-gray-700 text-white py-2 px-6 rounded"
        >
          بازگشت
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-gray-800 rounded-lg shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-6 text-white">
        ویرایش پروژه: {selectedProject.data?.name}
      </h1>

      {localError && <Message variant="danger">{localError}</Message>}

      {localSuccess && (
        <Message variant="success">
          پروژه با موفقیت ویرایش شد! در حال انتقال...
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
            {loading ? 'در حال ذخیره...' : 'ذخیره تغییرات'}
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

export default ProjectEditScreen;
