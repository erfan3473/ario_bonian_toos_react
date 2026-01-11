// src/screens/admin/AdminTimesheetScreen.jsx
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchMonthlyTimesheet,
  setTimesheetFilters,
} from '../../features/attendance/attendanceSlice';

import JalaliDatePicker from '../../components/JalaliDatePicker';
import TimesheetByWorker from '../../components/TimesheetByWorker';
import TimesheetByDay from '../../components/TimesheetByDay';
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

  const [activeTab, setActiveTab] = useState('worker'); // 'worker' | 'day'

  // تاریخ امروز میلادی (برای نمایش بالا و برای مقدار اولیه)
  const todayGregorian = new Date().toISOString().split('T')[0];
  const todayJalali = formatJalaliDateLong(todayGregorian);

  // تاریخ انتخاب‌شده برای تقویم (میلادی)، شبیه DailySummaryScreen
  const [selectedDate, setSelectedDate] = useState(todayGregorian);

  // مقدار اولیه فیلترهای سال/ماه براساس امروز
  useEffect(() => {
    const m = moment(todayGregorian, 'YYYY-MM-DD');
    dispatch(
      setTimesheetFilters({
        year: m.jYear(),
        month: m.jMonth() + 1, // jMonth از 0 شروع می‌شود
      })
    );
  }, [dispatch, todayGregorian]);

  // وقتی کاربر تاریخ را از DatePicker عوض می‌کند
  const handleDateChange = (e) => {
    const gDate = e.target.value; // "YYYY-MM-DD"
    setSelectedDate(gDate);

    if (!gDate) {
      dispatch(setTimesheetFilters({ year: null, month: null }));
      return;
    }

    const m = moment(gDate, 'YYYY-MM-DD');
    dispatch(
      setTimesheetFilters({
        year: m.jYear(),
        month: m.jMonth() + 1,
      })
    );
  };

  // بزن و تایم‌شیت بگیر
  const handleSearch = () => {
    if (!filters.year || !filters.month) return;
    dispatch(
      fetchMonthlyTimesheet({
        year: filters.year,
        month: filters.month,
        projectId: filters.projectId || null,
        positionId: filters.positionId || null,
        workerId: filters.workerId || null,
        search: filters.search || '',
      })
    );
  };

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white">
      {/* هدر و تاریخ امروز */}
      <div className="mb-6 border-b border-gray-200 pb-4 flex flex-col gap-1">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
          📊 گزارش حضور ماهانه (Timesheet)
        </h1>
        <p className="text-gray-500 text-sm md:text-base">
          مشاهده حضور و غیاب ماهانه کارکنان، با نمایش روزهای تعطیل و جمعه.
        </p>
        <p className="text-gray-600 text-sm">
          امروز: <span className="font-semibold">{todayJalali}</span>
        </p>
        {meta?.year && meta?.month && (
          <p className="text-gray-600 text-xs mt-1">
            ماه انتخاب‌شده: {meta.year}/{meta.month.toString().padStart(2, '0')}
          </p>
        )}
      </div>

      {/* فیلترها */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="flex flex-wrap gap-4 items-end">
          {/* انتخاب تاریخ مبنا (مثل DailySummaryScreen) */}
          <div className="min-w-[220px]">
            <JalaliDatePicker
              name="timesheet_date"
              label="تاریخ مبنا (برای تعیین ماه)"
              value={selectedDate}
              onChange={handleDateChange}
              modal
            />
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
              disabled={!filters.year || !filters.month || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2"
            >
              {loading ? 'در حال بارگذاری...' : 'نمایش تایم‌شیت'}
            </button>
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex border-b border-gray-200 mt-2">
        <button
          onClick={() => setActiveTab('worker')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'worker'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          بر اساس کارگر
        </button>
        <button
          onClick={() => setActiveTab('day')}
          className={`px-4 py-2 text-sm ${
            activeTab === 'day'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-500'
          }`}
        >
          بر اساس روز
        </button>
      </div>

      {/* خطا / لودینگ */}
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mt-4 text-sm">
          {error}
        </div>
      )}
      {loading && (
        <div className="text-center py-10 text-sm text-blue-600">
          در حال بارگذاری تایم‌شیت...
        </div>
      )}

      {/* محتوا */}
      {!loading && meta && (
        <>
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
            ابتدا تاریخ مبنا را انتخاب کنید و روی «نمایش تایم‌شیت» بزنید.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminTimesheetScreen;
