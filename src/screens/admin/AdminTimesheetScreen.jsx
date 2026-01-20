// src/screens/admin/AdminTimesheetScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchTimesheetByRange,
  setTimesheetFilters,
} from '../../features/attendance/attendanceSlice';
import { fetchProjects } from '../../features/projects/projectSlice';

import JalaliDatePicker from '../../components/JalaliDatePicker';
import TimesheetByWorker from '../../components/TimesheetByWorker';
import TimesheetByDay from '../../components/TimesheetByDay';
import TimesheetSummary from '../../components/TimesheetSummary';
import { formatJalaliDateLong } from '../../utils/dateUtils';

import moment from 'moment-jalaali';
moment.loadPersian({ usePersianDigits: false });

const AdminTimesheetScreen = () => {
  const dispatch = useDispatch();
  const {
    loading,
    error,
    meta,
    workers,
    byWorker,
    byDay,
    filters,
  } = useSelector((state) => state.attendance);

  const [activeTab, setActiveTab] = useState('summary'); // 'summary' | 'worker' | 'day'

  // تاریخ امروز میلادی
  const todayGregorian = new Date().toISOString().split('T')[0];
  const todayJalali = formatJalaliDateLong(todayGregorian);

  const { list: projects } = useSelector((state) => state.projects);

  // حالت‌های تاریخ شروع و پایان (میلادی)
  const [startDate, setStartDate] = useState(todayGregorian);
  const [endDate, setEndDate] = useState(todayGregorian);

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  // مقدار اولیه فیلترها براساس امروز (یک روز)
  useEffect(() => {
    const m = moment(todayGregorian, 'YYYY-MM-DD');
    dispatch(
      setTimesheetFilters({
        start_date: todayGregorian,
        end_date: todayGregorian,
      })
    );
  }, [dispatch, todayGregorian]);

  // وقتی کاربر تاریخ شروع را تغییر می‌دهد
  const handleStartDateChange = (e) => {
    const gDate = e.target.value; // "YYYY-MM-DD"
    setStartDate(gDate || todayGregorian);
  };

  // وقتی کاربر تاریخ پایان را تغییر می‌دهد
  const handleEndDateChange = (e) => {
    const gDate = e.target.value; // "YYYY-MM-DD"
    setEndDate(gDate || todayGregorian);
  };

  // بزن و تایم‌شیت بگیر (بر اساس بازه)
  const handleSearch = () => {
    if (!startDate || !endDate) return;
    
    // اعتبارسنجی: تاریخ پایان نباید قبل از تاریخ شروع باشد
    if (moment(endDate).isBefore(startDate)) {
      alert('تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد');
      return;
    }

    dispatch(
      setTimesheetFilters({
        start_date: startDate,
        end_date: endDate,
        projectId: filters.projectId || null,
        positionId: filters.positionId || null,
        workerId: filters.workerId || null,
        search: filters.search || '',
      })
    );

    dispatch(
      fetchTimesheetByRange({
        start_date: startDate,
        end_date: endDate,
        project_id: filters.projectId || null,
        position_id: filters.positionId || null,
        worker_id: filters.workerId || null,
        search: filters.search || '',
      })
    );
  };

  // دکمه‌های سریع برای انتخاب بازه
  const handleQuickRange = (days) => {
    const end = new Date().toISOString().split('T')[0];
    const start = moment(end).subtract(days, 'days').format('YYYY-MM-DD');
    
    setStartDate(start);
    setEndDate(end);
    
    dispatch(
      setTimesheetFilters({
        start_date: start,
        end_date: end,
      })
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white">
      {/* هدر و تاریخ امروز */}
      <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col gap-2 items-center text-center">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          📊 گزارش حضور دوره‌ای
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          مشاهده حضور و غیاب کارکنان در بازه زمانی دلخواه
        </p>
        <p className="text-gray-600 text-sm">
          امروز: <span className="font-semibold">{todayJalali}</span>
        </p>
        {meta?.start_date && meta?.end_date && (
          <p className="text-gray-600 text-xs mt-1">
            بازه انتخاب‌شده: از {formatJalaliDateLong(meta.start_date)} تا {formatJalaliDateLong(meta.end_date)}
            {meta.total_days && ` (${meta.total_days} روز)`}
          </p>
        )}
      </div>

      {/* فیلترها */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        {/* دکمه‌های سریع */}
        <div className="flex flex-wrap gap-2 mb-4">
          <button
            onClick={() => handleQuickRange(7)}
            className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition"
          >
            هفته گذشته
          </button>
          <button
            onClick={() => handleQuickRange(30)}
            className="px-3 py-1 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition"
          >
            ماه گذشته
          </button>
          <button
            onClick={() => handleQuickRange(90)}
            className="px-3 py-1 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition"
          >
            ۳ ماه گذشته
          </button>
          <button
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition"
          >
            فقط امروز
          </button>
        </div>

        <div className="flex flex-wrap gap-4 items-end">
          {/* انتخاب تاریخ شروع */}
          <div className="min-w-[220px]">
            <JalaliDatePicker
              name="start_date"
              label="تاریخ شروع"
              value={startDate}
              onChange={handleStartDateChange}
              modal
            />
          </div>

          {/* انتخاب تاریخ پایان */}
          <div className="min-w-[220px]">
            <JalaliDatePicker
              name="end_date"
              label="تاریخ پایان"
              value={endDate}
              onChange={handleEndDateChange}
              modal
            />
          </div>

          {/* انتخاب پروژه */}
          <div className="min-w-[220px]">
            <label className="text-gray-600 text-sm mb-1 block">
              پروژه
            </label>
            <select
              value={filters.projectId || ''}
              onChange={(e) =>
                dispatch(
                  setTimesheetFilters({
                    projectId: e.target.value || null,
                  })
                )
              }
              className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
            >
              <option value="">همه پروژه‌ها</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>

          {/* سرچ نام کارگر */}
          <div className="min-w-[220px]">
            <label className="text-gray-600 text-sm mb-1 block">
              جستجو (نام کارگر)
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) =>
                dispatch(setTimesheetFilters({ search: e.target.value }))
              }
              className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm"
              placeholder="مثلاً: علی رضایی"
            />
          </div>

          {/* دکمه نمایش */}
          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={!startDate || !endDate || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {loading ? 'در حال بارگذاری...' : 'نمایش تایم‌شیت'}
            </button>
          </div>
        </div>

        {/* نمایش بازه انتخاب شده */}
        {startDate && endDate && (
          <div className="mt-3 text-sm text-gray-600">
            <span>بازه انتخابی: </span>
            <span className="font-semibold">
              {formatJalaliDateLong(startDate)} تا {formatJalaliDateLong(endDate)}
            </span>
            <span className="mr-2">
              ({moment(endDate).diff(moment(startDate), 'days') + 1} روز)
            </span>
          </div>
        )}
      </div>

      {/* تب‌ها */}
      <div className="flex border-b border-gray-200 mt-2">
        <button
          onClick={() => setActiveTab('summary')}
          className={`px-4 py-2 text-sm flex items-center gap-1 ${
            activeTab === 'summary'
              ? 'border-b-2 border-purple-500 text-purple-600 font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📊 خلاصه
        </button>
        <button
          onClick={() => setActiveTab('worker')}
          className={`px-4 py-2 text-sm flex items-center gap-1 ${
            activeTab === 'worker'
              ? 'border-b-2 border-blue-500 text-blue-600 font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          👷 بر اساس کارگر
        </button>
        <button
          onClick={() => setActiveTab('day')}
          className={`px-4 py-2 text-sm flex items-center gap-1 ${
            activeTab === 'day'
              ? 'border-b-2 border-green-500 text-green-600 font-semibold'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          📅 بر اساس روز
        </button>
      </div>

      {/* خطا / لودینگ */}
      {error && (
        <div className="flex bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mt-4 text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex text-center py-10 text-sm text-blue-600">
          در حال بارگذاری تایم‌شیت...
        </div>
      )}

      {/* محتوا */}
      {!loading && meta && (
        <>
          {activeTab === 'summary' && (
            <TimesheetSummary meta={meta} workers={workers} byWorker={byWorker} loading={loading} />
          )}
          {activeTab === 'worker' && (
            <TimesheetByWorker workers={workers} byWorker={byWorker} />
          )}
          {activeTab === 'day' && (
            <TimesheetByDay meta={meta} byDay={byDay} />
          )}
        </>
      )}

      {!loading && !meta && (
        <div className="text-center text-gray-500 py-14 border-2 border-dashed border-gray-200 rounded-xl bg-gray-50 mt-6">
          <div className="text-5xl mb-3">📅</div>
          <p className="text-base">
            ابتدا بازه زمانی را انتخاب کنید و روی «نمایش تایم‌شیت» بزنید.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminTimesheetScreen;