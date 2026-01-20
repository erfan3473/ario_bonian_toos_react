import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';

import { fetchDailySummary } from '../features/reports/reportSlice';
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

/* ================= Media (Inline) ================= */

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
          <img src={media.file} alt="" className="w-full rounded-md" />
        </div>
      );

    case 'video':
      return (
        <div className={wrapper}>
          <video src={media.file} controls className="w-full rounded-md" />
        </div>
      );

    case 'audio':
      return (
        <div className={wrapper}>
          <audio src={media.file} controls className="w-full" />
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

const DailySummaryScreen = () => {
  const dispatch = useDispatch();

  const { dailySummary, summaryLoading, summaryError } = useSelector(
    (state) => state.reports
  );
  const { list: projectsList, loading: projectsLoading } = useSelector(
    (state) => state.projects
  );

  const [selectedProjectId, setSelectedProjectId] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  useEffect(() => {
    dispatch(fetchProjects());
  }, [dispatch]);

  useEffect(() => {
    if (selectedProjectId && selectedDate) {
      dispatch(fetchDailySummary({ projectId: selectedProjectId, date: selectedDate }));
    }
  }, [dispatch, selectedProjectId, selectedDate]);

  const sortedReports = useMemo(() => {
    if (!dailySummary?.hierarchical_reports?.length) return [];
    return [...dailySummary.hierarchical_reports].sort(
      (a, b) =>
        (a.author_position?.hierarchy_level ?? 0) -
        (b.author_position?.hierarchy_level ?? 0)
    );
  }, [dailySummary?.hierarchical_reports]);

  const hasAttendance =
    dailySummary?.workers_attendance &&
    dailySummary.workers_attendance.length > 0;

  const hasRealReport =
    dailySummary && dailySummary.id !== 0 && !summaryLoading;

  const hasSummary = hasRealReport || hasAttendance;

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
      <span className={`px-3 py-1 rounded-full text-xs font-bold text-gray-900 ${bg}`}>
        {label}
      </span>
    );
  };

  const getAttendanceStatusBadge = (status) => {
    const map = {
      PRESENT: 'bg-green-50 text-green-700 border border-green-200',
      ABSENT: 'bg-red-50 text-red-700 border border-red-200',
      LEAVE: 'bg-blue-50 text-blue-700 border border-blue-200',
      HALF_DAY: 'bg-yellow-50 text-yellow-700 border border-yellow-200',
    };
    const labels = {
      PRESENT: 'حاضر',
      ABSENT: 'غایب',
      LEAVE: 'مرخصی',
      HALF_DAY: 'نیم‌روز',
    };

    return (
      <span className={`px-2 py-1 rounded-full text-[11px] font-bold ${map[status]}`}>
        {labels[status] || status}
      </span>
    );
  };

  /* ================= Render ================= */

  return (
    <div className="container mx-auto px-4 py-6 rtl min-h-screen bg-white text-gray-900">

      {/* Header */}
      <div className="mb-6 border-b pb-4">
        <h1 className="text-2xl font-bold">خلاصه روزانه پروژه</h1>
        {dailySummary?.report_date && hasSummary && (
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
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <JalaliDatePicker
          name="report_date"
          label="تاریخ"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          modal
        />

        <button
          onClick={() =>
            dispatch(fetchDailySummary({ projectId: selectedProjectId, date: selectedDate }))
          }
          disabled={!selectedProjectId || summaryLoading}
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

      {/* Content */}
      {hasSummary && (
        <div className="space-y-6">

          {/* Reports */}
          {hasRealReport && (
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
          )}

          {/* Attendance */}
          {hasAttendance && (
            <div className="bg-white p-5 rounded-xl border">
              <h2 className="text-lg font-bold mb-3">👥 حضور و غیاب</h2>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-right">نام</th>
                      <th className="px-3 py-2 text-center">ورود</th>
                      <th className="px-3 py-2 text-center">خروج</th>
                      <th className="px-3 py-2 text-center">اضافه‌کار</th>
                      <th className="px-3 py-2 text-center">وضعیت</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {dailySummary.workers_attendance.map((att, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">
                          {att.worker_name}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {formatTime(att.time_in)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {formatTime(att.time_out)}
                        </td>
                        <td className="px-3 py-2 text-center font-mono">
                          {att.overtime_hours > 0
                            ? `${att.overtime_hours} ساعت`
                            : '---'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {getAttendanceStatusBadge(att.status)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  );
};

export default DailySummaryScreen;
