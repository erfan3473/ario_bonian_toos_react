// src/screens/ReportDetailScreen.js

import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, Link } from 'react-router-dom';
import { fetchReportDetails, resetReportDetails } from '../features/dailyReports/dailyReportSlice';
import Loader from '../components/Loader';
import Message from '../components/Message';

function ReportDetailScreen() {
  const { reportId } = useParams();
  const dispatch = useDispatch();

  const { selectedReport: report, loading, error } = useSelector((state) => state.dailyReports);

  useEffect(() => {
    dispatch(fetchReportDetails(reportId));

    // Cleanup function: وقتی کامپوننت از بین میره، جزئیات گزارش رو پاک میکنه
    return () => {
        dispatch(resetReportDetails());
    }
  }, [dispatch, reportId]);

  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('fa-IR', {
      year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-100 min-h-screen">
      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : report ? (
        <div>
          {/* بخش هدر */}
          <div className="bg-white p-6 rounded-lg shadow-md mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              گزارش روز: {formatDate(report.report_date)}
            </h1>
            <p className="text-lg text-gray-600">
              پروژه: <Link to={`/project/${report.project.id}/reports`} className="text-indigo-600 hover:underline">{report.project.name}</Link>
            </p>
            {report.summary && <p className="mt-4 text-gray-700 bg-gray-50 p-3 rounded-md"><strong>خلاصه مدیر:</strong> {report.summary}</p>}
          </div>

          {/* بخش‌های مختلف گزارش */}
          <div className="space-y-6">
            {/* گزارش مدیر پروژه */}
            {report.manager_report && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">👷 گزارش مسئول پروژه</h2>
                <p><strong>ثبت کننده:</strong> {report.manager_report.author_name}</p>
                <p><strong>وضعیت آب و هوا:</strong> {report.manager_report.weather}</p>
                <p className="mt-2"><strong>خلاصه کارها:</strong> {report.manager_report.work_summary}</p>
                {report.manager_report.incidents && <p className="mt-2"><strong>وقایع خاص:</strong> {report.manager_report.incidents}</p>}
              </div>
            )}

            {/* گزارش تاسیسات */}
            {report.facilities_report && (
              <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">🔧 گزارش تاسیسات</h2>
                <p><strong>ثبت کننده:</strong> {report.facilities_report.author_name}</p>
                <p className="mt-2"><strong>کارهای انجام شده:</strong> {report.facilities_report.tasks_completed}</p>
                {report.facilities_report.issues_found && <p className="mt-2"><strong>مشکلات مشاهده شده:</strong> {report.facilities_report.issues_found}</p>}
                {report.facilities_report.materials_used.length > 0 && (
                    <div className="mt-4">
                        <h4 className="font-bold">مصالح مصرفی:</h4>
                        <ul className="list-disc list-inside mt-2">
                            {report.facilities_report.materials_used.map(material => (
                                <li key={material.id}>{material.item.name}: {material.quantity_used} {material.item.unit}</li>
                            ))}
                        </ul>
                    </div>
                )}
              </div>
            )}
            
            {/* گزارش نگهبانی */}
            {report.security_report && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">🛡️ گزارش نگهبانی</h2>
                    <p><strong>نگهبان:</strong> {report.security_report.author_name}</p>
                    {report.security_report.general_notes && <p className="mt-2"><strong>یادداشت‌های کلی:</strong> {report.security_report.general_notes}</p>}
                    {report.security_report.logs.length > 0 && (
                         <div className="mt-4">
                            <h4 className="font-bold">گزارش ورود و خروج:</h4>
                            <ul className="list-decimal list-inside mt-2 space-y-1">
                                {report.security_report.logs.map(log => (
                                    <li key={log.id}>
                                        <strong>{log.log_type === 'ENTRY' ? 'ورود' : 'خروج'}:</strong> {log.person_name} ({new Date(log.log_time).toLocaleTimeString('fa-IR')})
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* لیست کارگران حاضر */}
            {report.workers.length > 0 && (
                <div className="bg-white p-6 rounded-lg shadow-md">
                    <h2 className="text-2xl font-semibold text-gray-800 border-b pb-2 mb-4">👥 کارگران حاضر</h2>
                    <ul className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {report.workers.map(worker => (
                            <li key={worker.id} className="bg-gray-100 p-2 rounded">{worker.name}</li>
                        ))}
                    </ul>
                </div>
            )}
          </div>
        </div>
      ) : (
        <p className="text-center text-gray-500 mt-8">گزارشی برای نمایش وجود ندارد.</p>
      )}
    </div>
  );
}

export default ReportDetailScreen;