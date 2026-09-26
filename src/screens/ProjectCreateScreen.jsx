// src/screens/ProjectCreateScreen.jsx
import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createProject, clearError } from '../features/projects/projectSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';
import JalaliDatePicker from '../components/common/JalaliDatePicker';

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
  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

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
    <div className={`min-h-[80vh] flex items-center justify-center p-4 transition-colors duration-300 ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`w-full max-w-2xl mx-auto rounded-2xl shadow-2xl p-6 md:p-8 transition-all duration-300 border-2 ${
        isDark ? 'bg-gray-800/80 border-blue-700' : 'bg-white border-blue-600'
      }`}>
        <h1 className={`text-2xl md:text-3xl font-black mb-8 pb-4 border-b flex items-center gap-3 ${
          isDark ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'
        }`}>
          <span className="text-blue-500 text-3xl">➕</span> ایجاد پروژه جدید
        </h1>

        {(localError || error) && (
          <Message variant="danger">{localError || error}</Message>
        )}

        {localSuccess && (
          <Message variant="success">
            پروژه با موفقیت ایجاد شد! در حال انتقال به لیست پروژه‌ها...
          </Message>
        )}

        {loading && <div className="my-4"><Loader /></div>}

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              نام پروژه <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`w-full p-3.5 rounded-xl border-2 focus:outline-none focus:ring-0 transition-colors ${
                isDark 
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-blue-500'
              }`}
              placeholder="مثال: ساختمان مسکونی تهران"
              required
            />
          </div>

          <div>
            <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              موقعیت مکانی
            </label>
            <input
              type="text"
              value={locationText}
              onChange={(e) => setLocationText(e.target.value)}
              className={`w-full p-3.5 rounded-xl border-2 focus:outline-none focus:ring-0 transition-colors ${
                isDark 
                  ? 'bg-gray-700 text-white border-gray-600 focus:border-blue-500' 
                  : 'bg-gray-50 text-gray-900 border-gray-200 focus:border-blue-500'
              }`}
              placeholder="مثال: تهران، خیابان ولیعصر"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="relative z-20">
              <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                تاریخ شروع <span className="text-red-500">*</span>
              </label>
              <div className={`w-full px-3 py-3 rounded-xl border-2 transition-colors flex items-center ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 focus-within:border-blue-500' 
                  : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'
              }`}>
                <JalaliDatePicker
                  name="startDate"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  placeholder="انتخاب تاریخ شروع"
                  inputClassName={`w-full outline-none bg-transparent text-sm pl-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </div>
            </div>

            <div className="relative z-10">
              <label className={`block mb-2 font-bold text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                تاریخ پایان (اختیاری)
              </label>
              <div className={`w-full px-3 py-3 rounded-xl border-2 transition-colors flex items-center ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 focus-within:border-blue-500' 
                  : 'bg-gray-50 border-gray-200 focus-within:border-blue-500'
              }`}>
                <JalaliDatePicker
                  name="endDate"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  placeholder="انتخاب تاریخ پایان"
                  inputClassName={`w-full outline-none bg-transparent text-sm pl-6 ${isDark ? 'text-white' : 'text-gray-900'}`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 mt-6 pt-2">
            <input
              type="checkbox"
              id="isActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className={`w-5 h-5 rounded cursor-pointer transition-colors ${
                isDark ? 'border-gray-500 bg-gray-700 text-blue-500 focus:ring-blue-600' : 'border-gray-300 bg-white text-blue-600 focus:ring-blue-500'
              }`}
            />
            <label htmlFor="isActive" className={`font-bold text-sm cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              پروژه فعال است
            </label>
          </div>

          <div className="flex gap-4 pt-8 border-t border-dashed mt-8 border-gray-500/30">
            <button
              type="submit"
              disabled={loading || localSuccess}
              className="flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white py-3.5 px-6 rounded-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg flex items-center justify-center gap-2"
            >
              {loading ? 'در حال ایجاد...' : 'ایجاد پروژه'}
            </button>
            
            <button
              type="button"
              onClick={() => navigate('/projects')}
              disabled={loading}
              className={`flex-1 py-3.5 px-6 rounded-xl font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                isDark 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
              }`}
            >
              انصراف و بازگشت
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProjectCreateScreen;