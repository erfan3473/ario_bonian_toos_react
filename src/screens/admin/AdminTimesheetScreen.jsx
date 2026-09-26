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
  const isDark = useSelector((state) => state.theme?.mode === 'dark');

  const {
    loading,
    error,
    meta,
    workers,
    byWorker,
    byDay,
    filters,
  } = useSelector((state) => state.attendance);

  const [activeTab, setActiveTab] = useState('summary'); 

  const todayGregorian = new Date().toISOString().split('T')[0];
  const todayJalali = formatJalaliDateLong(todayGregorian);

  const { list: projects } = useSelector((state) => state.projects);

  const [startDate, setStartDate] = useState(todayGregorian);
  const [endDate, setEndDate] = useState(todayGregorian);

  const [nightStart, setNightStart] = useState('22:00');
  const [nightEnd, setNightEnd] = useState('06:00');

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
    <div className={`container mx-auto px-2 mt-2 rtl transition-colors duration-300 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
      
      {/* بخش فیلترها + تقویم (وسط‌چین شده با w-fit) */}
      <div className="flex justify-center w-full mb-4 no-print">
        <div className={`p-4 rounded-2xl shadow-sm border flex flex-col md:flex-row gap-6 md:gap-8 items-center transition-colors w-fit ${isDark ? 'bg-gray-900 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
          
          {/* تقویم در سمت راست */}
          <PersianCalendarFrame startDate={startDate} endDate={endDate} />

          {/* فیلترها در سمت چپ */}
          <div className="flex flex-col justify-center">
            
            <div className="flex flex-col gap-3">
              {/* دکمه‌های بازه سریع */}
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                <button onClick={() => handleQuickRange(7)} className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${isDark ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-800/60' : 'bg-blue-100 text-blue-700 hover:bg-blue-200'}`}>هفته گذشته</button>
                <button onClick={() => handleQuickRange(30)} className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${isDark ? 'bg-green-900/40 text-green-300 hover:bg-green-800/60' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>ماه گذشته</button>
                <button onClick={() => handleQuickRange(90)} className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${isDark ? 'bg-purple-900/40 text-purple-300 hover:bg-purple-800/60' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'}`}>۳ ماه گذشته</button>
                <button onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    setStartDate(today);
                    setEndDate(today);
                  }}
                  className={`px-2.5 py-1 rounded text-[11px] font-bold transition-colors ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  فقط امروز
                </button>
              </div>

              {/* ردیف اول: تاریخ شروع و پایان */}
              <div className="flex flex-wrap gap-3 items-end justify-center md:justify-start">
                <div className="w-[140px]">
                  <JalaliDatePicker name="start_date" label="تاریخ شروع" value={startDate} onChange={handleStartDateChange} modal />
                </div>
                <div className="w-[140px]">
                  <JalaliDatePicker name="end_date" label="تاریخ پایان" value={endDate} onChange={handleEndDateChange} modal />
                </div>
              </div>

              {/* ردیف دوم: شب‌کاری */}
{/* ردیف دوم: شب‌کاری */}
              <div className="flex flex-wrap gap-3 items-end justify-center md:justify-start">
                <div className="w-[110px]">
                  <label className={`text-[11px] mb-1 block font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>شروع شب</label>
                  <input type="time" value={nightStart} onChange={(e) => setNightStart(e.target.value)} className={`w-full h-[32px] px-1 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold font-mono dir-ltr text-center transition-colors ${isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`} />
                </div>
                <div className="w-[110px]">
                  <label className={`text-[11px] mb-1 block font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>پایان شب</label>
                  <input type="time" value={nightEnd} onChange={(e) => setNightEnd(e.target.value)} className={`w-full h-[32px] px-1 rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold font-mono dir-ltr text-center transition-colors ${isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`} />
                </div>
              </div>
              {/* ردیف سوم: پروژه و جستجو */}
              <div className="flex flex-wrap gap-3 items-end justify-center md:justify-start">
                <div className="w-[160px]">
                  <label className={`text-[11px] mb-1 block font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>پروژه</label>
                  <select value={filters.projectId || ''} onChange={(e) => dispatch(setTimesheetFilters({ projectId: e.target.value || null }))} className={`w-full h-[32px] pr-2 pl-8 py-0 leading-normal rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold transition-colors ${isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`}>
                    <option value="">همه پروژه‌ها</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-[160px]">
                  <label className={`text-[11px] mb-1 block font-bold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>جستجو</label>
                  <input type="text" value={filters.search || ''} onChange={(e) => dispatch(setTimesheetFilters({ search: e.target.value }))} placeholder="نام کارگر..." className={`w-full h-[32px] px-2 py-1 leading-normal rounded-md border focus:ring-1 focus:ring-blue-500 focus:outline-none text-xs font-semibold transition-colors ${isDark ? 'bg-gray-800 text-gray-200 border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`} />
                </div>
              </div>

            </div>

            {/* ردیف چهارم: راهنمای بازه و دکمه پهن نمایش */}
            <div className="mt-5 flex flex-col gap-3 w-full">
              {startDate && endDate && (
                <div className={`text-[11px] flex flex-wrap items-center justify-center md:justify-start gap-1.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <span>بازه: <span className={`font-bold ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{formatJalaliDateLong(startDate)} تا {formatJalaliDateLong(endDate)}</span></span>
                  <span className="opacity-50">|</span>
                  <span className="font-semibold">({moment(endDate).diff(moment(startDate), 'days') + 1} روز)</span>
                  <span className="opacity-50">|</span>
                  <span className={`px-2 py-0.5 rounded font-semibold ${isDark ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>
                    شب: {nightStart} تا {nightEnd}
                  </span>
                </div>
              )}
              
              <button 
                onClick={handleSearch} 
                disabled={!startDate || !endDate || loading} 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed shadow-md flex items-center justify-center gap-2"
              >
                {loading ? 'در حال دریافت اطلاعات...' : 'نمایش تایم‌شیت'}
              </button>
            </div>

          </div>
        </div>
      </div>

      {error && (
        <div className={`flex p-3 rounded-lg border mb-3 text-xs font-semibold no-print ${isDark ? 'bg-red-900/40 text-red-400 border-red-800' : 'bg-red-50 text-red-700 border-red-200'}`}>
          {error}
        </div>
      )}
      
      {loading && (
        <div className={`flex text-center justify-center py-4 text-xs font-semibold no-print ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
          در حال بارگذاری اطلاعات، لطفاً شکیبا باشید...
        </div>
      )}

      {/* تب‌ها و دکمه چاپ: دقیقاً قبل از شروع جداول و در مرکز */}
      {!loading && meta && (
        <div className={`flex flex-col md:flex-row items-center justify-between border-b pb-2 mb-3 mt-6 no-print ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          
          <div className="hidden md:block w-20"></div>

          {/* تب‌های اسلایدری (در مرکز) */}
          <div className="flex justify-center w-full md:w-auto mb-3 md:mb-0">
            <div className={`relative flex p-1 rounded-xl w-full md:w-[380px] ${isDark ? 'bg-gray-900 border border-gray-700 shadow-inner' : 'bg-gray-100 border border-gray-200 shadow-inner'}`}>
              
              {/* بک‌گراند متحرک (اسلایدر) */}
              <div
                className="absolute top-1 bottom-1 bg-blue-600 rounded-lg shadow-md transition-all duration-300 ease-out z-0"
                style={{
                  width: 'calc(33.33% - 5px)',
                  right: 
                    activeTab === 'summary' ? '4px' : 
                    activeTab === 'worker' ? 'calc(33.33% + 2px)' : 
                    'calc(66.66% + 1px)'
                }}
              ></div>

              <button
                onClick={() => setActiveTab('summary')}
                className={`flex-1 relative z-10 py-2 text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1 ${
                  activeTab === 'summary' ? 'text-white' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')
                }`}
              >
                📊 خلاصه
              </button>
              
              <button
                onClick={() => setActiveTab('worker')}
                className={`flex-1 relative z-10 py-2 text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1 ${
                  activeTab === 'worker' ? 'text-white' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')
                }`}
              >
                👷 بر اساس کارگر
              </button>
              
              <button
                onClick={() => setActiveTab('day')}
                className={`flex-1 relative z-10 py-2 text-xs font-bold transition-colors duration-300 flex items-center justify-center gap-1 ${
                  activeTab === 'day' ? 'text-white' : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800')
                }`}
              >
                📅 بر اساس روز
              </button>
            </div>
          </div>

          <div className="w-full md:w-20 flex justify-end">
            <button
              onClick={() => handlePrint()}
              className={`w-full md:w-auto px-4 py-2 rounded-md text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-colors ${isDark ? 'bg-gray-700 text-gray-200 hover:bg-gray-600' : 'bg-slate-700 hover:bg-slate-800 text-white'}`}
            >
              🖨️ چاپ
            </button>
          </div>

        </div>
      )}

      {/* محتوای اصلی (جداول) */}
      {!loading && meta && (
        <div ref={printRef} dir="rtl" lang="fa" className="mt-2 pb-10">
          {activeTab === 'summary' && <TimesheetSummary meta={meta} workers={workers} byWorker={byWorker} loading={loading} />}
          {activeTab === 'worker' && <TimesheetByWorker workers={workers} byWorker={byWorker} />}
          {activeTab === 'day' && <TimesheetByDay meta={meta} byDay={byDay} />}
        </div>
      )}

      {!loading && !meta && (
        <div className={`text-center py-8 border border-dashed rounded-xl mt-6 transition-colors ${
          isDark ? 'bg-gray-800 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-500'
        }`}>
          <div className="text-3xl mb-3 opacity-60">📅</div>
          <p className="text-sm font-semibold">
            بازه زمانی را انتخاب کنید و روی «نمایش تایم‌شیت» بزنید.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminTimesheetScreen;