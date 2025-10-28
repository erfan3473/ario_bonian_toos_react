// src/components/ReportCard.js

import React from 'react';
import { Link } from 'react-router-dom';

function ReportCard({ report }) {
  // فرمت کردن تاریخ به فرمت خوانای فارسی
  const formattedDate = new Date(report.report_date).toLocaleDateString('fa-IR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="bg-white shadow-md rounded-lg p-4 hover:shadow-xl transition-shadow duration-300 text-gray-800">
      <h3 className="text-lg font-bold">گزارش روز: {formattedDate}</h3>
      <p className="text-gray-600 mt-2 truncate">{report.summary || 'خلاصه‌ای ثبت نشده است.'}</p>
      
      {/* ✅ این لینک را اصلاح کنید تا با مسیر جدید در App.jsx هماهنگ باشد 
      */}
      <Link 
        to={`/reports/${report.id}`} // آدرس باید بشود مثلا /reports/1
        className="text-indigo-600 hover:text-indigo-800 font-semibold mt-4 inline-block"
      >
        مشاهده جزئیات →
      </Link>
    </div>
  );
}

export default ReportCard;