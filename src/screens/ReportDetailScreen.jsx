// src/screens/ReportDetailScreen.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import {
  fetchReportDetails,
  resetReportDetails,
} from '../features/dailyReports/dailyReportSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

function ReportDetailScreen() {
  const { reportId } = useParams();
  const dispatch = useDispatch();

  const {
    selectedReport: report,
    loading,
    error,
  } = useSelector((state) => state.dailyReports);

  useEffect(() => {
    dispatch(fetchReportDetails(reportId));

    return () => {
      dispatch(resetReportDetails());
    };
  }, [dispatch, reportId]);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-100 min-h-screen">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : report ? (
        <div className="space-y-6">
          {/* ===== هدر ===== */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">
              گزارش روز: {formatDate(report.report_date)}
            </h1>
            <p className="text-lg text-gray-800 mt-2">
              پروژه:{' '}
              <Link
                to={`/projects/${report.project.id}/reports`} // ✅ درست شد
                className="text-indigo-600 font-semibold hover:underline"
              >
                {report.project.name}
              </Link>
            </p>
            {report.summary && (
              <p className="mt-4 text-gray-800 bg-gray-50 p-3 rounded-md border border-gray-200">
                <strong>خلاصه مدیر:</strong> {report.summary}
              </p>
            )}
          </div>

          {/* ===== گزارش مسئول پروژه ===== */}
          {report.manager_report && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="flex items-center text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">
                <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                👷 گزارش مسئول پروژه
              </h2>
              <p className="text-gray-800">
                <strong>ثبت کننده:</strong> {report.manager_report.author_name}
              </p>
              <p className="text-gray-800">
                <strong>وضعیت آب و هوا:</strong> {report.manager_report.weather}
              </p>
              <p className="mt-2 text-gray-800">
                <strong>خلاصه کارها:</strong>{' '}
                {report.manager_report.work_summary}
              </p>
              {report.manager_report.incidents && (
                <p className="mt-2 text-gray-800">
                  <strong>وقایع خاص:</strong> {report.manager_report.incidents}
                </p>
              )}
            </div>
          )}

          {/* ===== گزارش تاسیسات ===== */}
          {report.facilities_report && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="flex items-center text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">
                <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
                🔧 گزارش تاسیسات
              </h2>
              <p className="text-gray-800">
                <strong>ثبت کننده:</strong>{' '}
                {report.facilities_report.author_name}
              </p>
              <p className="mt-2 text-gray-800">
                <strong>کارهای انجام شده:</strong>{' '}
                {report.facilities_report.tasks_completed}
              </p>
              {report.facilities_report.issues_found && (
                <p className="mt-2 text-gray-800">
                  <strong>مشکلات مشاهده شده:</strong>{' '}
                  {report.facilities_report.issues_found}
                </p>
              )}
              {report.facilities_report.materials_used.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-gray-900">مصالح مصرفی:</h4>
                  <ul className="list-disc list-inside mt-2 text-gray-800 space-y-1">
                    {report.facilities_report.materials_used.map((material) => (
                      <li key={material.id}>
                        {material.item.name}: {material.quantity_used}{' '}
                        {material.item.unit}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ===== گزارش نگهبانی ===== */}
          {report.security_report && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="flex items-center text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></span>
                🛡️ گزارش نگهبانی
              </h2>
              <p className="text-gray-800">
                <strong>نگهبان:</strong>{' '}
                {report.security_report.author_name}
              </p>
              {report.security_report.general_notes && (
                <p className="mt-2 text-gray-800">
                  <strong>یادداشت‌های کلی:</strong>{' '}
                  {report.security_report.general_notes}
                </p>
              )}
              {report.security_report.logs.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-bold text-gray-900">
                    گزارش ورود و خروج:
                  </h4>
                  <ul className="list-decimal list-inside mt-2 space-y-1 text-gray-800">
                    {report.security_report.logs.map((log) => (
                      <li key={log.id}>
                        <strong>
                          {log.log_type === 'ENTRY' ? 'ورود' : 'خروج'}:
                        </strong>{' '}
                        {log.person_name} (
                        {new Date(log.log_time).toLocaleTimeString('fa-IR')})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* ===== کارگران حاضر ===== */}
          {report.workers.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-200">
              <h2 className="flex items-center text-2xl font-semibold text-gray-900 border-b pb-2 mb-4">
                <span className="w-3 h-3 bg-purple-500 rounded-full mr-2"></span>
                👥 کارگران حاضر
              </h2>
              <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {report.workers.map((worker) => (
                  <li
                    key={worker.id}
                    className="bg-gray-50 border border-gray-200 text-gray-800 p-2 rounded text-center"
                  >
                    {worker.name}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">
          گزارشی برای نمایش وجود ندارد.
        </p>
      )}
    </div>
  );
}

export default ReportDetailScreen;
