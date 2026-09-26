import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import {
  fetchDailySummary,
  fetchFlexibleSummary
} from '../features/reports/reportSlice';

import { fetchProjects } from '../features/projects/projectSlice';

import JalaliDatePicker from '../components/JalaliDatePicker';
import { formatJalaliDateLong } from '../utils/dateUtils';

import moment from 'moment-jalaali';
moment.loadPersian({ usePersianDigits: false });

/* ================= Utils ================= */

const formatTime = (iso) => {
  if (!iso) return '---';
  const m = moment(iso);
  return m.isValid() ? m.format('HH:mm') : '---';
};

/* ================= Media ================= */

const MediaGrid = ({ files, isDark }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {files.map((m) => (
        <MediaItem key={m.id} media={m} isDark={isDark} />
      ))}
    </div>
  );
};

const MediaItem = ({ media, isDark }) => {
  const wrapper = `rounded-xl border p-2 transition-colors ${
    isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-300 bg-white'
  }`;

  switch (media.preview_type) {
    case 'image':
      return (
        <div className={wrapper}>
          <img
            src={media.file}
            alt=""
            loading="lazy"
            className="w-full h-40 object-cover rounded-lg"
          />
        </div>
      );

    case 'video':
      return (
        <div className={wrapper}>
          <video
            src={media.file}
            controls
            preload="metadata"
            className="w-full h-40 object-cover rounded-lg bg-black"
          />
        </div>
      );

    case 'audio':
      return (
        <div className={wrapper}>
          <audio
            src={media.file}
            controls
            preload="none"
            className="w-full"
          />
        </div>
      );

    default:
      return (
        <div className={`${wrapper} flex items-center justify-center p-6`}>
          <a
            href={media.file}
            target="_blank"
            rel="noopener noreferrer"
            className={`font-bold text-sm px-4 py-2 rounded-lg transition-colors ${
              isDark ? 'bg-blue-900/30 text-blue-400 hover:bg-blue-900/50' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
            }`}
          >
            دانلود فایل
          </a>
        </div>
      );
  }
};

/* ================= Screen ================= */

const VIEW_MODE = {
  SINGLE: 'SINGLE',
  LIST: 'LIST',
};

