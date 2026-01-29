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

const MediaGrid = ({ files }) => {
  if (!files || files.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      {files.map((m) => (
        <MediaItem key={m.id} media={m} />
      ))}
    </div>
  );
};

const MediaItem = ({ media }) => {
  const wrapper = 'rounded-lg border border-gray-300 bg-white p-2';

  switch (media.preview_type) {
    case 'image':
      return (
        <div className={wrapper}>
          <img
            src={media.file}
            alt=""
            loading="lazy"                 // NEW
            className="w-full rounded-md"
          />
        </div>
      );

    case 'video':
      return (
        <div className={wrapper}>
          <video
            src={media.file}
            controls
            preload="metadata"             // NEW
            className="w-full rounded-md"
          />
        </div>
      );

    case 'audio':
      return (
        <div className={wrapper}>
          <audio
            src={media.file}
            controls
            preload="none"                 // NEW
            className="w-full"
          />
        </div>
      );

    default:
      return (
        <div className={wrapper}>
          <a
            href={media.file}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-700 font-semibold text-sm"
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
  }, [dailySummary?.hierarchical_reports]); // FIX (safe)

  const hasAttendance =
    dailySummary?.workers_attendance?.length > 0;

  const hasSummary =
    Boolean(dailySummary && dailySummary.id && !summaryLoading);

  const hasList =
    Boolean(dailySummaryList && dailySummaryList.length > 0);

  const nothingSelected =
    !viewMode && !selectedProjectId && !selectedDate; // NEW

  /* ================= Helpers ================= */

  const getHierarchyIndent = (level = 0) =>
    ['mr-0', 'mr-8', 'mr-16', 'mr-24'][level] || 'mr-0';

  const getHierarchyIcon = (level = 0) =>
    ['👑', '👔', '🔧', '👷'][level] || '👤';

  const getStatusBadge = (status) => {
    const map = {
      DRAFT: ['پیش‌نویس', 'bg-gray-100'],
      SUBMITTED: ['منتظر تأیید', 'bg-yellow-100'],
      APPROVED: ['تأیید شده', 'bg-green-100'],
      REJECTED: ['رد شده', 'bg-red-100'],
      FINAL: ['نهایی', 'bg-blue-100'],
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
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white text-gray-900">

      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">
          {isSingleMode && 'خلاصه روزانه پروژه'}
          {isListMode && 'لیست گزارش‌ها'}
        </h1>

        {isSingleMode && dailySummary?.report_date && (
          <p className="text-sm mt-2">
            {formatJalaliDateLong(dailySummary.report_date)}
          </p>
        )}
      </div>

      {/* Filters */}
      <div className="bg-gray-50 p-4 rounded-xl border mb-6 flex flex-wrap gap-4 items-end">
        <select
          value={selectedProjectId ?? ''}
          disabled={projectsLoading}
          onChange={(e) =>
            setSelectedProjectId(e.target.value ? Number(e.target.value) : null)
          }
          className="bg-white px-3 py-2 rounded-lg border text-sm min-w-[220px]"
        >
          <option value="">انتخاب پروژه</option>
          {projectsList?.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>

        <JalaliDatePicker
          name="report_date"
          label="تاریخ"
          value={selectedDate || ''}
          onChange={(e) => setSelectedDate(e.target.value || null)}
          modal
        />

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
          className="bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
        >
          نمایش
        </button>
      </div>

      {summaryError && (
        <div className="bg-red-100 border border-red-300 p-4 rounded text-sm">
          {summaryError}
        </div>
      )}

      {/* EMPTY STATE */}
      {nothingSelected && (
        <div className="border rounded-xl p-8 text-center text-gray-500 bg-gray-50">
          برای مشاهده گزارش، پروژه یا تاریخ را انتخاب کنید و روی «نمایش» بزنید
        </div>
      )}

      {/* ================= LIST VIEW ================= */}
      {isListMode && hasList && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              className="border rounded-xl p-4 bg-white cursor-pointer hover:border-blue-500"
            >
              <div className="flex justify-between mb-2">
                <div className="font-bold text-sm">
                  {summary.project_name}
                </div>
                <div className="text-xs text-gray-500">
                  {formatJalaliDateLong(summary.report_date)}
                </div>
              </div>

              <div className="text-sm text-gray-700">
                تعداد گزارش‌ها: {summary.hierarchical_reports?.length || 0}
              </div>

              <div className="text-xs text-blue-600 mt-2">
                مشاهده جزئیات →
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ================= SINGLE VIEW ================= */}
      {isSingleMode && hasSummary && (
        <div className="space-y-6">
          <div className="bg-white p-5 rounded-xl border">
            <h2 className="text-lg font-bold mb-4">گزارش‌ها</h2>

            <div className="space-y-4">
              {sortedReports.map((r) => (
                <div
                  key={r.id}
                  className={`bg-gray-50 p-4 rounded-lg border ${getHierarchyIndent(
                    r.author_position?.hierarchy_level
                  )}`}
                >
                  <div className="flex justify-between mb-3">
                    <div className="flex gap-2">
                      <span className="text-xl">
                        {getHierarchyIcon(r.author_position?.hierarchy_level)}
                      </span>
                      <div>
                        <div className="text-sm font-semibold">
                          {r.author_name}
                        </div>
                        <div className="text-xs">
                          {r.position_title} · {formatTime(r.created_at)}
                        </div>
                      </div>
                    </div>
                    {getStatusBadge(r.status)}
                  </div>

                  {r.work_summary && (
                    <div className="bg-white p-3 rounded border text-sm whitespace-pre-wrap">
                      {r.work_summary}
                    </div>
                  )}

                  <MediaGrid files={r.media_files} />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailySummaryScreen;
