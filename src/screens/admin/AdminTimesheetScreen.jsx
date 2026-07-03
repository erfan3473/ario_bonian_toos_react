// src/screens/admin/AdminTimesheetScreen.jsx
import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useReactToPrint } from 'react-to-print';
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
import PersianCalendarFrame from '../../components/PersianCalendarFrame';

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

  const todayGregorian = new Date().toISOString().split('T')[0];
  const todayJalali = formatJalaliDateLong(todayGregorian);

  const { list: projects } = useSelector((state) => state.projects);

  const [startDate, setStartDate] = useState(todayGregorian);
  const [endDate, setEndDate] = useState(todayGregorian);

  const [nightStart, setNightStart] = useState('22:00');
  const [nightEnd, setNightEnd] = useState('06:00');

  // ---------- تغییرات جدید: چاپ / PDF ----------
  const printRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `تایم‌شیت-${startDate}-تا-${endDate}`,
    pageStyle: `
      @page { size: A3 landscape; margin: 10mm; }
      html, body {
        direction: rtl !important;
        text-align: right !important;
      }
      * {
        direction: rtl !important;
      }
      @media print {
        body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        table { font-size: 9px !important; direction: rtl !important; }
        th, td { text-align: right !important; }
        .no-print { display: none !important; }
        .print-row-avoid-break { break-inside: avoid; }
      }
    `,
  });
  // -----------------------------------------------

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    const m = moment(todayGregorian, 'YYYY-MM-DD');
    dispatch(
      setTimesheetFilters({
        start_date: todayGregorian,
        end_date: todayGregorian,
      })
    );
  }, [dispatch, todayGregorian]);

  const handleStartDateChange = (e) => {
    const gDate = e.target.value;
    setStartDate(gDate || todayGregorian);
  };

  const handleEndDateChange = (e) => {
    const gDate = e.target.value;
    setEndDate(gDate || todayGregorian);
  };

  const handleSearch = () => {
    if (!startDate || !endDate) return;

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
        night_start: nightStart,
        night_end: nightEnd,
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
        night_start: nightStart,
        night_end: nightEnd,
      })
    );
  };

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
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white rounded">
      <PersianCalendarFrame
        startDate={startDate}
        endDate={endDate}
      />

      {/* فیلترها - در چاپ مخفی می‌شود */}
      <div className="bg-gray-50 p-4 rounded-xl shadow-sm border border-gray-200 mb-6 no-print">
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
          <div className="min-w-[180px]">
            <JalaliDatePicker
              name="start_date"
              label="تاریخ شروع"
              value={startDate}
              onChange={handleStartDateChange}
              modal
            />
          </div>

          <div className="min-w-[180px]">
            <JalaliDatePicker
              name="end_date"
              label="تاریخ پایان"
              value={endDate}
              onChange={handleEndDateChange}
              modal
            />
          </div>

          <div className="min-w-[120px]">
            <label className="text-gray-600 text-sm mb-1 block">شروع شب</label>
            <input
              type="time"
              value={nightStart}
              onChange={(e) => setNightStart(e.target.value)}
              className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono dir-ltr text-center"
            />
          </div>

          <div className="min-w-[120px]">
            <label className="text-gray-600 text-sm mb-1 block">پایان شب</label>
            <input
              type="time"
              value={nightEnd}
              onChange={(e) => setNightEnd(e.target.value)}
              className="w-full bg-white text-gray-800 px-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm font-mono dir-ltr text-center"
            />
          </div>

          <div className="min-w-[180px]">
            <label className="text-gray-600 text-sm mb-1 block">پروژه</label>
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

          <div className="min-w-[180px]">
            <label className="text-gray-600 text-sm mb-1 block">جستجو (نام کارگر)</label>
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

          <div className="flex items-end">
            <button
              onClick={handleSearch}
              disabled={!startDate || !endDate || loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex items-center gap-2 h-[38px]"
            >
              {loading ? 'در حال بارگذاری...' : 'نمایش تایم‌شیت'}
            </button>
          </div>
        </div>

        {startDate && endDate && (
          <div className="mt-3 text-sm text-gray-600">
            <span>بازه انتخابی: </span>
            <span className="font-semibold">
              {formatJalaliDateLong(startDate)} تا {formatJalaliDateLong(endDate)}
            </span>
            <span className="mr-2">
              ({moment(endDate).diff(moment(startDate), 'days') + 1} روز)
            </span>
            <span className="mr-4 px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-xs border border-indigo-100">
              مبنای شب‌کاری: {nightStart} الی {nightEnd}
            </span>
          </div>
        )}
      </div>

      {/* تب‌ها - در چاپ مخفی می‌شود */}
      <div className="flex border-b border-gray-200 mt-2 no-print">
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

      {/* دکمه چاپ / ذخیره PDF - در چاپ خودش هم مخفی می‌شود */}
      {meta && (
        <div className="flex justify-end mt-3 no-print">
          <button
            onClick={() => handlePrint()}
            className="bg-slate-700 hover:bg-slate-800 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"
          >
            🖨️ چاپ / ذخیره PDF
          </button>
        </div>
      )}

      {error && (
        <div className="flex bg-red-50 text-red-700 p-3 rounded-lg border border-red-200 mt-4 text-sm no-print">
          {error}
        </div>
      )}
      {loading && (
        <div className="flex text-center py-10 text-sm text-blue-600 no-print">
          در حال بارگذاری تایم‌شیت...
        </div>
      )}

      {/* محتوای قابل چاپ */}
        {!loading && meta && (
        <div ref={printRef} dir="rtl" lang="fa">
          {activeTab === 'summary' && (
            <TimesheetSummary meta={meta} workers={workers} byWorker={byWorker} loading={loading} />
          )}
          {activeTab === 'worker' && (
            <TimesheetByWorker workers={workers} byWorker={byWorker} />
          )}
          {activeTab === 'day' && (
            <TimesheetByDay meta={meta} byDay={byDay} />
          )}
        </div>
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