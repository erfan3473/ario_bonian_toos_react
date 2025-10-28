// src/screens/DailyReportListScreen.js
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { fetchDailyReports } from '../features/dailyReports/dailyReportSlice';
import ReportCard from '../components/ReportCard';
import Loader from '../components/Loader'; // کامپوننت لودر خودتان
import Message from '../components/Message'; // کامپوننت پیام خودتان

function DailyReportListScreen() {
  const { id } = useParams(); // گرفتن آیدی پروژه از URL
  const dispatch = useDispatch();

  const { reports, loading, error } = useSelector((state) => state.dailyReports);

  useEffect(() => {
    if (id) {
      dispatch(fetchDailyReports(id));
    }
  }, [dispatch, id]);

  return (
    <div className="container mx-auto p-4 md:p-6 bg-gray-50 min-h-screen">
      <h1>
        لیست گزارش‌های روزانه پروژه
      </h1>

      {loading ? (
        <Loader />
      ) : error ? (
        <Message variant="danger">{error}</Message>
      ) : (
        <>
          {reports.length === 0 ? (
            <p className="text-center text-gray-500 mt-8">هیچ گزارشی برای این پروژه یافت نشد.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {reports.map((report) => (
                <ReportCard key={report.id} report={report} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default DailyReportListScreen;