const DailySummaryScreen = () => {
  const dispatch = useDispatch();

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState(null);

  const mode = useSelector((state) => state.theme?.mode || "dark");
  const isDark = mode === "dark";

  const isSingleMode = viewMode === VIEW_MODE.SINGLE;
  const isListMode = viewMode === VIEW_MODE.LIST;

  const {
    dailySummary,
    dailySummaryList,
    summaryLoading,
    summaryError
  } = useSelector((state) => state.reports);

  const { list: projectsList, loading: projectsLoading } = useSelector(
    (state) => state.projects
  );

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  /* ================= Derived ================= */

  const sortedReports = useMemo(() => {
    if (!dailySummary?.hierarchical_reports?.length) return [];
    return [...dailySummary.hierarchical_reports].sort(
      (a, b) =>
        (a.author_position?.hierarchy_level ?? 0) -
        (b.author_position?.hierarchy_level ?? 0)
    );
  }, [dailySummary?.hierarchical_reports]);

  const hasAttendance =
    dailySummary?.workers_attendance?.length > 0;

  const hasSummary =
    Boolean(dailySummary && dailySummary.id && !summaryLoading);

  const hasList =
    Boolean(dailySummaryList && dailySummaryList.length > 0);

  const nothingSelected =
    !viewMode && !selectedProjectId && !selectedDate;

  /* ================= Helpers ================= */

  const getHierarchyIndent = (level = 0) =>
    ['mr-0', 'mr-6 md:mr-8', 'mr-10 md:mr-16', 'mr-14 md:mr-24'][level] || 'mr-0';

  const getHierarchyIcon = (level = 0) =>
    ['👑', '👔', '🔧', '👷'][level] || '👤';

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: ['پیش‌نویس', isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-700'],
      SUBMITTED: ['منتظر تأیید', isDark ? 'bg-yellow-900/40 text-yellow-400' : 'bg-yellow-100 text-yellow-700'],
      APPROVED: ['تأیید شده', isDark ? 'bg-green-900/40 text-green-400' : 'bg-green-100 text-green-700'],
      REJECTED: ['رد شده', isDark ? 'bg-red-900/40 text-red-400' : 'bg-red-100 text-red-700'],
      FINAL: ['نهایی', isDark ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'],
    };
    const [label, bg] = map[status] || map.SUBMITTED;
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-bold ${bg}`}>
        {label}
      </span>
    );
  };

  /* ================= Render ================= */

  return (
    <div className={`min-h-[85vh] p-4 md:p-8 transition-colors duration-300 rtl ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className={`container mx-auto max-w-7xl rounded-2xl border-2 transition-all duration-300 shadow-xl overflow-hidden ${
        isDark ? 'border-blue-700 bg-gray-800' : 'border-blue-600 bg-white'
      }`}>

        {/* Header */}
        <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isSingleMode && 'خلاصه روزانه پروژه'}
            {isListMode && 'لیست گزارش‌ها'}
            {!isSingleMode && !isListMode && 'گزارش‌های روزانه'}
          </h1>

          {isSingleMode && dailySummary?.report_date && (
            <p className={`text-sm mt-2 font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
              {formatJalaliDateLong(dailySummary.report_date)}
            </p>
          )}
        </div>

        {/* Filters */}
        <div className={`p-6 border-b flex flex-wrap gap-4 items-end ${
          isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex flex-col min-w-[220px] flex-1 md:flex-none">
             <label className={`text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>انتخاب پروژه</label>
             <select
              value={selectedProjectId ?? ''}
              disabled={projectsLoading}
              onChange={(e) =>
                setSelectedProjectId(e.target.value ? Number(e.target.value) : null)
              }
              className={`px-4 py-3 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                isDark ? 'bg-gray-900 text-white border-gray-600' : 'bg-white text-gray-900 border-gray-300'
              }`}
            >
              <option value="">انتخاب پروژه</option>
              {projectsList?.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col min-w-[220px] flex-1 md:flex-none">
            <JalaliDatePicker
              name="report_date"
              label="تاریخ"
              value={selectedDate || ''}
              onChange={(e) => setSelectedDate(e.target.value || null)}
              modal
            />
          </div>

          <button
            onClick={() => {
              if (selectedProjectId && selectedDate) {
                setViewMode(VIEW_MODE.SINGLE);
                dispatch(fetchDailySummary({
                  projectId: selectedProjectId,
                  date: selectedDate
                }));
              } else {
                setViewMode(VIEW_MODE.LIST);
                dispatch(fetchFlexibleSummary({
                  projectId: selectedProjectId,
                  date: selectedDate
                }));
              }
            }}
            disabled={summaryLoading || (!selectedProjectId && !selectedDate)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl text-sm font-bold disabled:opacity-50 transition-colors flex-1 md:flex-none flex justify-center items-center h-[46px]"
          >
            {summaryLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'نمایش'}
          </button>
        </div>

        {summaryError && (
          <div className={`m-6 p-4 rounded-xl border text-sm font-bold ${
            isDark ? 'bg-red-900/20 border-red-700 text-red-400' : 'bg-red-50 border-red-300 text-red-700'
          }`}>
            {summaryError}
          </div>
        )}

        {/* EMPTY STATE */}
        {nothingSelected && (
          <div className="p-8">
            <div className={`border-2 border-dashed rounded-2xl p-12 text-center font-bold ${
              isDark ? 'border-gray-700 bg-gray-800/50 text-gray-400' : 'border-gray-300 bg-gray-50 text-gray-500'
            }`}>
              برای مشاهده گزارش، پروژه یا تاریخ را انتخاب کنید و روی «نمایش» بزنید
            </div>
          </div>
        )}

        {/* ================= LIST VIEW ================= */}
        {isListMode && hasList && (
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
            {dailySummaryList.map((summary) => (
              <div
                key={summary.id}
                onClick={() => {
                  setSelectedProjectId(summary.project);
                  setSelectedDate(summary.report_date);
                  setViewMode(VIEW_MODE.SINGLE);
                  dispatch(fetchDailySummary({
                    projectId: summary.project,
                    date: summary.report_date
                  }));
                }}
                className={`border rounded-2xl p-5 cursor-pointer transition-all hover:-translate-y-1 hover:shadow-md ${
                  isDark ? 'bg-gray-800 border-gray-700 hover:border-blue-500' : 'bg-white border-gray-200 hover:border-blue-500'
                }`}
              >
                <div className="flex justify-between items-center mb-3 pb-3 border-b border-dashed border-gray-500/30">
                  <div className={`font-black text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {summary.project_name}
                  </div>
                  <div className={`text-xs font-bold px-2.5 py-1 rounded border ${
                    isDark ? 'bg-gray-700 border-gray-600 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-600'
                  }`}>
                    {formatJalaliDateLong(summary.report_date)}
                  </div>
                </div>

                <div className={`text-sm font-bold flex justify-between items-center mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <span>تعداد گزارش‌ها:</span>
                  <span className={`px-2 py-0.5 rounded-md ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}>
                    {summary.hierarchical_reports?.length || 0}
                  </span>
                </div>

                <div className={`text-xs font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                  مشاهده جزئیات ←
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ================= SINGLE VIEW ================= */}
        {isSingleMode && hasSummary && (
          <div className="p-6 space-y-6">
            <div className={`p-6 rounded-2xl border ${
              isDark ? 'bg-gray-800/80 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h2 className={`text-xl font-black mb-6 pb-4 border-b ${isDark ? 'text-white border-gray-700' : 'text-gray-800 border-gray-200'}`}>
                گزارش‌ها
              </h2>

              {sortedReports.length === 0 ? (
                <p className={`text-center py-4 font-bold ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  گزارشی ثبت نشده است.
                </p>
              ) : (
                <div className="space-y-5">
                  {sortedReports.map((r) => (
                    <div
                      key={r.id}
                      className={`p-5 rounded-2xl border transition-colors ${getHierarchyIndent(r.author_position?.hierarchy_level)} ${
                        isDark ? 'bg-gray-900 border-gray-700 hover:border-gray-500' : 'bg-gray-50 border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-3 mb-4">
                        <div className="flex gap-3 items-center">
                          <span className={`w-12 h-12 flex items-center justify-center text-2xl rounded-xl border ${
                            isDark ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'
                          }`}>
                            {getHierarchyIcon(r.author_position?.hierarchy_level)}
                          </span>
                          <div>
                            <div className={`text-base font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {r.author_name}
                            </div>
                            <div className={`text-xs font-bold mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {r.position_title} <span className="opacity-50 mx-1">|</span> <span className="font-mono text-blue-500">{formatTime(r.created_at)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="self-end sm:self-center">
                          {getStatusBadge(r.status)}
                        </div>
                      </div>

                      {r.work_summary && (
                        <div className={`p-4 rounded-xl border text-sm font-medium leading-loose break-words whitespace-pre-wrap ${
                          isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
                        }`}>
                          {r.work_summary}
                        </div>
                      )}

                      <MediaGrid files={r.media_files} isDark={isDark} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DailySummaryScreen;